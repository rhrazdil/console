import { browser, ExpectedConditions as until } from 'protractor';
import { testName } from '@console/internal-integration-tests/protractor.conf';
import { selectDropdownOption } from '@console/shared/src/test-utils/utils';
import {
  consoleTypeSelectorId,
  serialDisconnectButton,
  serialReconnectButton,
  vncSendKeyButton,
  vncConnectingBar,
  serialConsoleWrapper,
} from '../views/consolesView';
import { PAGE_LOAD_TIMEOUT_SECS, VM_ACTION } from './utils/consts';
import { VirtualMachine } from './models/virtualMachine';
import { ProvisionConfigName } from './utils/constants/wizard';
import { getVMManifest } from './utils/mocks';
import {
  createResource,
  deleteResource,
  waitForStringNotInElement,
} from '../../../console-shared/src/test-utils/utils';

describe('KubeVirt VM VNC/Serial consoles', () => {
  const vmResource = getVMManifest(ProvisionConfigName.CONTAINER, testName);
  const vm = new VirtualMachine(vmResource.metadata);

  beforeAll(async () => {
    createResource(vmResource);
    await vm.action(VM_ACTION.Start);
    await vm.navigateToConsoles();
  });

  afterAll(() => {
    deleteResource(vmResource);
  });

  it('Serial Console connects', async () => {
    await selectDropdownOption(consoleTypeSelectorId, 'Serial Console');

    // Wait for Loading span element to disappear
    await waitForStringNotInElement(serialConsoleWrapper, 'Loading');

    // Ensure presence of control buttons
    await browser.wait(until.presenceOf(serialReconnectButton), PAGE_LOAD_TIMEOUT_SECS);
    await browser.wait(until.presenceOf(serialDisconnectButton), PAGE_LOAD_TIMEOUT_SECS);
  });

  it('VNC Console connects', async () => {
    await selectDropdownOption(consoleTypeSelectorId, 'VNC Console');

    // Wait for Connecting bar element to disappear
    await browser.wait(until.invisibilityOf(vncConnectingBar));
    await browser.wait(until.presenceOf(vncSendKeyButton), PAGE_LOAD_TIMEOUT_SECS);
  });
});
