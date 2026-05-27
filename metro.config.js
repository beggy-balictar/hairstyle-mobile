const path = require('path');
const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Use prebuilt CJS so Metro does not compile mediapipe src (worklets/babel plugin chain).
const mediapipeRoot = path.join(__dirname, 'node_modules', 'react-native-mediapipe');
const defaultResolveRequest = config.resolver.resolveRequest;
config.resolver.resolveRequest = (context, moduleName, platform) => {
  if (moduleName === 'react-native-mediapipe') {
    return {
      type: 'sourceFile',
      filePath: path.join(mediapipeRoot, 'lib/commonjs/index.js'),
    };
  }
  if (defaultResolveRequest) {
    return defaultResolveRequest(context, moduleName, platform);
  }
  return context.resolveRequest(context, moduleName, platform);
};

// Windows workaround: Metro may crash on transient native build folders
// generated under node_modules by react-native-worklets-core.
config.resolver = config.resolver || {};
const extraBlockList = [
  /node_modules[\\/]+\.react-native-worklets-core-[^\\/]+[\\/]+android[\\/]+\.cxx[\\/].*/,
  /node_modules[\\/]+\.react-native-worklets-core-[^\\/]+[\\/]+android[\\/]+build[\\/].*/,
];
if (Array.isArray(config.resolver.blockList)) {
  config.resolver.blockList = [...config.resolver.blockList, ...extraBlockList];
} else if (config.resolver.blockList) {
  config.resolver.blockList = [config.resolver.blockList, ...extraBlockList];
} else {
  config.resolver.blockList = extraBlockList;
}

module.exports = config;
