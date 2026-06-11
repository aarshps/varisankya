package com.hora.varisankya.util

import java.util.Calendar
import java.util.Date
import java.util.TimeZone

object DateHelper {

    // ThreadLocal caches the Calendar instance per thread, completely eliminating
    // massive allocation overhead when this is called hundreds of times in loops
    private val calendarPool = object : ThreadLocal<Calendar>() {
        override fun initialValue(): Calendar = Calendar.getInstance(TimeZone.getTimeZone("UTC"))
    }

    /**
     * The single source of truth for advancing a due date by one recurrence
     * period. Used by every payment write path (swipe-to-pay in
     * MainViewModel, the Manage Payments sheet) so all of them produce
     * identical Firestore `dueDate` values.
     *
     * All math is done at **UTC midnight** — `dueDate` is stored as a
     * UTC-midnight Firestore Timestamp (the MaterialDatePicker writes that),
     * and normalising here avoids DST shifts and timezone drift. See the
     * design invariant in AGENTS.md.
     *
     * Recurrence strings (same encoding as iOS):
     * - `"Custom"` → null (no auto-advance)
     * - `"Every N Months|Years|Weeks|Days"` (singular accepted; unknown unit
     *   or non-numeric N falls back to months / 1)
     * - `"Monthly"` / `"Yearly"` / `"Weekly"` / `"Daily"`; anything else
     *   falls back to monthly
     */
    fun calculateNextDueDate(fromDate: Date, recurrence: String): Date? {
        val cal = calendarPool.get()!!
        cal.time = fromDate
        cal.set(Calendar.HOUR_OF_DAY, 0)
        cal.set(Calendar.MINUTE, 0)
        cal.set(Calendar.SECOND, 0)
        cal.set(Calendar.MILLISECOND, 0)

        if (recurrence == "Custom") return null

        if (recurrence.startsWith("Every ")) {
            val parts = recurrence.split(" ")
            if (parts.size >= 3) {
                val freq = parts[1].toIntOrNull() ?: 1
                val unit = parts[2]
                when (unit) {
                    "Months", "Month" -> cal.add(Calendar.MONTH, freq)
                    "Years", "Year" -> cal.add(Calendar.YEAR, freq)
                    "Weeks", "Week" -> cal.add(Calendar.WEEK_OF_YEAR, freq)
                    "Days", "Day" -> cal.add(Calendar.DAY_OF_YEAR, freq)
                    else -> cal.add(Calendar.MONTH, freq)
                }
            }
        } else {
             when (recurrence) {
                "Monthly" -> cal.add(Calendar.MONTH, 1)
                "Yearly" -> cal.add(Calendar.YEAR, 1)
                "Weekly" -> cal.add(Calendar.WEEK_OF_YEAR, 1)
                "Daily" -> cal.add(Calendar.DAY_OF_YEAR, 1)
                else -> cal.add(Calendar.MONTH, 1)
            }
        }
        return cal.time
    }
}
