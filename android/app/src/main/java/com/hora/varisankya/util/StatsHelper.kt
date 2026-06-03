package com.hora.varisankya.util

/**
 * Small statistics utilities focused on robust central tendency.
 *
 * Built for the "Average Monthly Expense" display in
 * [com.hora.varisankya.UnifiedHistoryActivity], where a single anomalous month
 * (annual upfront payment, one-time large purchase, a month of unusually high
 * spend) was visibly distorting the naive `total / months` mean. The same
 * helpers are useful anywhere a small set of monthly aggregates needs a
 * "typical" value summarised.
 */
object StatsHelper {

    /**
     * Outlier-resistant mean using **Tukey's fences** (the standard 1.5×IQR
     * rule from John W. Tukey, *Exploratory Data Analysis*, 1977). Values
     * outside `[Q1 − 1.5·IQR, Q3 + 1.5·IQR]` are dropped and the arithmetic
     * mean of what remains is returned.
     *
     * Falls back to the plain arithmetic mean when:
     * - the input is empty (returns 0.0)
     * - there are 3 or fewer samples (the IQR isn't a meaningful estimator at
     *   that scale, and the user would experience the "exclusion" as values
     *   inexplicably disappearing)
     * - every sample lies outside the fence (degenerate; almost never happens
     *   for monthly totals but is guarded for safety)
     */
    fun outlierRobustMean(values: List<Double>): Double {
        if (values.isEmpty()) return 0.0
        if (values.size <= 3) return values.average()

        val sorted = values.sorted()
        val q1 = percentile(sorted, 0.25)
        val q3 = percentile(sorted, 0.75)
        val iqr = q3 - q1

        // When IQR is 0 (e.g., almost all months identical), Tukey's fences
        // collapse to a single point and would mask any legitimate variation.
        // Fall back to the plain mean in that case.
        if (iqr == 0.0) return values.average()

        val lower = q1 - 1.5 * iqr
        val upper = q3 + 1.5 * iqr
        val filtered = values.filter { it in lower..upper }
        return if (filtered.isEmpty()) values.average() else filtered.average()
    }

    /**
     * Linear-interpolated percentile of a pre-sorted list. `p` is in `[0, 1]`.
     * Matches the "Type 7" definition (R default, also used by NumPy when the
     * `linear` interpolation mode is requested).
     */
    private fun percentile(sorted: List<Double>, p: Double): Double {
        if (sorted.isEmpty()) return 0.0
        if (sorted.size == 1) return sorted[0]
        val rank = p * (sorted.size - 1)
        val lower = rank.toInt()
        val frac = rank - lower
        return if (lower + 1 < sorted.size) {
            sorted[lower] * (1 - frac) + sorted[lower + 1] * frac
        } else {
            sorted[lower]
        }
    }
}
