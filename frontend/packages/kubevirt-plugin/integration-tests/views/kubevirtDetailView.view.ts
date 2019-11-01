import { $, browser, ExpectedConditions as until, element, by } from 'protractor';
import { resourceRows } from '@console/internal-integration-tests/views/crud.view';
import { click } from '@console/shared/src/test-utils/utils';

export const createNic = $('#create-nic-btn');
export const createDisk = $('#create-disk-btn');

export const nicName = $('#nic-name');
export const nicModel = $('#nic-model');
export const nicNetwork = $('#nic-network');
export const nicBinding = $('#nic-type');
export const nicMACAddress = $('#nic-mac-address');

export const diskSource = $('#disk-source');
export const diskURL = $('#disk-url');
export const diskContainer = $('#disk-container');
export const diskNamespace = $('#disk-namespace');
export const diskPVC = $('#disk-pvc');
export const diskName = $('#disk-name');
export const diskSize = $('#disk-size-row-size');
export const diskInterface = $('#disk-interface');
export const diskStorageClass = $('#disk-storage-class');

export const cancelBtn = element(by.buttonText('Cancel'));
export const applyBtn = element(by.buttonText('Add'));

// Used to determine presence of a new row by looking for confirmation buttons
export const newResourceRow = $('.kubevirt-vm-create-device-row__confirmation-buttons');

const tableContent = $('.ReactVirtualized__VirtualGrid.ReactVirtualized__List');
export const tableRows = () =>
  tableContent.getAttribute('innerText').then((text) => text.split('\n'));
export const tableRowForName = (name: string) =>
  resourceRows
    .filter((row) =>
      row
        .$$('td')
        .first()
        .getText()
        .then((text) => text === name),
    )
    .first();

const kebabForName = (name: string) => tableRowForName(name).$('[data-test-id=kebab-button]');
export const selectKebabOption = async (name: string, option: string) => {
  await browser.wait(until.presenceOf(kebabForName(name)));
  await click(kebabForName(name)); // open kebab dropdown
  await click($(`[data-test-action="${option}"]`));
};
