package com.hora.varisankya.util

import org.junit.Assert.assertEquals
import org.junit.Assert.assertNull
import org.junit.Test
import java.util.Calendar
import java.util.Date
import java.util.TimeZone

/**
 * [DateHelper.calculateNextDueDate] is the single source of truth for
 * advancing Firestore `dueDate` values, so every branch of the recurrence
 * grammar and the UTC-midnight normalisation invariant are pinned here.
 */
class DateHelperTest {

    private val utc = TimeZone.getTimeZone("UTC")

    /** Builds a Date at an explicit UTC wall-clock instant. */
    private fun utcDate(
        year: Int, month: Int, day: Int,
        hour: Int = 0, minute: Int = 0, second: Int = 0, millis: Int = 0,
    ): Date {
        val cal = Calendar.getInstance(utc)
        cal.clear()
        cal.set(year, month - 1, day, hour, minute, second)
        cal.set(Calendar.MILLISECOND, millis)
        return cal.time
    }

    private fun next(from: Date, recurrence: String): Date =
        DateHelper.calculateNextDueDate(from, recurrence)!!

    // -- Named recurrences ----------------------------------------------------

    @Test
    fun `monthly advances one month`() {
        assertEquals(utcDate(2026, 7, 15), next(utcDate(2026, 6, 15), "Monthly"))
    }

    @Test
    fun `yearly advances one year`() {
        assertEquals(utcDate(2027, 6, 15), next(utcDate(2026, 6, 15), "Yearly"))
    }

    @Test
    fun `weekly advances seven days across a month boundary`() {
        assertEquals(utcDate(2026, 7, 4), next(utcDate(2026, 6, 27), "Weekly"))
    }

    @Test
    fun `daily advances one day across a year boundary`() {
        assertEquals(utcDate(2027, 1, 1), next(utcDate(2026, 12, 31), "Daily"))
    }

    @Test
    fun `custom returns null - no auto-advance`() {
        assertNull(DateHelper.calculateNextDueDate(utcDate(2026, 6, 15), "Custom"))
    }

    @Test
    fun `unknown recurrence falls back to monthly`() {
        assertEquals(utcDate(2026, 7, 15), next(utcDate(2026, 6, 15), "Quarterly?!"))
    }

    // -- "Every N <unit>" grammar ----------------------------------------------

    @Test
    fun `every 3 months advances a quarter`() {
        assertEquals(utcDate(2026, 9, 15), next(utcDate(2026, 6, 15), "Every 3 Months"))
    }

    @Test
    fun `every 1 month singular unit accepted`() {
        assertEquals(utcDate(2026, 7, 15), next(utcDate(2026, 6, 15), "Every 1 Month"))
    }

    @Test
    fun `every 2 weeks advances fourteen days`() {
        assertEquals(utcDate(2026, 6, 29), next(utcDate(2026, 6, 15), "Every 2 Weeks"))
    }

    @Test
    fun `every 10 days advances ten days`() {
        assertEquals(utcDate(2026, 6, 25), next(utcDate(2026, 6, 15), "Every 10 Days"))
    }

    @Test
    fun `every 2 years advances two years`() {
        assertEquals(utcDate(2028, 6, 15), next(utcDate(2026, 6, 15), "Every 2 Years"))
    }

    @Test
    fun `non-numeric frequency falls back to 1`() {
        assertEquals(utcDate(2026, 7, 15), next(utcDate(2026, 6, 15), "Every x Months"))
    }

    @Test
    fun `unknown unit falls back to months`() {
        assertEquals(utcDate(2026, 8, 15), next(utcDate(2026, 6, 15), "Every 2 Fortnights"))
    }

    @Test
    fun `malformed Every string without enough parts is a no-op advance`() {
        // "Every " prefix but only 2 parts: no calendar add happens — the
        // date is returned normalised but un-advanced. Pinned so a future
        // refactor doesn't silently change the fallback.
        assertEquals(utcDate(2026, 6, 15), next(utcDate(2026, 6, 15), "Every Months"))
    }

    // -- Month-end clamping -----------------------------------------------------

    @Test
    fun `monthly from Jan 31 clamps to Feb 28 in a non-leap year`() {
        assertEquals(utcDate(2026, 2, 28), next(utcDate(2026, 1, 31), "Monthly"))
    }

    @Test
    fun `monthly from Jan 31 clamps to Feb 29 in a leap year`() {
        assertEquals(utcDate(2028, 2, 29), next(utcDate(2028, 1, 31), "Monthly"))
    }

    @Test
    fun `yearly from Feb 29 clamps to Feb 28 the next year`() {
        assertEquals(utcDate(2029, 2, 28), next(utcDate(2028, 2, 29), "Yearly"))
    }

    @Test
    fun `every 3 months from May 31 clamps to Aug 31 exactly`() {
        assertEquals(utcDate(2026, 8, 31), next(utcDate(2026, 5, 31), "Every 3 Months"))
    }

    // -- UTC-midnight normalisation ---------------------------------------------

    @Test
    fun `result is normalised to UTC midnight even from a noisy input instant`() {
        val noisy = utcDate(2026, 6, 15, hour = 18, minute = 45, second = 30, millis = 123)
        assertEquals(utcDate(2026, 7, 15), next(noisy, "Monthly"))
    }

    @Test
    fun `utc-midnight input stays utc-midnight - no drift across repeated advances`() {
        var due = utcDate(2026, 1, 15)
        repeat(12) { due = next(due, "Monthly") }
        assertEquals(utcDate(2027, 1, 15), due)
    }
}
