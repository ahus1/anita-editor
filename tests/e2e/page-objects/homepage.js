/**
 * A Nightwatch page object. The page object name is the filename.
 *
 * Example usage:
 *   browser.page.homepage.navigate()
 *
 * For more information on working with page objects see:
 *   https://nightwatchjs.org/guide/working-with-page-objects/
 *
 */

module.exports = {
  url: '/',
  commands: [],

  // A page object can have elements
  elements: {
    appContainer: '#app',
  },

  // Or a page objects can also have sections
  sections: {
    app: {
      selector: '#app',
      sections: {
        sidebar: {
          selector: '#sidebar',
          elements: {
            welcome: {
              selector: '#nav_welcome',
            },
          },
        },
        contentWrapper: {
          selector: '#content-wrapper',
          elements: {
            adoc: {
              selector: '.adoc',
            },
            url: {
              selector: '#url',
            },
            load: {
              selector: '#load',
            },
            editor: {
              selector: '.ace_editor',
            },
          },
        },
      },
    },
  },
};
