import { LogBox } from 'react-native';

// victory-native draws chart bars via react-native-skia's legacy SkPath.addRect/addRRect,
// deprecated as of skia 2.6 (SDK 57) but still functional — noise only, not app code.
LogBox.ignoreLogs([
  'SkPath.addRect() is deprecated',
  'SkPath.addRRect() is deprecated',
]);

import 'expo-router/entry';
