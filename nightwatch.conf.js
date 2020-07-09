// this configuration file overrides the default settings
module.exports = {
  test_settings: {
    default: {
      desiredCapabilities: {
        chromeOptions: {
          args: [
            'window-size=1280,800',
            '--headless',
            '--disable-gpu',
            '--no-sandbox',
          ],
        },
      },
    },
  },
};
