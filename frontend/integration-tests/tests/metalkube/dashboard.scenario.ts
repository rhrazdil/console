import { browser } from 'protractor';
const execSync = require('child_process').execSync;

import { appHost } from '../../protractor.conf';
import * as dashboardView from '../../views/metalkube/dashboards.view';

async function expectCounters(rowNumber, upCounterExpected, downCounterExpected, label) {
  const inventoryItemLabel = await dashboardView.inventoryItemLabel(rowNumber).getText();
  expect(inventoryItemLabel).toEqual(`${upCounterExpected + downCounterExpected} ${label}`);
  let elem = dashboardView.inventoryUpCounter(rowNumber);
  const upHosts = Number(await dashboardView.getTextIfPresent(elem, '0'));
  elem = dashboardView.inventoryDownCounter(rowNumber);
  const downHosts = Number(await dashboardView.getTextIfPresent(elem, '0'));
  expect(upHosts).toEqual(upCounterExpected);
  expect(downHosts).toEqual(downCounterExpected);
}

describe('Inventory card', () => {
  beforeAll(async() => {
    await browser.get(`${appHost}/dashboards`);
    await dashboardView.isLoaded();
    browser.sleep(10000); // the counters on the page start updating late...
  });

  it('Node count is displayed', async() => {
    // get the number of ready and not ready nodes from the CLI
    let readyNodes = 0;
    let notReadyNodes = 0;
    const output = execSync('oc get nodes', { encoding: 'utf-8' });
    const lines = output.split('\n');
    lines.forEach(function(line) {
      if (line.indexOf(' Ready ') > 0) {
        readyNodes++;
      }
      if (line.indexOf(' NotReady ') > 0) {
        notReadyNodes++;
      }
    });
    const rowNumber = await dashboardView.inventoryRow(dashboardView.INVENTORY_NODES);
    expectCounters(rowNumber, readyNodes, notReadyNodes, 'Nodes');
  });

  it('Host count is displayed', async() => {
    // get the hosts and their statuses from the CLI
    let readyHosts = 0;
    let notReadyHosts = 0;
    const output = execSync('oc get baremetalhosts -n openshift-machine-api', { encoding: 'utf-8' });
    const lines = output.split('\n').slice(1); // slice(1) to ignore the 1st line of output
    lines.forEach(function(line) {
      if (line.trim().length > 1) {
        if (line.indexOf(' OK ') > 0) {
          readyHosts++;
        } else {
          notReadyHosts++;
        }
      }
    });
    const rowNumber = await dashboardView.inventoryRow(dashboardView.INVENTORY_HOSTS);
    expectCounters(rowNumber, readyHosts, notReadyHosts, 'Hosts');
  });
});
