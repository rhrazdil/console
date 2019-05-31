/* eslint-disable no-undef */
import { browser } from 'protractor';

import { appHost, testName } from '../../protractor.conf';
import { isLoaded, errorMessage } from '../../views/crud.view';
import * as yamlView from '../../views/yaml.view';
import { removeLeakedResources, deleteResource, createResource, withResource } from './utils/utils';
import Yaml from './models/yaml';
import { VirtualMachine } from './models/virtualMachine';
import { multusNad, customVMWithNicDisk } from './utils/mocks';
import { TABS, VM_BOOTUP_TIMEOUT } from './utils/consts';

describe('Test create vm from yaml', () => {
  const leakedResources = new Set<string>();
  const yaml = new Yaml();

  beforeAll(async() => {
    createResource(multusNad);
  });

  beforeEach(async() => {
    await browser.get(`${appHost}/k8s/ns/${testName}/virtualmachines`);
    await isLoaded();
    await yaml.openYamlPage();
  });

  afterEach(async() => {
    removeLeakedResources(leakedResources);
  });

  afterAll(async() => {
    deleteResource(multusNad);
  });

  it('Creates VM from default yaml', async() => {
    await yaml.createVMFromYaml();
    await isLoaded();
    const vm = new VirtualMachine({name: 'example', namespace: testName});
    await withResource(leakedResources, vm.asResource(), async() => {
      await vm.action('Start');
    });
  }, VM_BOOTUP_TIMEOUT);

  it('Fails to create VM from yaml if VM already exists', async() => {
    // Create an example VM
    await yaml.createVMFromYaml();
    await isLoaded();
    const vm = new VirtualMachine({name: 'example', namespace: testName});
    await withResource(leakedResources, vm.asResource(), async() => {
      await browser.get(`${appHost}/k8s/ns/${testName}/virtualmachines`);
      await isLoaded();
      await yaml.openYamlPage();
      await yaml.createVMFromYaml();
      await yaml.errorOccurOnCreateVM();
      expect(errorMessage.getText()).toContain('already exists');
    });
  });

  it('Creates VM from a custom vm yaml with additional nics and disks', async() => {
    await yamlView.setContent(customVMWithNicDisk);
    await yaml.createVMFromYaml();
    await isLoaded();
    const vm = new VirtualMachine({name: `vm-${testName}`, namespace: testName});
    await withResource(leakedResources, vm.asResource(), async() =>{
      await vm.action('Start');
      // Verify additional nic and disk exists.
      // Note: 'testdisk' and 'nic1' are hard coded in vm yaml customVMWithNicDisk
      expect((await vm.getAttachedResources(TABS.DISKS)).includes('testdisk')).toBe(true);
      expect((await vm.getAttachedResources(TABS.NICS)).includes('nic1')).toBe(true);
    });
  }, VM_BOOTUP_TIMEOUT);

  it('Fails to create VM from invalid yaml', async() => {
    await yamlView.setContent(customVMWithNicDisk.replace('VirtualMachine', 'VirtualMachineInstance'));
    await yaml.createVMFromYaml();
    await yaml.errorOccurOnCreateVM();
    await yaml.cancelCreateVM();
    expect(browser.getCurrentUrl()).toEqual(`${appHost}/k8s/ns/${testName}/virtualmachines`);
  });
});
