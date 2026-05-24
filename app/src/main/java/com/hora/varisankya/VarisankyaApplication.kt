package com.hora.varisankya

import android.app.Application
import com.hora.varisankya.util.Analytics

class VarisankyaApplication : Application() {
    override fun onCreate() {
        super.onCreate()
        // Brand Monochrome Identity: Dynamic Colors disabled to ensure
        // a consistent premium black/gray palette across all devices.
        // com.google.android.material.color.DynamicColors.applyToActivitiesIfAvailable(this)

        Analytics.init(this)
    }
}
