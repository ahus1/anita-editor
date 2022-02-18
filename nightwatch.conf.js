// this configuration file overrides the default settings
module.exports = {
  test_settings: {
    default: {
      desiredCapabilities: {
        'goog:chromeOptions': {
          args: [
            'window-size=1280,800',
            '--headless',
            // '--auto-open-devtools-for-tabs',
            '--disable-gpu',
            '--no-sandbox',
          ],
        },
      },
    },
  },
};
