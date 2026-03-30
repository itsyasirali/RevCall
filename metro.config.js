const { getDefaultConfig } = require("expo/metro-config");
const { withNativeWind } = require('nativewind/metro');

const config = getDefaultConfig(__dirname)
config.resolver.assetExts.push('aac', 'm4a', 'mp3', 'wav');
module.exports = withNativeWind(config, { input: './global.css' })