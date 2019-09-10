import { Wizard } from './models/wizard';
import { appHost, testName } from '../../../../integration-tests/protractor.conf';
import { browser } from 'protractor';
import { isLoaded } from '../../../../integration-tests/views/crud.view';


describe('Create VMWare Instance connection', () => {

  beforeAll(async () => {
    await browser.get(`${appHost}/k8s/ns/${testName}/virtualmachines`);
    await isLoaded();
  });


  it('Create VCenter Instance', async () => {
    const wizard = new Wizard();

    await wizard.openWizard();
    await wizard.fillName('aaaa');
    
    await wizard.selectProvisionSource({
      method: 'Import',
    });
    await wizard.selectProvider('VMware');
    await wizard.selectVcenterInstance('Connect to New Instance');
    await wizard.fillVcenterHostname('10.8.58.136');
    await wizard.fillVcenterUsername('administrator@vsphere.local');
    await wizard.fillVcenterPassword('Dog8code!');

    await browser.sleep(10000);
    await wizard.close();
  });

});
