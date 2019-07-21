import { browser, logging } from 'protractor';
import { execSync } from 'child_process';
import { writeFileSync } from 'fs';

export const consoleIntegrationTestPrefix = '@console/internal-integration-tests';

export const BROWSER_TIMEOUT = 15000;
export const appHost = `${process.env.BRIDGE_BASE_ADDRESS || 'http://localhost:9000'}${(process.env.BRIDGE_BASE_PATH || '/').replace(/\/$/, '')}`;
export const testName = `test-${Math.random().toString(36).replace(/[^a-z]+/g, '').substr(0, 5)}`;
export const screenshotsDir = 'gui_test_screenshots';
export const browserLogs: logging.Entry[] = [];

export const checkLogs = async() => (await browser.manage().logs().get('browser'))
  .map(log => {
    browserLogs.push(log);
    return log;
  });

function hasError() {
  return window.windowError;
}
export const checkErrors = async() => await browser.executeScript(hasError).then(err => {
  if (err) {
    fail(`omg js error: ${err}`);
  }
});

export const waitForCount = (elementArrayFinder, expectedCount) => {
  return async() => {
    const actualCount = await elementArrayFinder.count();
    return expectedCount >= actualCount;
  };
};

export const waitForNone = (elementArrayFinder) => {
  return async() => {
    const count = await elementArrayFinder.count();
    return count === 0;
  };
};

export const create = (obj) => {
  const filename = [screenshotsDir, `${obj.metadata.name}.${obj.kind.toLowerCase()}.json`].join('/');
  writeFileSync(filename, JSON.stringify(obj));
  execSync(`kubectl create -f ${filename}`);
  execSync(`rm ${filename}`);
};

export const extractFullPath = (path: string, pluginPath: string) => path.startsWith(consoleIntegrationTestPrefix)
  ? path.substring(`${consoleIntegrationTestPrefix}/`.length)
  : `${pluginPath}/${path}`;
