const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

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
