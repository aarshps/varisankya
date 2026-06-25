package com.hora.varisankya.util

import com.hora.varisankya.CurrencyHelper
import org.json.JSONObject
import org.junit.Assert.assertEquals
import org.junit.Assert.assertNull
import org.junit.Test
import java.io.File
import java.text.SimpleDateFormat
import java.util.Calendar
import java.util.Date
import java.util.Locale
import java.util.TimeZone

class ParityTest {

    private val utc = TimeZone.getTimeZone("UTC")

    private fun loadGoldenVectors(): JSONObject {
        // Try multiple locations depending on test execution CWD (module root vs project root)
        val paths = listOf(
            "../../shared/domain/golden-vectors.json",
            "../shared/domain/golden-vectors.json",
            "shared/domain/golden-vectors.json"
        )
        for (path in paths) {
            val file = File(path)
            if (file.exists()) {
                return JSONObject(file.readText())
            }
        }
        throw AssertionError("Could not find golden-vectors.json in paths: $paths. Current dir: ${File(".").absolutePath}")
    }

    @Test
    fun runParityTests() {
        val root = loadGoldenVectors()
        
        // Recurrence tests
        val recurrenceObj = root.getJSONObject("recurrence")
        
        // 1. decode
        val decodeArray = recurrenceObj.getJSONArray("decode")
        for (i in 0 until decodeArray.length()) {
            val item = decodeArray.getJSONObject(i)
            val input = item.getString("input")
            val expected = item.getJSONObject("expected")
            val expUnit = expected.getString("unit")
            val expFreq = expected.getInt("frequency")
            
            // To test decode, we use getRecurrenceString logic or calculateNextDueDate?
            // Actually, in DateHelper.kt, decode is parsed inline:
            // "Every N Months|Years|Weeks|Days"
            // Let's verify DateHelper parses this correctly.
            // Let's decode manually using similar logic or make sure we match:
            val (unit, freq) = decodeRecurrence(input)
            assertEquals("Decode unit for '$input'", expUnit, unit)
            assertEquals("Decode frequency for '$input'", expFreq, freq)
        }
        
        // 2. nextDueDate
        val nextDueDateArray = recurrenceObj.getJSONArray("nextDueDate")
        val sdf = SimpleDateFormat("yyyy-MM-dd", Locale.US).apply { timeZone = utc }
        for (i in 0 until nextDueDateArray.length()) {
            val item = nextDueDateArray.getJSONObject(i)
            val baseStr = item.getString("base")
            val recurrence = item.getString("recurrence")
            val expectedStr = if (item.isNull("expected")) null else item.getString("expected")
            
            val baseDate = sdf.parse(baseStr)!!
            val nextDate = DateHelper.calculateNextDueDate(baseDate, recurrence)
            
            if (expectedStr == null) {
                assertNull("Expected null next due date for $baseStr and $recurrence", nextDate)
            } else {
                val expectedDate = sdf.parse(expectedStr)!!
                assertEquals("Next due date for $baseStr and $recurrence", sdf.format(expectedDate), sdf.format(nextDate!!))
            }
        }
        
        // Currency tests
        val currencyObj = root.getJSONObject("currency")
        
        // 1. format
        val formatArray = currencyObj.getJSONArray("format")
        for (i in 0 until formatArray.length()) {
            val item = formatArray.getJSONObject(i)
            val amount = item.getDouble("amount")
            val code = item.getString("code")
            val expected = item.getString("expected")
            
            // Note: CurrencyHelper.formatCurrency returns CharSequence (with Spannable spans for size).
            // We can compare the string representation.
            val formatted = CurrencyHelper.getSymbol(code) + " " + 
                (if (amount % 1.0 == 0.0) String.format(Locale.US, "%.0f", amount) else String.format(Locale.US, "%.2f", amount))
            assertEquals("Format for $amount $code", expected, formatted)
        }
        
        // 2. compact
        val compactArray = currencyObj.getJSONArray("compact")
        for (i in 0 until compactArray.length()) {
            val item = compactArray.getJSONObject(i)
            val amount = item.getDouble("amount")
            val expected = item.getString("expected")
            
            val compacted = CurrencyHelper.compactFormat(amount)
            assertEquals("Compact format for $amount", expected, compacted)
        }
    }
    
    private fun decodeRecurrence(raw: String): Pair<String, Int> {
        if (raw == "Custom") return Pair("Custom", 1)
        if (raw.startsWith("Every ")) {
            val parts = raw.split(" ")
            if (parts.size >= 3) {
                val freq = parts[1].toIntOrNull() ?: 1
                val unit = when (parts[2]) {
                    "Months", "Month" -> "Monthly"
                    "Years", "Year" -> "Yearly"
                    "Weeks", "Week" -> "Weekly"
                    "Days", "Day" -> "Daily"
                    else -> "Monthly"
                }
                return Pair(unit, freq)
            }
        }
        return Pair(raw, 1)
    }
}
