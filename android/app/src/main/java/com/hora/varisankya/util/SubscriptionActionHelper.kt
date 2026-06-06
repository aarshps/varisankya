package com.hora.varisankya.util

import androidx.fragment.app.FragmentActivity
import androidx.recyclerview.widget.ItemTouchHelper
import androidx.recyclerview.widget.RecyclerView
import com.hora.varisankya.ConfirmationBottomSheet
import com.hora.varisankya.Subscription
import com.hora.varisankya.SubscriptionAdapter
import com.hora.varisankya.viewmodel.MainViewModel
import com.hora.varisankya.PreferenceHelper
import com.hora.varisankya.util.Analytics

class SubscriptionActionHelper(
    private val activity: FragmentActivity,
    private val viewModel: MainViewModel
) {

    fun setupSwipeActions(recyclerView: RecyclerView, adapter: SubscriptionAdapter, contentRoot: android.view.View) {
        val swipeCallback = object : SwipeActionCallback(activity) {
            override fun onSwipeRight(position: Int) {
                adapter.notifyItemChanged(position) // Reset view so it doesn't stay swiped out
                val subscription = adapter.getItem(position) ?: return
                confirmMarkAsPaid(subscription, contentRoot)
            }
        }

        val itemTouchHelper = ItemTouchHelper(swipeCallback)
        itemTouchHelper.attachToRecyclerView(recyclerView)
    }

    private fun confirmMarkAsPaid(subscription: Subscription, contentRoot: android.view.View) {
        val sheet = ConfirmationBottomSheet(
            title = "Mark as Paid",
            message = "Mark ${subscription.name} as paid for this cycle? This will update the due date.",
            positiveButtonText = "Mark Paid",
            onConfirm = {
                Analytics.paymentMarkPaidSwipe()
                viewModel.markAsPaid(subscription,
                    onSuccess = {
                        PreferenceHelper.performSuccessHaptic(contentRoot)
                    },
                    onError = {
                        com.google.android.material.snackbar.Snackbar.make(
                            contentRoot, "Failed to update — please try again",
                            com.google.android.material.snackbar.Snackbar.LENGTH_SHORT
                        ).show()
                    }
                )
            }
        )
        sheet.show(activity.supportFragmentManager, "ConfirmPaid")
    }
}
