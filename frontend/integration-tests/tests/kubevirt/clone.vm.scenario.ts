/* eslint-disable no-undef, max-nested-callbacks */
import { execSync } from 'child_process';
import { $, browser, ExpectedConditions as until } from 'protractor';
import * as _ from 'lodash';

// eslint-disable-next-line no-unused-vars
import { removeLeakedResources, waitForCount, searchYAML, searchJSON, getResourceObject, withResource, deleteResource, createResources, deleteResources, createResource } from './utils/utils';
import { CLONE_VM_TIMEOUT, VM_BOOTUP_TIMEOUT, PAGE_LOAD_TIMEOUT, VM_STOP_TIMEOUT, TABS, CLONED_VM_BOOTUP_TIMEOUT } from './utils/consts';
import { appHost, testName } from '../../protractor.conf';
import { filterForName, isLoaded, resourceRowsPresent, resourceRows } from '../../views/crud.view';
import { basicVmConfig, networkInterface, multusNad, getVmManifest, cloudInitCustomScriptConfig, emptyStr, rootDisk } from './utils/mocks';
import * as wizardView from '../../views/kubevirt/wizard.view';
import Wizard from './models/wizard';
import { VirtualMachine } from './models/virtualMachine';
import { statusIcons } from '../../views/kubevirt/virtualMachine.view';


describe('Test clone VM.', () => {
  const leakedResources = new Set<string>();
  const wizard = new Wizard();
  const testContainerVm = getVmManifest('Container', testName);
  const vm = new VirtualMachine(testContainerVm.metadata);
  const nameValidationNamespace = `${testName}-cloning`;
  const testNameValidationVm = getVmManifest('Container', nameValidationNamespace, testContainerVm.metadata.name);
  const clonedVmConf = {
    name: `${vm.name}-clone`,
    namespace: vm.namespace,
  };

  describe('Test Clone VM wizard dialog validation', () => {
    beforeAll(() => {
      execSync(`oc new-project ${nameValidationNamespace} --skip-config-write=true`);
      createResources([testContainerVm, multusNad, testNameValidationVm]);
    });

    afterAll(() => {
      deleteResources([testContainerVm, testNameValidationVm, multusNad]);
      // TODO: On openshift 4 removing a project hangs on Terminating, needs to be removed after test run for now
      // execSync(`oc delete project ${nameValidationNamespace}`);
    });

    it('Display warning in clone wizard when cloned vm is running.', async() => {
      await vm.action('Start');
      await vm.action('Clone');

      await browser.wait(until.visibilityOf(wizardView.cloneVmWarning), PAGE_LOAD_TIMEOUT);
      expect(wizardView.nextButton.isEnabled()).toBeTruthy('It should still be possible to clone the VM');

      // Clone the VM
      await wizard.next();
      const clonedVm = new VirtualMachine(clonedVmConf);

      await withResource(leakedResources, clonedVm.asResource(), async() => {
        // Verify that the original VM is stopped
        await vm.waitForStatusIcon(statusIcons.off, VM_STOP_TIMEOUT);
      });
    }, CLONE_VM_TIMEOUT);

    it('Prefill correct data in the clone VM dialog.', async() => {
      await vm.action('Clone');

      expect(wizardView.cloneVmWarning.isPresent()).toBe(false, 'Warning should not be present.');
      expect(wizardView.nameInput.getAttribute('value')).toEqual(`${vm.name}-clone`, '\'-cloned\' should be appended to cloned VM name.');
      expect(wizardView.descriptionInput.getText()).toEqual(testContainerVm.metadata.annotations.description, 'Description should match original VM description.');
      expect($(wizardView.namespaceDropdownId).getText()).toEqual(vm.namespace, 'Namaspace should match original VM namespace.');

      await wizard.close();
    });

    it('Validate VM name.', async() => {
      await vm.action('Clone');

      expect(wizardView.cloneVmWarning.isPresent()).toBe(false, 'Warning should not be present.');

      // Check warning is displayed when VM has same name as existing VM
      await wizard.fillName(vm.name);
      await browser.wait(until.presenceOf(wizardView.wizardHelpBlock));
      expect(wizardView.wizardHelpBlock.getText()).toContain('Name is already used', 'Help block should be displayed.');

      // Check warning is displayed when VM has same name as existing VM in another namespace
      await wizard.fillName(testNameValidationVm.metadata.name);
      await wizard.selectNamespace(testNameValidationVm.metadata.namespace);
      await browser.wait(until.presenceOf(wizardView.wizardHelpBlock));
      expect(wizardView.wizardHelpBlock.getText()).toContain('Name is already used', 'Help block should be displayed.');

      await wizard.close();
    });
  });

  describe('Test cloning with Container VM.', () => {
    const clonedVm = new VirtualMachine(clonedVmConf);

    beforeAll(() => {
      createResource(multusNad);
    });

    afterAll(() => {
      deleteResource(multusNad);
      removeLeakedResources(leakedResources);
    });

    beforeEach(() => {
      createResource(testContainerVm);
    });

    afterEach(() => {
      deleteResource(testContainerVm);
    });

    it('Start cloned VM on creation', async() => {
      await vm.action('Clone');
      await wizard.startOnCreation();
      await wizard.next();

      await withResource(leakedResources, clonedVm.asResource(), async() => {
        await clonedVm.navigateToListView();

        await filterForName(`${testContainerVm.metadata.name}-clone`);
        await resourceRowsPresent();
        await browser.wait(until.textToBePresentInElement(wizardView.firstRowVMStatus, 'Running'), VM_BOOTUP_TIMEOUT);
      });
    }, VM_BOOTUP_TIMEOUT);

    it('Cloned VM has cleared MAC addresses.', async() => {
      await vm.addNic(networkInterface);
      await vm.action('Clone');
      await wizard.next();

      await withResource(leakedResources, clonedVm.asResource(), async() => {
        await clonedVm.navigateToTab(TABS.NICS);
        await browser.wait(until.and(waitForCount(resourceRows, 2)), PAGE_LOAD_TIMEOUT);
        const addedNic = (await clonedVm.getAttachedNics()).find(nic => nic.name === networkInterface.name);
        expect(addedNic.mac === emptyStr).toBe(true, 'MAC address should be cleared');
      });
      await vm.removeNic(networkInterface.name);
    }, VM_BOOTUP_TIMEOUT);

    it('Cloned VM has vm.kubevirt.io/name label.', async() => {
      await vm.action('Clone');
      await wizard.next();

      await withResource(leakedResources, clonedVm.asResource(), async() => {
        expect(searchYAML(`vm.kubevirt.io/name: ${vm.name}`, clonedVm.name, clonedVm.namespace, 'vm'))
          .toBeTruthy('Cloned VM should have vm.kubevirt.io/name label.');
      });
    }, VM_BOOTUP_TIMEOUT);

    it('Clone VM with Container source.', async() => {
      await vm.action('Clone');
      await wizard.next();

      await withResource(leakedResources, clonedVm.asResource(), async() => {
        expect(searchYAML('kubevirt/cirros-registry-disk-demo', clonedVm.name, clonedVm.namespace, 'vm'))
          .toBeTruthy('Cloned VM should have container image.');
        await clonedVm.action('Start');
      });
    }, CLONE_VM_TIMEOUT);
  });

  describe('Test cloning with URL provision method', () => {
    const urlVmManifest = getVmManifest('URL', testName);
    const urlVm = new VirtualMachine(urlVmManifest.metadata);
    const cloudInitVmProvisionConfig = {
      method: 'URL',
      source: basicVmConfig.sourceURL,
    };

    it('Clone VM with URL source.', async() => {
      createResource(urlVmManifest);
      await withResource(leakedResources, urlVm.asResource(), async() => {
        await urlVm.action('Start');
        await urlVm.action('Clone');
        await wizard.next();

        const clonedVm = new VirtualMachine({name: `${urlVm.name}-clone`, namespace: urlVm.namespace});
        await withResource(leakedResources, clonedVm.asResource(), async() => {
          await clonedVm.action('Start', true, CLONED_VM_BOOTUP_TIMEOUT);

          // Check cloned PVC exists
          const clonedVmDiskName = `${clonedVm.name}-${urlVm.name}-rootdisk-clone`;
          await browser.get(`${appHost}/k8s/ns/${testName}/persistentvolumeclaims`);
          await isLoaded();
          await filterForName(clonedVmDiskName);
          await resourceRowsPresent();

          // Verify cloned disk dataVolumeTemplate is present in cloned VM manifest
          expect(searchJSON('spec.dataVolumeTemplates[0].metadata.name', clonedVmDiskName, clonedVm.name, clonedVm.namespace, 'vm'))
            .toBeTruthy('Cloned VM should have container image.');
        });
      });
    }, CLONE_VM_TIMEOUT);

    it('Clone VM with URL source and Cloud Init.', async() => {
      const ciVmConfig = {
        name: `ci-${testName}`,
        namespace: testName,
        description: `Default description ${testName}`,
        provisionSource: cloudInitVmProvisionConfig,
        storageResources: [rootDisk],
        networkResources: [],
        flavor: basicVmConfig.flavor,
        operatingSystem: basicVmConfig.operatingSystem,
        workloadProfile: basicVmConfig.workloadProfile,
        startOnCreation: false,
        cloudInit: cloudInitCustomScriptConfig,
      };
      const ciVm = new VirtualMachine(ciVmConfig);
      await ciVm.create(ciVmConfig);
      await withResource(leakedResources, ciVm.asResource(), async() => {
        await ciVm.action('Clone');
        await wizard.next();
        const clonedVm = new VirtualMachine({name: `${ciVmConfig.name}-clone`, namespace: ciVm.namespace});
        await withResource(leakedResources, clonedVm.asResource(), async() => {
          // Check disks on cloned VM
          const disks = await clonedVm.getAttachedResources(TABS.DISKS);
          [rootDisk.name, 'cloudinitdisk'].forEach(element => {
            expect(disks.includes(element)).toBe(true, `Disk ${element} should be present on cloned VM.`);
          });

          // Verify configuration of cloudinitdisk is the same
          const clonedVmJson = getResourceObject(clonedVm.name, clonedVm.namespace, clonedVm.kind);
          const clonedVmVolumes = _.get(clonedVmJson, 'spec.template.spec.volumes');
          const result = _.filter(clonedVmVolumes, function(o) {
            return o.name === 'cloudinitdisk';
          });

          expect(result.length).toBe(1, 'There should be only one cloudinitdisk');
          expect(result[0].cloudInitNoCloud.userData).toEqual(cloudInitCustomScriptConfig.customScript, 'CI config should remain the same.');

          // Verify the cloned VM can boot
          await clonedVm.action('Start', true, CLONED_VM_BOOTUP_TIMEOUT);
        });
      });
    }, CLONE_VM_TIMEOUT);
  });
});
