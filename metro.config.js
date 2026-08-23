const { getDefaultConfig } = require('expo/metro-config');
const { withNativewind } = require('nativewind/metro');

const config = getDefaultConfig(__dirname);

/**
 * WDK usa `sodium-universal` para el manejo seguro de claves en memoria, y en
 * Node eso resuelve a `sodium-native`, una extensión en C++ que no existe en
 * React Native.
 *
 * `sodium-universal` ya declara la alternativa en su campo `browser`:
 * `sodium-native` → `sodium-javascript`, que es JavaScript puro. Metro no lee
 * ese campo por defecto para paquetes anidados, así que se lo indicamos acá.
 */
const original = config.resolver.resolveRequest;

config.resolver.resolveRequest = (context, moduleName, platform) => {
  if (moduleName === 'sodium-native') {
    return context.resolveRequest(context, 'sodium-javascript', platform);
  }
  return (original ?? context.resolveRequest)(context, moduleName, platform);
};

module.exports = withNativewind(config);
