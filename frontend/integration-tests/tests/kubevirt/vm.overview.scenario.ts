/* eslint-disable no-undef */
import { browser, ExpectedConditions as until } from 'protractor';

import { appHost, testName } from '../../protractor.conf';
import { isLoaded, resourceTitle } from '../../views/crud.view';
import { getVmManifest, basicVmConfig } from './utils/mocks';
import { activeTab } from '../../views/horizontal-nav.view';
import * as vmView from '../../views/kubevirt/virtualMachine.view';
import { fillInput, click, exposeService, selectDropdownOption, asyncForEach, createResource, deleteResource } from './utils/utils';
import { VirtualMachine } from './models/virtualMachine';
import { TABS, VM_BOOTUP_TIMEOUT, DASHES } from './utils/consts';
import { itemVirtualMachine, virtualMachineLink, vmStatusLink } from '../../views/kubevirt/project.view';
import { detailViewAction } from '../../views/kubevirt/vm.actions.view';

const newVMDescription = 'edited vm description';
const vmName = `vm-${testName}`;

const exposeServices = new Set<any>();
const serviceTemplate = {name: vmName, kind: 'vm', type: 'NodePort', namespace: testName};
exposeServices.add({exposeName: `${vmName}-service-ssh`, port: '22', targetPort: '20022', ...serviceTemplate});
exposeServices.add({exposeName: `${vmName}-service-smtp`, port: '25', targetPort: '20025', ...serviceTemplate});
exposeServices.add({exposeName: `${vmName}-service-http`, port: '80', targetPort: '20080', ...serviceTemplate});

describe('Test vm overview', () => {
  const cloudInit = `#cloud-config\nuser: cloud-user\npassword: atomic\nchpasswd: {expire: False}\nhostname: vm-${testName}.example.com`;
  const testVm = getVmManifest('Container', testName, vmName, cloudInit);
  const vm = new VirtualMachine(testVm.metadata);

  beforeAll(async() => {
    createResource(testVm);
    exposeService(exposeServices);
  });

  afterAll(async() => {
    deleteResource(testVm);
  });

  beforeEach(async() => {
    await vm.navigateToTab(TABS.OVERVIEW);
    await isLoaded();
  });

  it('Check vm details in overview when vm is off', async() => {

    // Non empty fields when vm is off
    expect(await vmView.vmDetailName(testName, vmName).getText()).toEqual(vmName);
    expect(await vmView.vmDetailDesc(testName, vmName).getText()).toEqual(testName);
    expect(await vmView.statusIcon(vmView.statusIcons.off).isPresent()).toBeTruthy();
    expect(await vmView.vmDetailOS(testName, vmName).getText()).toEqual(basicVmConfig.operatingSystem);
    expect(await vmView.vmDetailWorkloadProfile(testName, vmName).getText()).toEqual(basicVmConfig.workloadProfile);
    expect(await vmView.vmDetailTemplate(testName, vmName).getText()).toEqual('openshift/rhel7-desktop-tiny');
    expect(await vmView.vmDetailNamespace(testName, vmName).$('a').getText()).toEqual(testName);
    expect(await vmView.vmDetailBootOrder(testName, vmName).getText()).toEqual(['rootdisk', 'nic0', 'cloudinitdisk']);
    expect(await vmView.vmDetailFlavor(testName, vmName).getText()).toEqual(basicVmConfig.flavor);
    expect(await vmView.vmDetailFlavorDesc(testName, vmName).getText()).toEqual('1 CPU, 1G Memory');

    // Empty fields when vm is off
    expect(await vmView.vmDetailIP(testName, vmName).getText()).toEqual(DASHES);
    expect(await vmView.vmDetailPod(testName, vmName).getText()).toEqual(DASHES);
    expect(await vmView.vmDetailHostname(testName, vmName).getText()).toEqual(DASHES);
    expect(await vmView.vmDetailNode(testName, vmName).getText()).toEqual(DASHES);

    // Edit button is enabled when VM is off
    expect(vmView.detailViewEditBtn.isEnabled()).toBe(true);
  });

  it('Check vm details in overview when vm is running', async() => {
    await vm.action('Start');
    expect(await vmView.statusIcon(vmView.statusIcons.running).isPresent()).toBeTruthy();

    // Empty fields turn into non-empty
    expect(await vmView.vmDetailIP(testName, vmName).getText()).not.toEqual(DASHES);
    expect(await vmView.vmDetailPod(testName, vmName).$('a').getText()).toContain('virt-launcher');
    expect(await vmView.vmDetailNode(testName, vmName).$('a').getText()).not.toEqual(DASHES);

    // Edit button is disabled when VM is running
    expect(await vmView.detailViewEditBtn.isEnabled()).toBe(false);
  });

  it('Edit vm flavor', async() => {
    await vm.action('Stop');
    await isLoaded();

    // Cancel edit
    await vmView.detailViewEditBtn.click();
    await fillInput(vmView.vmDetailDescTextarea(testName, vmName), newVMDescription);
    await selectDropdownOption(vmView.vmDetailFlavorDropdownId(testName, vmName), 'Custom');
    await fillInput(vmView.vmDetailFlavorCPU(testName, vmName), '2');
    await fillInput(vmView.vmDetailFlavorMemory(testName, vmName), '2');
    await vmView.detailViewCancelBtn.click();
    expect(await vmView.vmDetailDesc(testName, vmName).getText()).toEqual(testName);
    expect(await vmView.vmDetailFlavorDesc(testName, vmName).getText()).toEqual('1 CPU, 1G Memory');

    // Save edit
    await vmView.detailViewEditBtn.click();
    await fillInput(vmView.vmDetailDescTextarea(testName, vmName), newVMDescription);
    await selectDropdownOption(vmView.vmDetailFlavorDropdownId(testName, vmName), 'Custom');
    await fillInput(vmView.vmDetailFlavorCPU(testName, vmName), '2');
    await fillInput(vmView.vmDetailFlavorMemory(testName, vmName), '2');
    await vmView.detailViewSaveBtn.click();
    await isLoaded();
    expect(await vmView.vmDetailDesc(testName, vmName).getText()).toEqual(newVMDescription);
    expect(await vmView.vmDetailFlavorDesc(testName, vmName).getText()).toEqual('2 CPU, 2G Memory');
  });

  it('Check vm services', async() => {
    await asyncForEach(exposeServices, async(srv) => {
      await vm.navigateToTab(TABS.OVERVIEW);
      expect(await vmView.vmDetailService(testName, srv.exposeName).getText()).toEqual(srv.exposeName);
      await click(vmView.vmDetailService(testName, srv.exposeName));
      await isLoaded();
      await browser.wait(until.textToBePresentInElement(resourceTitle, srv.exposeName));
    });
  });

  describe('Test vm overview on project overview page', () => {
    beforeEach(async() => {
      await browser.get(`${appHost}/overview/ns/${testName}`);
      await isLoaded();
    });

    it('Check vm details on project overview', async() => {
      expect(vmView.statusIcon(vmView.statusIcons.off).isPresent()).toBeTruthy();
      await itemVirtualMachine.click();
      await isLoaded();
      await detailViewAction('Start', true);
      await browser.wait(until.presenceOf(vmView.statusIcon(vmView.statusIcons.running)), VM_BOOTUP_TIMEOUT);

      expect(await vmView.vmDetailDesc(testName, vmName).getText()).toEqual(newVMDescription);
      expect(await vmView.vmDetailOS(testName, vmName).getText()).toEqual(basicVmConfig.operatingSystem);
      expect(await vmView.statusIcon(vmView.statusIcons.running).isPresent()).toBeTruthy();
      expect(await vmView.vmDetailTemplate(testName, vmName).getText()).toEqual('openshift/rhel7-desktop-tiny');
      expect(await vmView.vmDetailNamespace(testName, vmName).$('a').getText()).toEqual(testName);
      expect(await vmView.vmDetailBootOrder(testName, vmName).getText()).toEqual(['rootdisk', 'nic0', 'cloudinitdisk']);
      expect(await vmView.vmDetailFlavorDesc(testName, vmName).getText()).toEqual('2 CPU, 2G Memory');
      expect(await vmView.vmDetailIP(testName, vmName).getText()).not.toEqual(DASHES);
      expect(await vmView.vmDetailHostname(testName, vmName).getText()).toEqual(DASHES);
      expect(await vmView.vmDetailPod(testName, vmName).$('a').getText()).toContain('virt-launcher');
      expect(await vmView.vmDetailNode(testName, vmName).$('a').getText()).not.toEqual(DASHES);

      await asyncForEach(exposeServices, async(srv) => {
        expect(await vmView.vmDetailService(testName, srv.exposeName).getText()).toEqual(srv.exposeName);
      });
    }, VM_BOOTUP_TIMEOUT);

    it('Click vm link', async() => {
      await click(virtualMachineLink(0));
      await isLoaded();
      expect(await browser.getCurrentUrl()).toEqual(`${appHost}/k8s/ns/${testName}/virtualmachines/${vmName}`);
    });

    it('Click vm status when vm is running', async() => {
      await click(vmStatusLink(0));
      await isLoaded();
      expect(await activeTab.first().getText()).toEqual('Overview');
      expect(await browser.getCurrentUrl()).toContain('pods');
    });

    xit('BZ(1717462) Click vm status when vm is pending', async() => {
      await itemVirtualMachine.click();
      await isLoaded();
      await detailViewAction('Restart', true);
      await browser.wait(until.presenceOf(vmView.statusIcon(vmView.statusIcons.starting)), VM_BOOTUP_TIMEOUT);
      await browser.wait(until.presenceOf(vmStatusLink(0)), VM_BOOTUP_TIMEOUT);
      await click(vmStatusLink(0));
      expect(await activeTab.first().getText()).toEqual('Events');
      const currentUrl = await browser.getCurrentUrl();
      expect(currentUrl).toContain('pods');
      expect(currentUrl).toContain('events');
    });

    it('Open and close vm overview page', async() => {
      await itemVirtualMachine.click();
      await isLoaded();
      expect(await vmView.vmDetailOS(testName, vmName).isPresent()).toBeTruthy();

      // Close vm overview page
      await itemVirtualMachine.click();
      await isLoaded();
      expect(await vmView.vmDetailOS(testName, vmName).isPresent()).toBe(false, 'Should not display OS');
    });
  });
});


