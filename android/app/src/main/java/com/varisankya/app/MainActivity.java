package com.varisankya.app;

import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    @Override
    public void onStart() {
        super.onStart();
        
        // Configure WebView to hide any browser UI
        if (this.bridge != null && this.bridge.getWebView() != null) {
            android.webkit.WebView webView = this.bridge.getWebView();
            android.webkit.WebSettings webSettings = webView.getSettings();
            
            // Set user agent to not trigger browser mode and identify as native app
            String userAgent = webSettings.getUserAgentString();
            userAgent = userAgent.replace("; wv", "") + " VarisankyaApp";
            webSettings.setUserAgentString(userAgent);
            
            // Disable any browser-like features
            webSettings.setBuiltInZoomControls(false);
            webSettings.setDisplayZoomControls(false);
            
            // Ensure it's treated as an app, not a browser
            webSettings.setMixedContentMode(android.webkit.WebSettings.MIXED_CONTENT_ALWAYS_ALLOW);
            
            // Enable Cookies
            android.webkit.CookieManager cookieManager = android.webkit.CookieManager.getInstance();
            cookieManager.setAcceptCookie(true);
            cookieManager.setAcceptThirdPartyCookies(webView, true);
            cookieManager.flush();
        }
    }
}
