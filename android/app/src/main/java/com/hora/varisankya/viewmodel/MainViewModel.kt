package com.hora.varisankya.viewmodel

import android.app.Application
import android.util.Log
import androidx.lifecycle.AndroidViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import androidx.lifecycle.ViewModel

import com.google.firebase.auth.FirebaseAuth
import com.google.firebase.firestore.FirebaseFirestore
import com.google.firebase.firestore.ListenerRegistration
import com.google.firebase.firestore.Query
import com.hora.varisankya.Subscription
import com.hora.varisankya.PaymentRecord
import com.hora.varisankya.SubscriptionNotificationWorker
import com.hora.varisankya.util.DateHelper
import com.hora.varisankya.util.PaymentRepository
import java.util.Calendar
import java.util.Date
import androidx.lifecycle.viewModelScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch
import kotlinx.coroutines.withContext

class MainViewModel(application: Application) : AndroidViewModel(application) {

    private val firestore = FirebaseFirestore.getInstance()
    private val auth = FirebaseAuth.getInstance()
    
    private var snapshotListener: ListenerRegistration? = null


    
    // Unified Data Holder
    private val _subscriptions = MutableStateFlow<List<Subscription>>(emptyList())
    val subscriptions: StateFlow<List<Subscription>> = _subscriptions.asStateFlow()
    
    private val _isLoading = MutableStateFlow(true)
    val isLoading: StateFlow<Boolean> = _isLoading.asStateFlow()
    
    private val _error = MutableStateFlow<String?>(null)
    val error: StateFlow<String?> = _error.asStateFlow()
    
    init {
        // No more tutorial observer needed
    }
    
    // Hero Section State
    data class HeroState(
        val totalAmount: Double = 0.0,
        val nextPayment: Subscription? = null,
        val overdueSubscriptions: List<Subscription> = emptyList(),
        val activeSubscriptions: List<Subscription> = emptyList()
    )
    private val _heroState = MutableStateFlow(HeroState())
    val heroState: StateFlow<HeroState> = _heroState.asStateFlow()

    fun loadSubscriptions() {
        val userId = auth.currentUser?.uid
        if (userId == null) {
            _isLoading.value = false
            return
        }
        
        // Remove existing listener if any
        snapshotListener?.remove()

        _isLoading.value = true
        
        snapshotListener = firestore.collection("users").document(userId).collection("subscriptions")
            .orderBy("dueDate", Query.Direction.ASCENDING)
            .addSnapshotListener { snapshots, e ->
                if (e != null) {
                    Log.w("MainViewModel", "Listen failed.", e)
                    _error.value = e.message
                    _isLoading.value = false
                    return@addSnapshotListener
                }

                viewModelScope.launch(Dispatchers.Default) {
                    val subs = snapshots?.toObjects(Subscription::class.java) ?: emptyList()
                    
                    // Sort: Active first, then by due date
                    val sortedSubscriptions = subs.sortedWith(compareByDescending<Subscription> { it.active }.thenBy { it.dueDate })
                    
                    val newHeroState = calculateHeroData(sortedSubscriptions)
                    
                    withContext(Dispatchers.Main) {
                        _subscriptions.value = sortedSubscriptions
                        _heroState.value = newHeroState
                        _isLoading.value = false
                    }
                }
            }
    }
    
    private fun calculateHeroData(allSubs: List<Subscription>): HeroState {
        val activeSubs = allSubs.filter { it.active && it.dueDate != null }
        
        val today = Calendar.getInstance()
        today.set(Calendar.HOUR_OF_DAY, 0)
        today.set(Calendar.MINUTE, 0)
        today.set(Calendar.SECOND, 0)
        today.set(Calendar.MILLISECOND, 0)

        val currentMonth = today.get(Calendar.MONTH)
        val currentYear = today.get(Calendar.YEAR)
        
        var totalAmount = 0.0
        val overdue = mutableListOf<Subscription>() // RESTORED
        
        for (sub in activeSubs) {
            if (sub.dueDate == null) continue
            
            val subDate = Calendar.getInstance()
            subDate.time = sub.dueDate
            subDate.set(Calendar.HOUR_OF_DAY, 0)
            subDate.set(Calendar.MINUTE, 0)
            subDate.set(Calendar.SECOND, 0)
            subDate.set(Calendar.MILLISECOND, 0)
            
            val isOverdue = subDate.before(today)
            val isCurrentMonth = subDate.get(Calendar.MONTH) == currentMonth && subDate.get(Calendar.YEAR) == currentYear
            
            if (isOverdue) {
                overdue.add(sub)
                totalAmount += sub.cost
            } else if (isCurrentMonth) {
                totalAmount += sub.cost
            }
        }
        
        // Next future payment
        val nextPayment = activeSubs
            .filter { it.dueDate != null }
            .filter { 
                val d = Calendar.getInstance()
                d.time = it.dueDate!!
                d.set(Calendar.HOUR_OF_DAY, 0)
                d.set(Calendar.MINUTE, 0)
                d.set(Calendar.SECOND, 0)
                d.set(Calendar.MILLISECOND, 0)
                !d.before(today)
            }
            .minByOrNull { it.dueDate!! }
            
        return HeroState(
            totalAmount = totalAmount,
            nextPayment = nextPayment,
            overdueSubscriptions = overdue,
            activeSubscriptions = activeSubs
        )
    }
    fun markAsPaid(subscription: Subscription, onSuccess: () -> Unit, onError: (Exception) -> Unit) {
        val userId = auth.currentUser?.uid ?: return
        val subId = subscription.id ?: return

        val payment = PaymentRecord(
            date = Date(),
            amount = subscription.cost,
            subscriptionName = subscription.name,
            subscriptionId = subId,
            currency = subscription.currency,
            userId = userId
        )

        val nextDueDate = DateHelper.calculateNextDueDate(subscription.dueDate ?: Date(), subscription.recurrence)

        val batch = firestore.batch()
        val subRef = firestore.collection("users").document(userId).collection("subscriptions").document(subId)
        val paymentRef = subRef.collection("payments").document()

        batch.set(paymentRef, payment)
        if (nextDueDate != null) {
            batch.update(subRef, "dueDate", nextDueDate)
        }

        // Optimistic pattern: fire asynchronously, invoke success callback immediately.
        // Firestore latency compensation updates the local cache; snapshot listeners
        // auto-refresh the UI. Failure callback is invoked non-blocking.
        batch.commit()
            .addOnSuccessListener {
                PaymentRepository.mirrorPaymentToFlat(firestore, userId, paymentRef.id, payment)
                SubscriptionNotificationWorker.refreshNow(
                    getApplication<Application>().applicationContext
                )
                onSuccess()
            }
            .addOnFailureListener { onError(it) }
    }
    
    fun updateSubscriptionStatus(subscription: Subscription, isActive: Boolean, onSuccess: () -> Unit, onError: (Exception) -> Unit = {}) {
        val userId = auth.currentUser?.uid ?: return
        val subId = subscription.id ?: return

        firestore.collection("users").document(userId).collection("subscriptions").document(subId)
            .update("active", isActive)
            .addOnSuccessListener {
                SubscriptionNotificationWorker.refreshNow(
                    getApplication<Application>().applicationContext
                )
                onSuccess()
            }
            .addOnFailureListener { onError(it) }
    }

    fun deleteSubscription(subscription: Subscription, onSuccess: () -> Unit, onError: (Exception) -> Unit = {}) {
        val userId = auth.currentUser?.uid ?: return
        val subId = subscription.id ?: return

        firestore.collection("users").document(userId).collection("subscriptions").document(subId)
            .delete()
            .addOnSuccessListener {
                SubscriptionNotificationWorker.refreshNow(
                    getApplication<Application>().applicationContext
                )
                onSuccess()
            }
            .addOnFailureListener { onError(it) }
    }

    override fun onCleared() {
        super.onCleared()
        snapshotListener?.remove()
    }
}
