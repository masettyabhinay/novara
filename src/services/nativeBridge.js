import { Capacitor } from '@capacitor/core';
import { StatusBar, Style } from '@capacitor/status-bar';
import { SplashScreen } from '@capacitor/splash-screen';
import { App as CapacitorApp } from '@capacitor/app';

/**
 * Check if the application is running as a native mobile application (Android / iOS)
 */
export const isNativePlatform = () => {
  return typeof window !== 'undefined' && Capacitor.isNativePlatform();
};

/**
 * Check if running specifically on native Android
 */
export const isNativeAndroid = () => {
  return isNativePlatform() && Capacitor.getPlatform() === 'android';
};

/**
 * Configure native mobile UI elements (Status Bar, Splash Screen)
 */
export const setupNativeUi = async () => {
  if (!isNativePlatform()) return;

  try {
    // Configure dark theme status bar matching NOVARA's brand palette
    await StatusBar.setStyle({ style: Style.Dark });
    await StatusBar.setBackgroundColor({ color: '#0B0F19' });
  } catch {
    // Graceful fallback on web/emulators
  }

  try {
    // Cleanly dismiss splash screen once React has mounted
    await SplashScreen.hide();
  } catch {
    // Graceful fallback
  }
};

/**
 * Register Android hardware back-button listener
 * @param {Function} onBackAction - Handler called with ({ canGoBack })
 * @returns {Function} Unsubscribe function
 */
export const registerNativeBackButton = (onBackAction) => {
  if (!isNativePlatform()) return () => {};

  const listenerPromise = CapacitorApp.addListener('backButton', (event) => {
    if (typeof onBackAction === 'function') {
      onBackAction(event);
    }
  });

  return () => {
    listenerPromise.then((handle) => handle.remove()).catch(() => {});
  };
};

/**
 * Exit the native Android application cleanly
 */
export const exitNativeApp = () => {
  if (isNativePlatform()) {
    CapacitorApp.exitApp();
  }
};
