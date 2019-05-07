import { browser, ExpectedConditions as until, $, $$ } from 'protractor';

import { appHost, testName } from '../protractor.conf';
import * as crudView from '../views/crud.view';
import * as loginView from '../views/login.view';

const BROWSER_TIMEOUT = 15000;

describe('Basic console test', () => {

  afterAll(async() => {
    // Clears HTTP 401 errors for subsequent tests
    await browser.manage().logs().get('browser');
  });

  it('logs into console if necessary', async() => {
    await browser.get(appHost);

    const {BRIDGE_AUTH_USERNAME, BRIDGE_AUTH_PASSWORD} = process.env;
    if (BRIDGE_AUTH_USERNAME && BRIDGE_AUTH_PASSWORD) {
      await browser.wait(until.visibilityOf(loginView.nameInput), BROWSER_TIMEOUT);
      await loginView.nameInput.sendKeys(BRIDGE_AUTH_USERNAME);
      await loginView.passwordInput.sendKeys(BRIDGE_AUTH_PASSWORD);
      await loginView.submitButton.click();
      await browser.wait(until.visibilityOf($('.pf-c-brand')), BROWSER_TIMEOUT);
    }

    expect(browser.getCurrentUrl()).toContain(appHost);
  });

  it(`creates test namespace ${testName} if necessary`, async() => {
    // Use projects if OpenShift so non-admin users can run tests.
    const resource = browser.params.openshift === 'true' ? 'projects' : 'namespaces';
    await browser.get(`${appHost}/k8s/cluster/${resource}`);
    await crudView.isLoaded();
    const exists = await crudView.rowForName(testName).isPresent();
    if (!exists) {
      await crudView.createYAMLButton.click();
      await browser.wait(until.presenceOf($('.modal-body__field')));
      await $$('.modal-body__field').get(0).$('input').sendKeys(testName);
      await $$('.modal-body__field').get(1).$('input').sendKeys(`test-name=${testName}`);
      await $('.modal-content').$('#confirm-action').click();
      await browser.wait(until.urlContains(`/${testName}`), BROWSER_TIMEOUT);
    }

    expect(browser.getCurrentUrl()).toContain(appHost);
  });
});
