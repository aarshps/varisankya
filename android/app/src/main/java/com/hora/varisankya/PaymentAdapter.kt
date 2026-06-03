package com.hora.varisankya

import android.view.HapticFeedbackConstants
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import android.widget.TextView
import androidx.recyclerview.widget.RecyclerView
import com.google.android.material.button.MaterialButton
import java.text.SimpleDateFormat
import java.util.Currency
import java.util.Locale

import androidx.recyclerview.widget.ListAdapter
import androidx.recyclerview.widget.DiffUtil

class PaymentAdapter(
    private val defaultCurrency: String,
    private val onEditClicked: ((PaymentRecord) -> Unit)? = null,
    private val onDeleteClicked: ((PaymentRecord) -> Unit)? = null,
    /**
     * When `true` (default) the row shows the subscription name on the primary
     * line and the date underneath — the layout used by the *All Payments*
     * page where rows span many subscriptions.
     *
     * When `false` the row collapses to a single line — the date moves up to
     * the primary slot and the secondary row is hidden. Used in the
     * per-subscription *Manage Payments* sheet where every row already
     * belongs to one known subscription, so repeating the name would just
     * waste vertical space.
     */
    private val showSubscriptionName: Boolean = true
) : ListAdapter<PaymentRecord, PaymentAdapter.ViewHolder>(PaymentDiffCallback()) {

    class ViewHolder(view: View) : RecyclerView.ViewHolder(view) {
        val primaryText: TextView = view.findViewById(R.id.text_subscription_name)
        val dateText: TextView = view.findViewById(R.id.text_payment_date)
        val amountText: TextView = view.findViewById(R.id.text_payment_amount)
        val btnDelete: com.google.android.material.button.MaterialButton = view.findViewById(R.id.btn_delete_payment)
        val secondaryRow: View = view.findViewById(R.id.secondary_row)
    }


    override fun onCreateViewHolder(parent: ViewGroup, viewType: Int): ViewHolder {
        val view = LayoutInflater.from(parent.context)
            .inflate(R.layout.item_payment_timeline, parent, false)
        return ViewHolder(view)
    }

    private val fullFormat = SimpleDateFormat("MMM dd, yyyy", Locale.getDefault())

    override fun onBindViewHolder(holder: ViewHolder, position: Int) {
        val payment = getItem(position)
        val context = holder.itemView.context

        val formattedDate = payment.date?.let { fullFormat.format(it) } ?: "Unknown date"

        if (showSubscriptionName) {
            holder.primaryText.text = payment.subscriptionName
            holder.dateText.text = formattedDate
            holder.secondaryRow.visibility = View.VISIBLE
        } else {
            // Collapse to one line — date promoted to the primary slot, the
            // bottom row of metadata removed entirely.
            holder.primaryText.text = formattedDate
            holder.secondaryRow.visibility = View.GONE
        }

        // Global currency formatting — matches the home subscription list
        val globalCurrency = PreferenceHelper.getCurrency(context)
        holder.amountText.text = CurrencyHelper.formatCurrency(context, payment.amount, globalCurrency)

        if (onEditClicked != null) {
            holder.itemView.setOnClickListener {
                PreferenceHelper.performHaptics(it, HapticFeedbackConstants.VIRTUAL_KEY)
                onEditClicked.invoke(payment)
            }
        } else {
            holder.itemView.setOnClickListener(null)
            holder.itemView.isClickable = false
        }

        if (onDeleteClicked != null) {
            holder.btnDelete.visibility = View.VISIBLE
            holder.btnDelete.setOnClickListener {
                PreferenceHelper.performHaptics(it, HapticFeedbackConstants.LONG_PRESS)
                onDeleteClicked.invoke(payment)
            }
        } else {
            holder.btnDelete.visibility = View.GONE
        }
    }

    class PaymentDiffCallback : DiffUtil.ItemCallback<PaymentRecord>() {
        override fun areItemsTheSame(oldItem: PaymentRecord, newItem: PaymentRecord): Boolean {
            // Use ID if available, otherwise assume unique object ref or criteria
            return oldItem.id == newItem.id
        }

        override fun areContentsTheSame(oldItem: PaymentRecord, newItem: PaymentRecord): Boolean {
            return oldItem == newItem
        }
    }
}
