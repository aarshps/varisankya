package com.hora.varisankya.util

import android.content.Context
import android.graphics.Canvas
import android.graphics.Color
import android.graphics.Paint
import android.graphics.PorterDuff
import android.graphics.PorterDuffXfermode
import android.graphics.RectF
import android.graphics.drawable.Drawable
import android.os.Build
import android.view.HapticFeedbackConstants
import android.view.View
import androidx.core.content.ContextCompat
import androidx.recyclerview.widget.ItemTouchHelper
import androidx.recyclerview.widget.RecyclerView
import com.google.android.material.card.MaterialCardView
import com.google.android.material.color.MaterialColors
import com.hora.varisankya.R
import com.hora.varisankya.PreferenceHelper
import kotlin.math.abs

abstract class SwipeActionCallback(private val context: Context) : ItemTouchHelper.SimpleCallback(0, ItemTouchHelper.LEFT or ItemTouchHelper.RIGHT) {

    private val deleteIcon: Drawable? = ContextCompat.getDrawable(context, R.drawable.ic_delete_sweep)
    private val pauseIcon: Drawable? = ContextCompat.getDrawable(context, R.drawable.ic_pause) // Ensure this exists or use standard
    private val checkIcon: Drawable? = ContextCompat.getDrawable(context, R.drawable.ic_check_circle)

    private val intrinsicWidth = deleteIcon?.intrinsicWidth ?: 0
    private val intrinsicHeight = deleteIcon?.intrinsicHeight ?: 0
    
    // Colors - Resolved Dynamically in onChildDraw or using cached context if theme doesn't change
    // Ideally resolve in Constructor if Context is Activity, but Theme might differ if using different contexts.
    // Safe to resolve lazily or in draw.
    
    // Using simple lazy properties if Context is reliable
    private val deleteColor by lazy { ThemeHelper.getErrorColor(context) }
    private val inactiveColor by lazy { ThemeHelper.getSurfaceContainerHighestColor(context) } 
    private val paidColor by lazy { 
        // Use Tertiary for "Positive" action if fits, or fall back to Primary.
        // M3 doesn't have "Success". Let's use Primary as per Plan, or a custom Green if user had it.
        // Reverting to Primary or Tertiary. Let's use PrimaryContainer for a softer look or just Primary.
        // Actually earlier we used 0xFF5BBd78. Let's try to find a dynamic match.
        // If we want M3E, we should use Semantic colors. 
        // "Marking as Paid" is a primary action.
        ThemeHelper.getPrimaryColor(context)
    }

    private val clearPaint = Paint().apply { xfermode = PorterDuffXfermode(PorterDuff.Mode.CLEAR) }
    private val backgroundPaint = Paint().apply { style = Paint.Style.FILL }
    
    // Haptic State Tracking
    private val hapticStateMap = mutableMapOf<Long, HapticState>()
    private data class HapticState(
        var hasTriggeredStart: Boolean = false,
        var hasTriggeredRelease: Boolean = false,
        var hasTriggeredDeep: Boolean = false
    )

    private val DEEP_SWIPE_THRESHOLD = 0.5f

    // "Sticky → release" damping (mirrors Android notification swipe feel).
    // While the finger is inside the sticky zone, the item only follows at
    // STICK_FOLLOW_RATIO; past the zone it follows 1:1, carrying the offset
    // it accumulated inside the zone. Net effect: small touches "stick", a
    // firmer drag "tears" past the resistance.
    private val STICK_ZONE = 0.15f
    private val STICK_FOLLOW_RATIO = 0.45f

    private fun applyStickyDamping(dX: Float, viewWidth: Float): Float {
        if (viewWidth <= 0f) return dX
        val sign = if (dX < 0f) -1f else 1f
        val rawProgress = abs(dX) / viewWidth
        val dampedProgress = if (rawProgress <= STICK_ZONE) {
            rawProgress * STICK_FOLLOW_RATIO
        } else {
            STICK_ZONE * STICK_FOLLOW_RATIO + (rawProgress - STICK_ZONE)
        }
        return sign * dampedProgress * viewWidth
    }

    override fun getMovementFlags(
        recyclerView: RecyclerView,
        viewHolder: RecyclerView.ViewHolder
    ): Int {
        if (viewHolder.itemViewType != 0) return 0 
        // Only allow RIGHT swipe
        return makeMovementFlags(0, ItemTouchHelper.RIGHT)
    }

    override fun onMove(
        recyclerView: RecyclerView,
        viewHolder: RecyclerView.ViewHolder,
        target: RecyclerView.ViewHolder
    ): Boolean {
        return false
    }

    override fun onChildDraw(
        c: Canvas,
        recyclerView: RecyclerView,
        viewHolder: RecyclerView.ViewHolder,
        dX: Float,
        dY: Float,
        actionState: Int,
        isCurrentlyActive: Boolean
    ) {
        val itemView = viewHolder.itemView
        val itemHeight = itemView.bottom - itemView.top
        val viewWidth = itemView.width.toFloat()
        val isCanceled = dX == 0f && !isCurrentlyActive

        if (isCanceled) {
            clearCanvas(c, itemView.right + dX, itemView.top.toFloat(), itemView.right.toFloat(), itemView.bottom.toFloat())
            super.onChildDraw(c, recyclerView, viewHolder, dX, dY, actionState, isCurrentlyActive)
            return
        }

        val id = viewHolder.itemId
        val state = hapticStateMap.getOrPut(id) { HapticState() }
        val rawProgress = abs(dX) / viewWidth

        if (dX == 0f) {
            state.hasTriggeredStart = false
            state.hasTriggeredRelease = false
            state.hasTriggeredDeep = false
        }

        // Damp the visual translation so the item "sticks" through the first
        // STICK_ZONE of finger movement, then releases. Use damped value for
        // both the item translation and the painted background reveal.
        val dampedDx = applyStickyDamping(dX, viewWidth)
        val radius = if (itemView is MaterialCardView) itemView.radius else 28f

        if (dampedDx > 0) {
            // SWIPE RIGHT → MARK AS PAID (positive action)
            val nudgeThreshold = 0.05f
            if (rawProgress > nudgeThreshold && !state.hasTriggeredStart) {
                PreferenceHelper.performHaptics(itemView, HapticFeedbackConstants.SEGMENT_TICK)
                state.hasTriggeredStart = true
            }
            // Stronger haptic at the "release" moment when the sticky zone ends
            if (rawProgress > STICK_ZONE && !state.hasTriggeredRelease) {
                PreferenceHelper.performHaptics(itemView, HapticFeedbackConstants.GESTURE_START)
                state.hasTriggeredRelease = true
            }

            backgroundPaint.color = paidColor

            val background = RectF(
                itemView.left.toFloat(),
                itemView.top.toFloat(),
                itemView.left.toFloat() + dampedDx,
                itemView.bottom.toFloat()
            )
            c.drawRoundRect(background, radius, radius, backgroundPaint)

            val iconMargin = (itemHeight - intrinsicHeight) / 2
            val iconTop = itemView.top + (itemHeight - intrinsicHeight) / 2
            val iconBottom = iconTop + intrinsicHeight
            val iconLeft = itemView.left + iconMargin
            val iconRight = itemView.left + iconMargin + intrinsicWidth

            checkIcon?.setBounds(iconLeft, iconTop, iconRight, iconBottom)
            checkIcon?.setTint(ThemeHelper.getOnPrimaryColor(context))
            checkIcon?.draw(c)
        }

        // No logic for Left Swipe (dX < 0) — blocked by makeMovementFlags above.
        super.onChildDraw(c, recyclerView, viewHolder, dampedDx, dY, actionState, isCurrentlyActive)
    }

    private fun clearCanvas(c: Canvas?, left: Float, top: Float, right: Float, bottom: Float) {
        c?.drawRect(left, top, right, bottom, clearPaint)
    }
    
    override fun getSwipeThreshold(viewHolder: RecyclerView.ViewHolder): Float {
         return 0.4f
    }
    
    // Abstract method to be implemented by activity
    // Only one action now: Mark Paid
    abstract fun onSwipeRight(position: Int)

    override fun onSwiped(viewHolder: RecyclerView.ViewHolder, direction: Int) {
        val position = viewHolder.bindingAdapterPosition
        val id = viewHolder.itemId
        
        // Clear state
        hapticStateMap.remove(id)

        if (direction == ItemTouchHelper.RIGHT) {
             onSwipeRight(position)
        }
    }
}
