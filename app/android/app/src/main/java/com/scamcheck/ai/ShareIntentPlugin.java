package com.scamcheck.ai;

import android.content.Intent;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

/**
 * F11 — hands text shared from another app (Android share sheet, ACTION_SEND text/plain)
 * to the web layer exactly once.  JS: ShareIntent.getSharedText() -> { text?: string }
 */
@CapacitorPlugin(name = "ShareIntent")
public class ShareIntentPlugin extends Plugin {

    private static String pendingText = null;

    static synchronized void capture(Intent intent) {
        if (intent == null) return;
        if (!Intent.ACTION_SEND.equals(intent.getAction())) return;
        String type = intent.getType();
        if (type == null || !type.startsWith("text/")) return;
        CharSequence text = intent.getCharSequenceExtra(Intent.EXTRA_TEXT);
        CharSequence subject = intent.getCharSequenceExtra(Intent.EXTRA_SUBJECT);
        if (text == null || text.length() == 0) return;
        String value = text.toString();
        if (subject != null && subject.length() > 0 && !value.contains(subject)) {
            value = subject + "\n" + value;
        }
        if (value.length() > 8000) value = value.substring(0, 8000);
        pendingText = value;
        // Prevent the same text from being re-delivered if the activity is recreated.
        intent.removeExtra(Intent.EXTRA_TEXT);
        intent.setAction(Intent.ACTION_MAIN);
    }

    private static synchronized String take() {
        String t = pendingText;
        pendingText = null;
        return t;
    }

    @PluginMethod
    public void getSharedText(PluginCall call) {
        JSObject ret = new JSObject();
        String text = take();
        if (text != null) ret.put("text", text);
        call.resolve(ret);
    }
}
