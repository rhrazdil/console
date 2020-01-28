import { testName } from '@console/internal-integration-tests/protractor.conf';
import { createResource, deleteResource } from '@console/shared/src/test-utils/utils';
import { VirtualMachineInstanceModel } from '../../src/models';
import {
  vmDetailsName,
  vmDetailsNamespace,
  vmDetailsNode,
  vmDetailsIPAddress,
  vmStatus,
  vmInventoryNICs,
  vmInventoryDisks,
} from '../views/dashboard.view';
import { getVMIManifest } from './utils/mocks/mocks';
import { VirtualMachineInstance } from './models/virtualMachineInstance';
import { VM_STATUS, NOT_AVAILABLE } from './utils/constants/consts';

const waitForVM = async (
  manifest: any,
  status: VM_STATUS,
) => {
  const vm = new VirtualMachineInstance(manifest.metadata);
  createResource(manifest);
  await vm.waitForStatus(status);
  return vm;
};

describe('Test VMI dashboard', () => {
  const testVM = getVMIManifest('Container', testName);
  let vm: VirtualMachineInstance;

  afterAll(() => {
    deleteResource(testVM);
  });

  beforeAll(async () => {
    vm = await waitForVM(testVM, VM_STATUS.Running);
    await vm.navigateToOverview();
  });

  it('Inventory card', async () => {
    expect(vmInventoryNICs.getText()).toEqual('1 NIC');
    expect(vmInventoryNICs.$('a').getAttribute('href')).toMatch(
      new RegExp(`.*/k8s/ns/${vm.namespace}/${VirtualMachineInstanceModel.plural}/${vm.name}/nics`),
    );
    expect(vmInventoryDisks.getText()).toEqual('1 Disk');
    expect(vmInventoryDisks.$('a').getAttribute('href')).toMatch(
      new RegExp(
        `.*/k8s/ns/${vm.namespace}/${VirtualMachineInstanceModel.plural}/${vm.name}/disks`,
      ),
    );
  });

  it('Status card', async () => {
    expect(vmStatus.getText()).toEqual(VM_STATUS.Running);
  });

  it('Details card', async () => {
    expect(vmDetailsName.getText()).toEqual(vm.name);
    expect(vmDetailsNamespace.getText()).toEqual(vm.namespace);
    expect(vmDetailsNode.getText()).not.toEqual(NOT_AVAILABLE);
    expect(vmDetailsIPAddress.getText()).not.toEqual(NOT_AVAILABLE);
  });
});
