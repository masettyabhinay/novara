/**
 * NOVARA Theme & Appearance Utility
 * Manages Light, Dark, and System theme preferences with zero-flash DOM application
 * and real-time prefers-color-scheme synchronization.
 */

export const THEME_STORAGE_KEY = 'novara_theme_preference';

export const THEME_OPTIONS = [
  {
    id: 'light',
    label: 'Light',
    description: 'Crisp warm cream and terracotta aesthetic'
  },
  {
    id: 'dark',
    label: 'Dark',
    description: 'Deep warm obsidian and charcoal surfaces'
  },
  {
    id: 'system',
    label: 'System',
    description: 'Automatically follows your device color scheme'
  }
];

/**
 * Reads the persisted theme preference from localStorage.
 * Defaults new users to 'system' unless an existing preference is found.
 */
export function getSavedThemePreference() {
  if (typeof window === 'undefined') return 'system';
  try {
    const saved = localStorage.getItem(THEME_STORAGE_KEY);
    if (saved === 'light' || saved === 'dark' || saved === 'system') {
      return saved;
    }
  } catch (e) {
    console.warn('[Theme] Could not read localStorage:', e);
  }
  return 'system';
}

/**
 * Detects the current OS/browser preferred color scheme.
 * Returns 'dark' if prefers-color-scheme: dark matches, otherwise 'light'.
 */
export function getSystemTheme() {
  if (typeof window === 'undefined') return 'light';
  try {
    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
      return 'dark';
    }
  } catch (e) {
    console.warn('[Theme] Error evaluating matchMedia:', e);
  }
  return 'light';
}

/**
 * Resolves the effective rendered theme ('light' or 'dark') given a preference.
 */
export function resolveEffectiveTheme(preference) {
  if (preference === 'dark') return 'dark';
  if (preference === 'light') return 'light';
  return getSystemTheme();
}

/**
 * Applies the effective theme and preference attributes to the document root
 * and updates mobile status bar / meta theme-color.
 */
export function applyThemeToDom(preference) {
  if (typeof document === 'undefined') return 'light';
  
  const effectiveTheme = resolveEffectiveTheme(preference);
  
  // Set data-theme on <html> for CSS tokens
  document.documentElement.setAttribute('data-theme', effectiveTheme);
  document.documentElement.setAttribute('data-theme-preference', preference);

  // Update meta theme-color for mobile web/browser header
  try {
    let metaTheme = document.querySelector('meta[name="theme-color"]');
    if (!metaTheme) {
      metaTheme = document.createElement('meta');
      metaTheme.name = 'theme-color';
      document.head.appendChild(metaTheme);
    }
    metaTheme.setAttribute('content', effectiveTheme === 'dark' ? '#141716' : '#C85A32');
  } catch (e) {
    // Ignore meta manipulation errors in non-browser environments
  }

  return effectiveTheme;
}

/**
 * Listens for live changes in the user's OS/browser prefers-color-scheme
 * and invokes callback with the new effective theme.
 * Returns an unsubscribe function.
 */
export function subscribeToSystemThemeChange(callback) {
  if (typeof window === 'undefined' || !window.matchMedia) {
    return () => {};
  }

  const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
  
  const handleChange = (e) => {
    const newSystemTheme = e.matches ? 'dark' : 'light';
    callback(newSystemTheme);
  };

  if (mediaQuery.addEventListener) {
    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  } else if (mediaQuery.addListener) {
    // Legacy WebKit support
    mediaQuery.addListener(handleChange);
    return () => mediaQuery.removeListener(handleChange);
  }

  return () => {};
}
