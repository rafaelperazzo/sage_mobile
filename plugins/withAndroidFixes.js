const { withAndroidStyles } = require('@expo/config-plugins');

const DEPRECATED = ['android:statusBarColor', 'android:navigationBarColor', 'android:windowLightStatusBar'];

// Overrides for library styles that include deprecated edge-to-edge attributes.
// App resources take precedence over library resources in Android merging.
const OVERRIDES = [
  {
    name: 'Theme.FullScreenDialog',
    items: [
      { name: 'android:windowNoTitle', value: 'true' },
      { name: 'android:windowIsFloating', value: 'false' },
      { name: 'android:windowBackground', value: '@android:color/transparent' },
      { name: 'android:windowDrawsSystemBarBackgrounds', value: 'true' },
    ],
  },
  {
    name: 'Base.V21.ThemeOverlay.Material3.BottomSheetDialog',
    parent: 'Base.V14.ThemeOverlay.Material3.BottomSheetDialog',
    items: [],
  },
  {
    name: 'Base.V21.ThemeOverlay.Material3.SideSheetDialog',
    parent: 'Base.V14.ThemeOverlay.Material3.SideSheetDialog',
    items: [],
  },
  {
    // androidx.core:core-splashscreen, pulled in by expo-splash-screen (SDK 57+)
    name: 'Theme.SplashScreen.Common',
    parent: 'Base.Theme.SplashScreen.DayNight',
    items: [
      { name: 'android:windowActionBar', value: 'false' },
      { name: 'android:windowNoTitle', value: 'true' },
      { name: 'android:windowBackground', value: '@drawable/compat_splash_screen_no_icon_background' },
      { name: 'android:opacity', value: 'opaque' },
      { name: 'android:windowDrawsSystemBarBackgrounds', value: 'true' },
      { name: 'android:fitsSystemWindows', value: 'false' },
      { name: 'splashScreenIconSize', value: '@dimen/splashscreen_icon_size_no_background' },
    ],
  },
  {
    // androidx material3
    name: 'EdgeToEdgeFloatingDialogTheme',
    parent: 'android:Theme.DeviceDefault.Dialog',
    items: [
      { name: 'android:windowAnimationStyle', value: '@null' },
      { name: 'android:windowClipToOutline', value: 'false' },
      { name: 'android:windowIsFloating', value: 'false' },
      { name: 'android:windowNoTitle', value: 'true' },
      { name: 'android:windowBackground', value: '@android:color/transparent' },
      { name: 'android:windowElevation', value: '0dp' },
    ],
  },
  {
    // com.google.android.material:material (classic MaterialComponents variant,
    // separate from the Material3 BottomSheetDialog override above)
    name: 'ThemeOverlay.MaterialComponents.BottomSheetDialog',
    parent: 'Base.ThemeOverlay.MaterialComponents.Dialog',
    items: [
      { name: 'android:windowIsFloating', value: 'false' },
      { name: 'android:windowBackground', value: '@android:color/transparent' },
      { name: 'android:windowAnimationStyle', value: '@style/Animation.MaterialComponents.BottomSheetDialog' },
      { name: 'bottomSheetStyle', value: '@style/Widget.MaterialComponents.BottomSheet.Modal' },
      { name: 'enableEdgeToEdge', value: 'true' },
      { name: 'paddingBottomSystemWindowInsets', value: 'true' },
      { name: 'paddingLeftSystemWindowInsets', value: 'true' },
      { name: 'paddingRightSystemWindowInsets', value: 'true' },
      { name: 'paddingTopSystemWindowInsets', value: 'true' },
    ],
  },
];

function withStylesFix(config) {
  return withAndroidStyles(config, (config) => {
    const styles = config.modResults.resources.style ?? [];

    // Remove deprecated attributes from app's own styles
    for (const style of styles) {
      style.item = (style.item ?? []).filter(
        (item) => !DEPRECATED.includes(item.$?.name ?? '')
      );
    }

    // Add or replace library style overrides
    for (const override of OVERRIDES) {
      const existing = styles.find((s) => s.$?.name === override.name);
      const items = override.items.map((i) => ({ $: { name: i.name }, _: i.value }));
      if (existing) {
        existing.item = items;
      } else {
        const entry = { $: { name: override.name }, item: items };
        if (override.parent) entry.$.parent = override.parent;
        styles.push(entry);
      }
    }

    config.modResults.resources.style = styles;
    return config;
  });
}

module.exports = function withAndroidFixes(config) {
  config = withStylesFix(config);
  return config;
};
