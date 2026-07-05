package com.hora.varisankya

import android.app.Application
import android.util.Log
import com.google.android.material.color.DynamicColors
import com.hora.varisankya.util.Analytics

class VarisankyaApplication : Application() {
    override fun onCreate() {
        super.onCreate()

        // Material You: derive the colour palette from the user's wallpaper on
        // Android 12+. No-op on older versions. This is the canonical Android
        // approach — every Material 3 token (colorPrimary, colorOnPrimary,
        // colorPrimaryContainer, etc.) is filled in by the system at runtime.
        DynamicColors.applyToActivitiesIfAvailable(this)

        // Keep-alive reference to prevent R8 from shrinking and stripping the SystemFont theme.
        val systemFontThemeId = R.style.Theme_Varisankya_SystemFont
        if (systemFontThemeId == 0) Log.w("Varisankya", "Theme.Varisankya.SystemFont missing from build")

        Analytics.init(this)
    }
}
