package com.example

import android.annotation.SuppressLint
import android.content.Context
import android.graphics.Bitmap
import android.os.Bundle
import android.print.PrintAttributes
import android.print.PrintManager
import android.webkit.JavascriptInterface
import android.webkit.WebChromeClient
import android.webkit.WebSettings
import android.webkit.WebView
import android.webkit.WebViewClient
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.activity.enableEdgeToEdge
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.viewinterop.AndroidView

class MainActivity : ComponentActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        enableEdgeToEdge()
        setContent {
            WebViewScreen()
        }
    }
}

@SuppressLint("SetJavaScriptEnabled")
@Composable
fun WebViewScreen() {
    AndroidView(
        modifier = Modifier.fillMaxSize(),
        factory = { context ->
            WebView(context).apply {
                settings.javaScriptEnabled = true
                settings.domStorageEnabled = true
                settings.allowFileAccess = true
                settings.allowContentAccess = true
                settings.mixedContentMode = WebSettings.MIXED_CONTENT_COMPATIBILITY_MODE
                settings.databaseEnabled = true
                
                webViewClient = object : WebViewClient() {
                    override fun onPageStarted(view: WebView?, url: String?, favicon: Bitmap?) {
                        super.onPageStarted(view, url, favicon)
                    }
                }
                
                webChromeClient = WebChromeClient()
                
                // Add AndroidPrint channel so window.print() can trigger Android PrintManager
                try {
                    addJavascriptInterface(WebAppPrintInterface(context, this), "AndroidPrint")
                } catch (e: Exception) {
                    e.printStackTrace()
                }
                
                loadUrl("file:///android_asset/index.html")
            }
        }
    )
}

class WebAppPrintInterface(private val context: Context, private val webView: WebView) {
    @JavascriptInterface
    fun printPage() {
        val activity = findActivity(context) ?: return
        activity.runOnUiThread {
            try {
                val printManager = activity.getSystemService(Context.PRINT_SERVICE) as PrintManager
                val jobName = "SaaS ERP Document"
                val printAdapter = if (android.os.Build.VERSION.SDK_INT >= android.os.Build.VERSION_CODES.LOLLIPOP) {
                    webView.createPrintDocumentAdapter(jobName)
                } else {
                    webView.createPrintDocumentAdapter()
                }
                printManager.print(jobName, printAdapter, PrintAttributes.Builder().build())
            } catch (e: Exception) {
                e.printStackTrace()
            }
        }
    }

    private fun findActivity(context: Context): ComponentActivity? {
        var tempContext = context
        while (tempContext is android.content.ContextWrapper) {
            if (tempContext is ComponentActivity) {
                return tempContext
            }
            tempContext = tempContext.baseContext
        }
        return null
    }
}
