import { browser, ExpectedConditions as until } from 'protractor';
import { testName } from '@console/internal-integration-tests/protractor.conf';
import {
  withResource,
  selectDropdownOptionById,
  click,
} from '@console/shared/src/test-utils/utils';
import * as virtualMachineView from '../views/virtualMachine.view';
import { VM_CREATE_AND_EDIT_TIMEOUT_SECS } from './utils/consts';
import { VirtualMachine } from './models/virtualMachine';
import { vmConfig, getProvisionConfigs } from './vm.wizard.configs';
import * as editFlavorView from './models/editFlavorView';
import { fillInput } from './utils/utils';
import { ProvisionConfigName } from './utils/constants/wizard';
import { basicVMConfig } from './utils/mocks';

describe('KubeVirt VM detail - edit flavor', () => {
  const leakedResources = new Set<string>();
  const provisionConfigs = getProvisionConfigs();

  const defaultFlavorLower = basicVMConfig.flavor;
  const defaultFlavorUpper = basicVMConfig.flavor.replace(/^\w/, (c) => c.toUpperCase());

  const configName = ProvisionConfigName.CONTAINER;
  const provisionConfig = provisionConfigs.get(configName);

  // not needed for testing flavor
  provisionConfig.networkResources = [];
  provisionConfig.storageResources = [];

  it(
    `changes ${defaultFlavorLower} to large`,
    async () => {
      const vm1Config = vmConfig(configName.toLowerCase(), testName, provisionConfig);
      vm1Config.startOnCreation = false;

      const vm = new VirtualMachine(vmConfig(configName.toLowerCase(), testName, provisionConfig));
      await withResource(leakedResources, vm.asResource(), async () => {
        await vm.create(vm1Config);
        await vm.navigateToDetail();
        await browser.wait(
          until.textToBePresentInElement(
            virtualMachineView.vmDetailFlavor(vm.namespace, vm.name),
            `${defaultFlavorUpper}: 1 vCPU, 2 GB Memory`,
          ),
        );
        await vm.modalEditFlavor();
        await browser.wait(
          until.textToBePresentInElement(editFlavorView.flavorDropdownText(), defaultFlavorUpper),
        );
        await selectDropdownOptionById(editFlavorView.flavorDropdownId, 'large-link');
        await browser.wait(
          until.textToBePresentInElement(editFlavorView.flavorDropdownText(), 'Large'),
        );
        await click(editFlavorView.saveButton());

        await browser.wait(
          until.textToBePresentInElement(
            virtualMachineView.vmDetailFlavor(vm.namespace, vm.name),
            'Large: 2 vCPUs, 8 GB Memory',
          ),
        );
        expect(
          await virtualMachineView.vmDetailLabelValue('flavor.template.kubevirt.io/large'),
        ).toBe('true');
        expect(
          (await virtualMachineView.vmDetailLabelValue('vm.kubevirt.io/template')).startsWith(
            `rhel7-desktop-${defaultFlavorLower}-`, // template is not changed (might be in the future)
          ),
        ).toBeTruthy();
      });
    },
    VM_CREATE_AND_EDIT_TIMEOUT_SECS,
  );

  it(
    `changes ${defaultFlavorLower} to custom`,
    async () => {
      const vm1Config = vmConfig(configName.toLowerCase(), testName, provisionConfig);
      vm1Config.startOnCreation = false;

      const vm = new VirtualMachine(vmConfig(configName.toLowerCase(), testName, provisionConfig));
      await withResource(leakedResources, vm.asResource(), async () => {
        await vm.create(vm1Config);
        await vm.navigateToDetail();
        await browser.wait(
          until.textToBePresentInElement(
            virtualMachineView.vmDetailFlavor(vm.namespace, vm.name),
            `${defaultFlavorUpper}: 1 vCPU, 2 GB Memory`,
          ),
        );
        await vm.modalEditFlavor();

        await browser.wait(
          until.textToBePresentInElement(editFlavorView.flavorDropdownText(), defaultFlavorUpper),
        );
        await selectDropdownOptionById(editFlavorView.flavorDropdownId, 'Custom-link');
        await browser.wait(
          until.textToBePresentInElement(editFlavorView.flavorDropdownText(), 'Custom'),
        );
        await fillInput(editFlavorView.cpusInput(), '2');
        await fillInput(editFlavorView.memoryInput(), '1500');
        await click(editFlavorView.saveButton());

        await browser.wait(
          until.textToBePresentInElement(
            virtualMachineView.vmDetailFlavor(vm.namespace, vm.name),
            'Custom: 2 vCPUs, 1.5 GB Memory',
          ),
        );

        expect(
          await virtualMachineView.vmDetailLabelValue('flavor.template.kubevirt.io/Custom'),
        ).toBe('true');
        expect(
          (await virtualMachineView.vmDetailLabelValue('vm.kubevirt.io/template')).startsWith(
            `rhel7-desktop-${defaultFlavorLower}-`, // template is not changed (might be in the future)
          ),
        ).toBeTruthy();
      });
    },
    VM_CREATE_AND_EDIT_TIMEOUT_SECS,
  );
});
