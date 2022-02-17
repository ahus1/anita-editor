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
    browser.execute((text) => {
      document.getElementsByClassName('CodeMirror')[0].CodeMirror.setValue(text);
    }, ['Hello world!']);
    // the following used to work with Vue2
    // browser.click('.CodeMirror').keys('Hello world!');
    contentWrapper.expect.element('@adoc').text.to.contain('Hello world!');

    browser.end();
  },
};
