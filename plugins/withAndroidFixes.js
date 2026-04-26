const { withAndroidStyles } = require('@expo/config-plugins');

const DEPRECATED = ['android:statusBarColor', 'android:navigationBarColor', 'android:windowLightStatusBar'];

function withStylesFix(config) {
  return withAndroidStyles(config, (config) => {
    config.modResults.resources.style = (config.modResults.resources.style ?? []).map((style) => {
      style.item = (style.item ?? []).filter(
        (item) => !DEPRECATED.includes(item.$?.['android:name'] ?? item.$?.name ?? '')
      );
      return style;
    });
    return config;
  });
}

module.exports = function withAndroidFixes(config) {
  config = withStylesFix(config);
  return config;
};
