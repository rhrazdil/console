/* eslint-disable no-undef */
import { $, browser } from 'protractor';
import { execSync } from 'child_process';

import { appHost, testName } from '../../protractor.conf';
import { isLoaded } from '../../views/crud.view';
import { basicVmConfig, cloudInitCustomScriptConfig } from './mocks';
import * as vmView from '../../views/kubevirt/virtualMachine.view';
import { fillInput, removeLeakedResources, exposeService } from './utils';
import Wizard from './models/wizard';
import { VirtualMachine } from './models/virtualMachine';

describe('Test VM overview page', () => {
  const leakedResources = new Set<string>();
  const wizard = new Wizard();
  const vmName = `vm-${testName}`;
  const vm = new VirtualMachine(vmName, testName);

  beforeAll(async() => {
    const provisionSource = {method: 'Container', source: basicVmConfig.sourceContainer};

    await browser.get(`${appHost}/k8s/ns/${testName}/virtualmachines`);
    await isLoaded();
    await wizard.openWizard();

    // Basic Settings for VM
    await wizard.fillName(vmName);
    await wizard.fillDescription(testName);
    await wizard.selectProvisionSource(provisionSource);
    await wizard.selectFlavor(basicVmConfig.flavor);
    await wizard.selectOperatingSystem(basicVmConfig.operatingSystem);
    await wizard.selectWorkloadProfile(basicVmConfig.workloadProfile);
    await wizard.useCloudInit(cloudInitCustomScriptConfig);
    await wizard.next();

    // Networking
    await wizard.next();
    // Storage
    await wizard.next();
    // Create VM
    await wizard.next();

    leakedResources.add(JSON.stringify({name: vmName, namespace: testName, kind: 'vm'}));

    // Expose VM services
    execSync(`oc project ${testName}`);
    const srvList = new Set<string>();
    srvList.add(JSON.stringify({name: vmName, kind: 'vm', port: '22', targetPort: 20022, exposeName: `${vmName}-service-ssh`, type: 'NodePort'}));
    srvList.add(JSON.stringify({name: vmName, kind: 'vm', port: '25', targetPort: 20025, exposeName: `${vmName}-service-smtp`, type: 'NodePort'}));
    exposeService(srvList);
  });

  afterAll(async() => {
    removeLeakedResources(leakedResources);
  });

  beforeEach(async() => {
    await vm.navigateToTab(vmView.overviewTab);
    await isLoaded();
  });

  it('Check VM details in overview when vm is off', async() => {

    // Non empty fields when vm is off
    expect(vmView.detailViewName.getText()).toEqual(vmName);
    expect(vmView.detailViewDescription.getText()).toEqual(testName);
    expect(vmView.statusIcon(vmView.statusIcons.off).isPresent()).toBeTruthy();
    expect(vmView.detailViewOS.getText()).toEqual(basicVmConfig.operatingSystem);
    expect(vmView.detailViewWLP.getText()).toEqual(basicVmConfig.workloadProfile);
    expect(vmView.detailViewTemplate.getText()).toEqual('openshift/rhel7-generic-small');
    expect(vmView.detailViewNS.getText()).toEqual(testName);
    expect(vmView.bootOrder.getText()).toEqual(['rootdisk', 'nic0', 'cloudinitdisk']);
    expect(vmView.detailViewFlavor.getText()).toEqual(basicVmConfig.flavor);
    expect(vmView.detailViewFlavorDes.getText()).toEqual('1 CPU, 2G Memory');

    // Empty fields when vm is off
    expect(vmView.detailViewIP.getText()).toEqual('---');
    expect(vmView.detailViewPod.getText()).toEqual('---');
    expect(vmView.detailViewFQDN.getText()).toEqual('---');
    expect(vmView.detailViewNode.getText()).toEqual('---');

    // Edit button is enabled when VM is off
    expect(vmView.detailViewEditBtn.isEnabled()).toBe(true);
  });

  it('Check VM details in overview when vm is running', async() => {
    await vm.action('Start');
    expect(vmView.statusIcon(vmView.statusIcons.running).isPresent()).toBeTruthy();

    // Empty fields turn into non-empty
    expect(vmView.detailViewIP.getText()).toContain('10');
    // Known issue for FQDN: https://bugzilla.redhat.com/show_bug.cgi?id=1688124
    expect(vmView.detailViewFQDN.getText()).toEqual(vmName);
    expect(vmView.detailViewPod.$('a').getText()).toContain('virt-launcher');
    expect(vmView.detailViewNode.$('a').getText()).not.toEqual('---');

    // Edit button is disabled when VM is running
    expect(vmView.detailViewEditBtn.isEnabled()).toBe(false);
  });

  it('Edit VM flavor', async() => {
    const newVMDescription = 'edited vm description';
    await vm.action('Stop');
    await isLoaded();

    // Cancel edit
    await vmView.detailViewEditBtn.click();
    await fillInput(vmView.detailViewDesTextarea, newVMDescription);
    await vm.selectFlavor('Custom');
    await fillInput(vmView.detailViewFlavorCPU, '2');
    await fillInput(vmView.detailViewFlavorMemory, '4');
    await vmView.detailViewCancelBtn.click();
    expect(vmView.detailViewDescription.getText()).toEqual(testName);
    expect(vmView.detailViewFlavorDes.getText()).toEqual('1 CPU, 2G Memory');

    // Save edit
    await vmView.detailViewEditBtn.click();
    await fillInput(vmView.detailViewDesTextarea, newVMDescription);
    await vm.selectFlavor('Custom');
    await fillInput(vmView.detailViewFlavorCPU, '2');
    await fillInput(vmView.detailViewFlavorMemory, '4');
    await vmView.detailViewSaveBtn.click();
    await isLoaded();
    expect(vmView.detailViewDescription.getText()).toEqual(newVMDescription);
    expect(vmView.detailViewFlavorDes.getText()).toEqual('2 CPU, 4G Memory');
  });

  it('Expose some VM services', async() => {
    expect($(`[href="/k8s/ns/${testName}/services/${vmName}-service-ssh"]`).getText()).toEqual(`${vmName}-service-ssh`);
    expect($(`[href="/k8s/ns/${testName}/services/${vmName}-service-smtp"]`).getText()).toEqual(`${vmName}-service-smtp`);

    $(`[href="/k8s/ns/${testName}/services/${vmName}-service-ssh"]`).click();
    expect(browser.getCurrentUrl()).toEqual(`${appHost}/k8s/ns/${testName}/services/${vmName}-service-ssh`);

    await vm.navigateToTab(vmView.overviewTab);
    await isLoaded();

    $(`[href="/k8s/ns/${testName}/services/${vmName}-service-smtp"]`).click();
    expect(browser.getCurrentUrl()).toEqual(`${appHost}/k8s/ns/${testName}/services/${vmName}-service-smtp`);
  });
});
