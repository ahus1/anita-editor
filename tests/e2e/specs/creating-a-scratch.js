/// /////////////////////////////////////////////////////////////
// For authoring Nightwatch tests, see
// https://nightwatchjs.org/guide
//
// For more information on working with page objects see:
//   https://nightwatchjs.org/guide/working-with-page-objects/
/// /////////////////////////////////////////////////////////////

module.exports = {
  beforeEach: (browser) => browser.init(),

  'creating and editing a scratch': (browser) => {
    const homepage = browser.page.homepage();
    homepage.waitForElementVisible('@appContainer');

    const { contentWrapper } = homepage.section.app.section;
    contentWrapper.waitForElementPresent('@scratch');
    contentWrapper.waitForElementVisible('@scratch');
    // start a new scratch with a unique name
    contentWrapper.setValue('@scratch', `e2e-test-${new Date().getTime()}`);
    contentWrapper.click('@join');

    contentWrapper.waitForElementVisible('@editor');
    browser.click('.CodeMirror').keys('Hello world!');
    contentWrapper.expect.element('@adoc').text.to.contain('Hello world!');

    browser.end();
  },
};
