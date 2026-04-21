const { withDangerousMod } = require('@expo/config-plugins');
const fs = require('fs');
const path = require('path');

// Fix 1: remove hermesCommand from app/build.gradle
function withHermesCommandFix(config) {
  return withDangerousMod(config, [
    'android',
    (config) => {
      const buildGradlePath = path.join(config.modRequest.platformProjectRoot, 'app/build.gradle');
      if (!fs.existsSync(buildGradlePath)) return config;
      const content = fs.readFileSync(buildGradlePath, 'utf8');
      const fixed = content.split('\n').filter(line => !/hermesCommand.*hermes-compiler/.test(line)).join('\n');
      fs.writeFileSync(buildGradlePath, fixed);
      return config;
    },
  ]);
}

// Fix 2: remove deprecated edge-to-edge attributes from styles.xml
function withStylesFix(config) {
  return withDangerousMod(config, [
    'android',
    (config) => {
      const stylesPath = path.join(
        config.modRequest.platformProjectRoot,
        'app/src/main/res/values/styles.xml'
      );
      if (!fs.existsSync(stylesPath)) return config;
      const content = fs.readFileSync(stylesPath, 'utf8');
      const fixed = content
        .split('\n')
        .filter(line => !/android:statusBarColor/.test(line) && !/android:navigationBarColor/.test(line))
        .join('\n');
      fs.writeFileSync(stylesPath, fixed);
      return config;
    },
  ]);
}

// Fix 3: add missing reactNativeHost to MainApplication.kt
function withReactNativeHostFix(config) {
  return withDangerousMod(config, [
    'android',
    (config) => {
      const packageName = config.android?.package ?? 'com.rafaelperazzo.appdc';
      const mainAppPath = path.join(
        config.modRequest.platformProjectRoot,
        'app/src/main/java',
        ...packageName.split('.'),
        'MainApplication.kt'
      );
      if (!fs.existsSync(mainAppPath)) return config;

      let content = fs.readFileSync(mainAppPath, 'utf8');

      if (!content.includes('import com.facebook.react.ReactNativeHost')) {
        content = content.replace(
          'import com.facebook.react.ReactHost',
          'import com.facebook.react.ReactNativeHost\nimport com.facebook.react.ReactHost'
        );
      }

      if (!content.includes('override val reactNativeHost')) {
        content = content.replace(
          'override val reactHost: ReactHost by lazy {',
          '@Deprecated("Replaced by ReactHost in New Architecture")\n  override val reactNativeHost: ReactNativeHost\n    get() = throw UnsupportedOperationException("New Architecture does not use ReactNativeHost")\n\n  override val reactHost: ReactHost by lazy {'
        );
      }

      fs.writeFileSync(mainAppPath, content);
      return config;
    },
  ]);
}

// Fix 4: pin Gradle wrapper to 9.0.0 for consistent builds across environments
function withGradleVersionFix(config) {
  return withDangerousMod(config, [
    'android',
    (config) => {
      const wrapperPath = path.join(
        config.modRequest.platformProjectRoot,
        'gradle/wrapper/gradle-wrapper.properties'
      );
      if (!fs.existsSync(wrapperPath)) return config;
      let content = fs.readFileSync(wrapperPath, 'utf8');
      content = content.replace(
        /distributionUrl=.*/,
        'distributionUrl=https\\://services.gradle.org/distributions/gradle-9.0.0-bin.zip'
      );
      fs.writeFileSync(wrapperPath, content);
      return config;
    },
  ]);
}

// Fix 5: disable lint checkDependencies to avoid failures on third-party modules (e.g. async-storage, safe-area-context)
function withLintFix(config) {
  return withDangerousMod(config, [
    'android',
    (config) => {
      const buildGradlePath = path.join(config.modRequest.platformProjectRoot, 'app/build.gradle');
      if (!fs.existsSync(buildGradlePath)) return config;
      let content = fs.readFileSync(buildGradlePath, 'utf8');
      if (!content.includes('checkDependencies')) {
        content = content.replace(
          /^android \{/m,
          'android {\n    lint { checkDependencies = false }'
        );
        fs.writeFileSync(buildGradlePath, content);
      }
      return config;
    },
  ]);
}

module.exports = function withAndroidFixes(config) {
  config = withHermesCommandFix(config);
  config = withStylesFix(config);
  config = withReactNativeHostFix(config);
  config = withGradleVersionFix(config);
  config = withLintFix(config);
  return config;
};
