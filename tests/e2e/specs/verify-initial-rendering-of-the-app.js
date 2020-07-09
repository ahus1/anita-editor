/// /////////////////////////////////////////////////////////////
// For authoring Nightwatch tests, see
// https://nightwatchjs.org/guide
//
// For more information on working with page objects see:
//   https://nightwatchjs.org/guide/working-with-page-objects/
/// /////////////////////////////////////////////////////////////

module.exports = {
  beforeEach: (browser) => browser.init(),

  'verify if sidebar contains "Welcome" link': (browser) => {
    const homepage = browser.page.homepage();
    homepage.waitForElementVisible('@appContainer');

    const { app } = homepage.section;
    app.expect.section('@sidebar').to.be.visible;
    app.section.sidebar.assert.elementCount('@welcome', 1);

    browser.end();
  },

  'verify if welcome content is rendered': (browser) => {
    const homepage = browser.page.homepage();
    const { contentWrapper } = homepage.section.app.section;
    contentWrapper.expect.element('@adoc').text.to.contain('This is a minimal editor for AsciiDoc files');
  },
};
