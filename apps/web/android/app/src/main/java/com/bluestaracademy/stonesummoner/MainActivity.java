package com.bluestaracademy.stonesummoner;

import android.os.Build;
import android.os.Bundle;
import android.view.KeyEvent;
import android.webkit.JavascriptInterface;
import android.webkit.WebView;
import android.window.OnBackInvokedCallback;
import android.window.OnBackInvokedDispatcher;
import androidx.activity.OnBackPressedCallback;
import com.getcapacitor.Bridge;
import com.getcapacitor.BridgeActivity;

/**
 * Own Android back (including API 36 predictive-back) so the activity is never
 * finished by the system. Game JS ({@code window.__ssHardwareBack}) closes
 * overlays and walks screens. Confirmed quit must drop those guards before
 * {@code finishAndRemoveTask()} — {@code App.exitApp()} alone is not enough.
 */
public class MainActivity extends BridgeActivity {
  private OnBackPressedCallback backCallback;
  private OnBackInvokedCallback invokedCallback;
  private boolean invokedRegistered = false;
  private WebView nativeBridgeWebView;
  private boolean exiting;

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
    attachNativeBridge();
    Bridge bridge = getBridge();
    if (bridge != null && bridge.getWebView() != null) {
      bridge.getWebView().post(this::rearmBackCallback);
      bridge.getWebView().post(this::attachNativeBridge);
      bridge.getWebView().postDelayed(this::rearmBackCallback, 400);
      bridge.getWebView().postDelayed(this::attachNativeBridge, 400);
      bridge.getWebView().postDelayed(this::rearmBackCallback, 1500);
      bridge.getWebView().postDelayed(this::attachNativeBridge, 1500);
    }
  }

  @Override
  public void onStart() {
    super.onStart();
    installBackGuards();
    attachNativeBridge();
  }

  @Override
  public void onResume() {
    super.onResume();
    if (exiting) return;
    installBackGuards();
    attachNativeBridge();
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
    dropBackGuards();
    super.onDestroy();
  }

  @Override
  public boolean dispatchKeyEvent(KeyEvent event) {
    if (event.getKeyCode() == KeyEvent.KEYCODE_BACK) {
      if (exiting) return true;
      if (event.getAction() == KeyEvent.ACTION_UP) {
        dispatchHardwareBack();
      }
      return true;
    }
    return super.dispatchKeyEvent(event);
  }

  private void installBackGuards() {
    if (exiting) return;
    rearmBackCallback();
    registerInvokedCallback();
  }

  private void rearmBackCallback() {
    if (exiting || backCallback == null) return;
    backCallback.setEnabled(true);
    try {
      backCallback.remove();
    } catch (RuntimeException ignored) {
      /* not attached yet */
    }
    getOnBackPressedDispatcher().addCallback(backCallback);
  }

  private void registerInvokedCallback() {
    if (exiting) return;
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

  private void dropBackGuards() {
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
        backCallback.setEnabled(false);
        backCallback.remove();
      } catch (RuntimeException ignored) {
        /* already gone */
      }
    }
  }

  private void attachNativeBridge() {
    Bridge bridge = getBridge();
    if (bridge == null) return;
    WebView webView = bridge.getWebView();
    if (webView == null || webView == nativeBridgeWebView) return;
    webView.addJavascriptInterface(new NativeBridge(), "StoneSummonerNative");
    nativeBridgeWebView = webView;
  }

  private void dispatchHardwareBack() {
    if (exiting) return;
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

  private void performExit() {
    if (exiting) return;
    exiting = true;
    dropBackGuards();
    finishAndRemoveTask();
  }

  private final class NativeBridge {
    @JavascriptInterface
    public void exitApp() {
      runOnUiThread(MainActivity.this::performExit);
    }
  }
}
