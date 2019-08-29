import { browser, ExpectedConditions as until } from 'protractor';
import { appHost, testName } from '../../protractor.conf';
import { isLoaded, createItemButton, createYAMLLink, saveChangesBtn, clickKebabAction, rowForName } from '../../views/crud.view';
import { click, addLeakableResource, removeLeakableResource, deleteResource, removeLeakedResources } from '../../../packages/console-shared/src/test-utils/utils';
import { isLoaded as yamlIsLoaded } from '../../views/yaml.view';
import { titleName, reasonInput, confirmAction } from '../../views/rhhi/demo.rhhi.view';
import { fillInput } from '../../../packages/kubevirt-plugin/integration-tests/tests/utils/utils';

describe('RHHI Demo Create VM via YAML page.', () => {
  const leakedResources = new Set<string>();

  beforeAll(async() => {
    await browser.get(`${appHost}/k8s/ns/${testName}/virtualmachines`);
    await isLoaded();

    await click(createItemButton);
    await click(createYAMLLink);
    await yamlIsLoaded();
  });

  afterEach(() => {
    removeLeakedResources(leakedResources);
  });

  it('Create a VM via YAMl', async()=> {
    const testVM = {metadata: {name: 'example', namespace: testName}, kind: 'virtualmachine'};
    addLeakableResource(leakedResources, testVM);
    await click(saveChangesBtn);
    await isLoaded();

    expect(titleName.getText()).toEqual('example');
    deleteResource(testVM);
    removeLeakableResource(leakedResources, testVM);
  });
});

describe('RHHI BMH Maintenance.', () => {
  beforeAll(async() => {
    await browser.get(`${appHost}/k8s/ns/openshift-machine-api/baremetalhosts`);
    await isLoaded();
  });

  it('Start stop maintenance', async() => {
    await clickKebabAction('openshift-master-2', 'Start maintenance');
    await fillInput(reasonInput, `${testName}`);
    await click(confirmAction);

    await browser.wait(until.textToBePresentInElement(rowForName('openshift-master-2'), 'Under maintenance'), 10000);

    await browser.sleep(5000); // simulate maintenance

    await clickKebabAction('openshift-master-2', 'Stop maintenance');
    await click(confirmAction);
    await browser.wait(until.textToBePresentInElement(rowForName('openshift-master-2'), 'Externally provisioned'), 15000);
  });
});
