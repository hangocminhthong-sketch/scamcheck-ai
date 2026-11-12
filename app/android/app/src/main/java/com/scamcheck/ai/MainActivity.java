package com.scamcheck.ai;

import android.content.Intent;
import android.os.Bundle;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        // F11: register the local share-intent plugin before the bridge starts.
        registerPlugin(ShareIntentPlugin.class);
        super.onCreate(savedInstanceState); // BridgeActivity calls onNewIntent(getIntent()) here
    }

    @Override
    protected void onNewIntent(Intent intent) {
        ShareIntentPlugin.capture(intent);
        super.onNewIntent(intent);
    }
}
