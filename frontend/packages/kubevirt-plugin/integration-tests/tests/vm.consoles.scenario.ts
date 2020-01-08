import { browser, ExpectedConditions as until } from 'protractor';
import { testName } from '@console/internal-integration-tests/protractor.conf';
import { click, selectDropdownOption, withResource } from '@console/shared/src/test-utils/utils';
import {
  consoleTypeSelector,
  consoleTypeSelectorId,
  serialDisconnectButton,
  serialReconnectButton,
  vncSendKeyButton,
} from '../views/consolesView';
import { PAGE_LOAD_TIMEOUT_SECS } from './utils/consts';
import { VirtualMachine } from './models/virtualMachine';
import { vmConfig, getProvisionConfigs } from './vm.wizard.configs';
import { ProvisionConfigName } from './utils/constants/wizard';

describe('KubeVirt VM VNC/Serial consoles', () => {
  const leakedResources = new Set<string>();

  const provisionConfigs = getProvisionConfigs();
  const configName = ProvisionConfigName.CONTAINER;
  const provisionConfig = provisionConfigs.get(configName);

  provisionConfig.networkResources = [];
  provisionConfig.storageResources = [];

  const testVMConfig = vmConfig(configName.toLowerCase(), testName, provisionConfig);
  const vm = new VirtualMachine(testVMConfig);

  it('VM VNC/Serial Console is connected', async () => {
    await withResource(leakedResources, vm.asResource(), async () => {
      await vm.create(testVMConfig);

      // verify Serial Console is connected
      await vm.navigateToConsoles();
      await browser.wait(until.presenceOf(consoleTypeSelector));
      // based on test result, it has to click twice to select the dropdown item.
      await click(consoleTypeSelector);
      await click(consoleTypeSelector);
      await selectDropdownOption(consoleTypeSelectorId, 'Serial Console');
      await browser.wait(until.presenceOf(serialReconnectButton), PAGE_LOAD_TIMEOUT_SECS);
      await browser.wait(
        until.elementToBeClickable(serialDisconnectButton),
        PAGE_LOAD_TIMEOUT_SECS,
      );

      // verify VNC Console is connected
      await click(consoleTypeSelector);
      await click(consoleTypeSelector);
      await selectDropdownOption(consoleTypeSelectorId, 'VNC Console');
      await browser.wait(until.presenceOf(vncSendKeyButton), PAGE_LOAD_TIMEOUT_SECS);
    });
  });
});
