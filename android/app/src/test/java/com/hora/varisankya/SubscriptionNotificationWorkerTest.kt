package com.hora.varisankya

import org.junit.Assert.assertEquals
import org.junit.Test
import java.time.LocalDate
import java.util.Calendar
import java.util.Date
import java.util.TimeZone

/**
 * Pins [SubscriptionNotificationWorker.daysLeftUtc] — the days-left math that
 * decides whether a subscription enters the consolidated reminder. Both sides
 * must be interpreted in UTC; mixing in the device zone was the v3.8-beta.12
 * regression (boundary days silently skipped for IST users), so the boundary
 * cases here are the ones that matter.
 */
class SubscriptionNotificationWorkerTest {

    /** dueDate as Firestore stores it: a UTC-midnight instant. */
    private fun utcMidnight(year: Int, month: Int, day: Int): Date {
        val cal = Calendar.getInstance(TimeZone.getTimeZone("UTC"))
        cal.clear()
        cal.set(year, month - 1, day, 0, 0, 0)
        cal.set(Calendar.MILLISECOND, 0)
        return cal.time
    }

    private val today: LocalDate = LocalDate.of(2026, 6, 12)

    @Test
    fun `due today is zero`() {
        assertEquals(0, SubscriptionNotificationWorker.daysLeftUtc(utcMidnight(2026, 6, 12), today))
    }

    @Test
    fun `due tomorrow is one`() {
        assertEquals(1, SubscriptionNotificationWorker.daysLeftUtc(utcMidnight(2026, 6, 13), today))
    }

    @Test
    fun `overdue yesterday is minus one`() {
        assertEquals(-1, SubscriptionNotificationWorker.daysLeftUtc(utcMidnight(2026, 6, 11), today))
    }

    @Test
    fun `a week out is seven`() {
        assertEquals(7, SubscriptionNotificationWorker.daysLeftUtc(utcMidnight(2026, 6, 19), today))
    }

    @Test
    fun `counts across a month boundary`() {
        assertEquals(19, SubscriptionNotificationWorker.daysLeftUtc(utcMidnight(2026, 7, 1), today))
    }

    @Test
    fun `counts across a year boundary`() {
        assertEquals(
            1,
            SubscriptionNotificationWorker.daysLeftUtc(
                utcMidnight(2027, 1, 1),
                LocalDate.of(2026, 12, 31)
            )
        )
    }

    @Test
    fun `late-evening UTC instant still counts as its own UTC day`() {
        // 23:59:59 UTC on the 13th is daysLeft=1 from the 12th. Under
        // device-local math in IST this instant is already the 14th —
        // the exact class of bug the UTC invariant guards against.
        val cal = Calendar.getInstance(TimeZone.getTimeZone("UTC"))
        cal.clear()
        cal.set(2026, 5, 13, 23, 59, 59)
        assertEquals(1, SubscriptionNotificationWorker.daysLeftUtc(cal.time, today))
    }

    @Test
    fun `result is independent of the JVM default timezone`() {
        val original = TimeZone.getDefault()
        try {
            for (zone in listOf("Asia/Kolkata", "America/Los_Angeles", "Pacific/Kiritimati")) {
                TimeZone.setDefault(TimeZone.getTimeZone(zone))
                assertEquals(
                    "zone $zone must not affect the day count",
                    1,
                    SubscriptionNotificationWorker.daysLeftUtc(utcMidnight(2026, 6, 13), today)
                )
            }
        } finally {
            TimeZone.setDefault(original)
        }
    }
}
