/* eslint-disable no-undef */
import { browser } from 'protractor';
import { execSync } from 'child_process';
import { OrderedMap } from 'immutable';

import { appHost, testName } from '../../protractor.conf';
import { isLoaded } from '../../views/crud.view';
import { getVmManifest, basicVmConfig } from './mocks';
import * as vmView from '../../views/kubevirt/virtualMachine.view';
import { fillInput, execCommandFromCli, exposeService, selectDropdownOption } from './utils';
import { VirtualMachine } from './models/virtualMachine';

describe('Test vm overview page', () => {
  const vmName = `vm-${testName}`;
  const vm = new VirtualMachine(vmName, testName);
  const cloudInit = `#cloud-config\nuser: cloud-user\npassword: atomic\nchpasswd: {expire: False}\nhostname: vm-${testName}.example.com`;
  const testVm = getVmManifest('Container', testName, vmName, cloudInit);

  beforeAll(async() => {
    execCommandFromCli(`echo '${JSON.stringify(testVm)}' | kubectl create -f -`);
  });

  afterAll(async() => {
    execCommandFromCli(`echo '${JSON.stringify(testVm)}' | kubectl delete -f -`);
  });

  beforeEach(async() => {
    await vm.navigateToTab(vmView.overviewTab);
    await isLoaded();
  });

  it('Check vm details in overview when vm is off', async() => {

    // Non empty fields when vm is off
    expect(vmView.vmDetailNameID(testName, vmName).getText()).toEqual(vmName);
    expect(vmView.vmDetailDesID(testName, vmName).getText()).toEqual(testName);
    expect(vmView.statusIcon(vmView.statusIcons.off).isPresent()).toBeTruthy();
    expect(vmView.vmDetailOSID(testName, vmName).getText()).toEqual(basicVmConfig.operatingSystem);
    expect(vmView.vmDetailWorkloadProfileID(testName, vmName).getText()).toEqual(basicVmConfig.workloadProfile);
    expect(vmView.vmDetailTemplateID(testName, vmName).getText()).toEqual('openshift/rhel7-generic-small');
    expect(vmView.vmDetailNSID(testName, vmName).$('a').getText()).toEqual(testName);
    expect(vmView.bootOrder(testName, vmName).getText()).toEqual(['rootdisk', 'nic0', 'cloudinitdisk']);
    expect(vmView.vmDetailFlavorID(testName, vmName).getText()).toEqual(basicVmConfig.flavor);
    expect(vmView.vmDetailFlavorDesID(testName, vmName).getText()).toEqual('1 CPU, 2G Memory');

    // Empty fields when vm is off
    expect(vmView.vmDetailIPID(testName, vmName).getText()).toEqual('---');
    expect(vmView.vmDetailPodID(testName, vmName).getText()).toEqual('---');
    expect(vmView.vmDetailHostnameID(testName, vmName).getText()).toEqual('---');
    expect(vmView.vmDetailNodeID(testName, vmName).getText()).toEqual('---');

    // Edit button is enabled when VM is off
    expect(vmView.detailViewEditBtn.isEnabled()).toBe(true);
  });

  it('Check vm details in overview when vm is running', async() => {
    await vm.action('Start');
    expect(vmView.statusIcon(vmView.statusIcons.running).isPresent()).toBeTruthy();

    // Empty fields turn into non-empty
    expect(vmView.vmDetailIPID(testName, vmName).getText()).toContain('10');
    // Known issue for hostname: https://bugzilla.redhat.com/show_bug.cgi?id=1688124
    expect(vmView.vmDetailHostnameID(testName, vmName).getText()).toEqual(vmName);
    expect(vmView.vmDetailPodID(testName, vmName).$('a').getText()).toContain('virt-launcher');
    expect(vmView.vmDetailNodeID(testName, vmName).$('a').getText()).not.toEqual('---');

    // Edit button is disabled when VM is running
    expect(vmView.detailViewEditBtn.isEnabled()).toBe(false);
  });

  it('Edit vm flavor', async() => {
    const newVMDescription = 'edited vm description';
    await vm.action('Stop');
    await isLoaded();

    // Cancel edit
    await vmView.detailViewEditBtn.click();
    await fillInput(vmView.vmDetailDesTextareaID(testName, vmName), newVMDescription);
    await selectDropdownOption(vmView.vmDetailFlavorDropdown(testName, vmName), 'Custom');
    await fillInput(vmView.vmDetailFlavorCPUID(testName, vmName), '2');
    await fillInput(vmView.vmDetailFlavorMemoryID(testName, vmName), '4');
    await vmView.detailViewCancelBtn.click();
    expect(vmView.vmDetailDesID(testName, vmName).getText()).toEqual(testName);
    expect(vmView.vmDetailFlavorDesID(testName, vmName).getText()).toEqual('1 CPU, 2G Memory');

    // Save edit
    await vmView.detailViewEditBtn.click();
    await fillInput(vmView.vmDetailDesTextareaID(testName, vmName), newVMDescription);
    await selectDropdownOption(vmView.vmDetailFlavorDropdown(testName, vmName), 'Custom');
    await fillInput(vmView.vmDetailFlavorCPUID(testName, vmName), '2');
    await fillInput(vmView.vmDetailFlavorMemoryID(testName, vmName), '4');
    await vmView.detailViewSaveBtn.click();
    await isLoaded();
    expect(vmView.vmDetailDesID(testName, vmName).getText()).toEqual(newVMDescription);
    expect(vmView.vmDetailFlavorDesID(testName, vmName).getText()).toEqual('2 CPU, 4G Memory');
  });

  describe('Check exposed vm services', () => {
    const exposeServices = new Set<string>();

    const sshService = `${vmName}-service-ssh`;
    const smtpService = `${vmName}-service-smtp`;
    const httpService = `${vmName}-service-http`;

    const srvList = OrderedMap<string, {name: string, port: string, targetPort: string}>()
      .set('ssh service', {name: `${sshService}`, port: '22', targetPort: '20022'})
      .set('smtp service', {name: `${smtpService}`, port: '25', targetPort: '20025'})
      .set('http service', {name: `${httpService}`, port: '80', targetPort: '20080'});

    beforeAll(async() => {
      srvList.forEach(srv => {
        exposeServices.add(JSON.stringify({name: vmName, kind: 'vm', port: srv.port, targetPort: srv.targetPort, exposeName: srv.name, type: 'NodePort'}));
      });

      execSync(`oc project ${testName}`);
      exposeService(exposeServices);
    });

    srvList.forEach(srv => {
      it(`Check vm service ${srv.name}`, async() => {
        expect(vmView.vmDetailService(testName, srv.name).getText()).toEqual(srv.name);
        await vmView.vmDetailService(testName, srv.name).click();
        expect(browser.getCurrentUrl()).toEqual(`${appHost}/k8s/ns/${testName}/services/${srv.name}`);

        await browser.get(`${appHost}/k8s/ns/${testName}/virtualmachines/${vmName}`);
        await isLoaded();
      });
    });
  });
});
