/**
 * Lo pide AppKit: valtio (su manejo de estado interno) usa `import.meta`, que
 * Hermes no entiende sin esta transformación. Documentado en
 * https://docs.reown.com/appkit/react-native/core/installation
 */
module.exports = function (api) {
  api.cache(true);
  return {
    presets: [['babel-preset-expo', { unstable_transformImportMeta: true }]],
  };
};
