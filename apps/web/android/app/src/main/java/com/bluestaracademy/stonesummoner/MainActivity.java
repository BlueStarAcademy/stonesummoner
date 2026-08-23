package com.bluestaracademy.stonesummoner;

import android.os.Build;
import android.os.Bundle;
import android.view.KeyEvent;
import android.webkit.WebView;
import android.window.OnBackInvokedCallback;
import android.window.OnBackInvokedDispatcher;
import androidx.activity.OnBackPressedCallback;
import com.getcapacitor.Bridge;
import com.getcapacitor.BridgeActivity;

/**
 * Own Android back (including API 36 predictive-back) so the activity is never
 * finished by the system. Game JS ({@code window.__ssHardwareBack}) closes
 * overlays, walks screens, and calls {@code App.exitApp()} only after a confirm.
 */
public class MainActivity extends BridgeActivity {
  private OnBackPressedCallback backCallback;
  private OnBackInvokedCallback invokedCallback;
  private boolean invokedRegistered = false;

  @Override
  public void onCreate(Bundle savedInstanceState) {
    super.onCreate(savedInstanceState);
    backCallback =
      new OnBackPressedCallback(true) {
        @Override
        public void handleOnBackPressed() {
          dispatchHardwareBack();
        }
      };
    installBackGuards();
    Bridge bridge = getBridge();
    if (bridge != null && bridge.getWebView() != null) {
      bridge.getWebView().post(this::rearmBackCallback);
      bridge.getWebView().postDelayed(this::rearmBackCallback, 400);
      bridge.getWebView().postDelayed(this::rearmBackCallback, 1500);
    }
  }

  @Override
  public void onStart() {
    super.onStart();
    installBackGuards();
  }

  @Override
  public void onResume() {
    super.onResume();
    installBackGuards();
    Bridge bridge = getBridge();
    if (bridge != null && bridge.getWebView() != null) {
      bridge.getWebView().onResume();
      bridge.getWebView().post(this::rearmBackCallback);
    }
  }

  @Override
  public void onPause() {
    injectJs(
      "(function(){try{if(window.__ssSuspendAudio)window.__ssSuspendAudio();}catch(e){}})()"
    );
    super.onPause();
  }

  @Override
  public void onDestroy() {
    injectJs(
      "(function(){try{if(window.__ssHaltAudio)window.__ssHaltAudio();}catch(e){}})()"
    );
    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU && invokedRegistered && invokedCallback != null) {
      try {
        getOnBackInvokedDispatcher().unregisterOnBackInvokedCallback(invokedCallback);
      } catch (RuntimeException ignored) {
        /* already gone */
      }
      invokedRegistered = false;
    }
    if (backCallback != null) {
      try {
        backCallback.remove();
      } catch (RuntimeException ignored) {
        /* already gone */
      }
    }
    super.onDestroy();
  }

  @Override
  public boolean dispatchKeyEvent(KeyEvent event) {
    if (event.getKeyCode() == KeyEvent.KEYCODE_BACK) {
      if (event.getAction() == KeyEvent.ACTION_UP) {
        dispatchHardwareBack();
      }
      return true;
    }
    return super.dispatchKeyEvent(event);
  }

  private void installBackGuards() {
    rearmBackCallback();
    registerInvokedCallback();
  }

  private void rearmBackCallback() {
    if (backCallback == null) return;
    backCallback.setEnabled(true);
    try {
      backCallback.remove();
    } catch (RuntimeException ignored) {
      /* not attached yet */
    }
    getOnBackPressedDispatcher().addCallback(backCallback);
  }

  private void registerInvokedCallback() {
    if (Build.VERSION.SDK_INT < Build.VERSION_CODES.TIRAMISU) return;
    if (invokedRegistered) return;
    invokedCallback = this::dispatchHardwareBack;
    getOnBackInvokedDispatcher()
      .registerOnBackInvokedCallback(
        OnBackInvokedDispatcher.PRIORITY_OVERLAY,
        invokedCallback
      );
    invokedRegistered = true;
  }

  private void dispatchHardwareBack() {
    injectJs(
      "(function(){try{if(window.__ssHardwareBack){window.__ssHardwareBack();return true;}return false;}catch(e){return false;}})()"
    );
  }

  private void injectJs(String js) {
    Bridge bridge = getBridge();
    if (bridge == null) return;
    WebView webView = bridge.getWebView();
    if (webView == null) return;
    webView.evaluateJavascript(js, null);
  }
}
