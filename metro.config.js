const path = require('path');
const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// When react-native-mediapipe is not installed, resolve to a JS stub so EAS can bundle.
const mediapipeStub = path.resolve(__dirname, 'src/ar/mediapipe-stub.ts');
const mediapipePkg = path.join(__dirname, 'node_modules', 'react-native-mediapipe', 'lib/commonjs/index.js');
const fs = require('fs');
const mediapipeTarget = fs.existsSync(mediapipePkg) ? mediapipePkg : mediapipeStub;

const defaultResolveRequest = config.resolver.resolveRequest;
config.resolver.resolveRequest = (context, moduleName, platform) => {
  if (moduleName === 'react-native-mediapipe') {
    return { type: 'sourceFile', filePath: mediapipeTarget };
  }
  if (defaultResolveRequest) {
    return defaultResolveRequest(context, moduleName, platform);
  }
  return context.resolveRequest(context, moduleName, platform);
};

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
