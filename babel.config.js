module.exports = function (api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    // Inlines Drizzle's generated .sql migration files into the JS bundle so they
    // can be shipped to the device. Required for drizzle-kit's Expo driver.
    plugins: [['inline-import', { extensions: ['.sql'] }]],
  };
};
