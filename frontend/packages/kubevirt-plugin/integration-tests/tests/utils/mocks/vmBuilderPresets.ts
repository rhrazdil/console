import { deepFreeze, getRandomMacAddress } from '../utils';
import { VMBuilder } from '../../models/vmBuilder';
import * as Combinatorics from 'js-combinatorics';
import { Flavor, WorkloadProfile, OperatingSystem, ProvisionSourceName } from '../constants/wizard';
import { VMBuilderDataGenerationConfig, VMBuilderData, TestDisk, TestNetwork } from '../../types/vm';
import { testName } from '@console/internal-integration-tests/protractor.conf';
import { provisionSources, rootDisk, multusNetworkInterface } from './mocks';
import { NIC_MODEL } from '../constants/consts';
import { VirtualMachine } from '../../models/virtualMachine';

enum VMPresets {
  URL = 'URL',
  CONTAINER = 'CONTAINER',
  PXE = 'PXE',
  DISK = 'DISK',
}


export const computedVMBuilders = deepFreeze([{
  baseBuilder: new VMBuilder(), // TODO ALresady preset 
  config: {
    flavor: [{ flavor: Flavor.TINY }, { flavor: Flavor.SMALL }],
    workload: [WorkloadProfile.DESKTOP, WorkloadProfile.SERVER],
    os: [OperatingSystem.RHEL7_6, OperatingSystem.WINDOWS_10]
  } as VMBuilderDataGenerationConfig
}].reduce((acc, { baseBuilder, config }, idx) => {
  const configKeys = Object.keys(config);
  const configValueArrays = configKeys.map((key) => config[key]);
  // TODO (dont merge without moving to separate function)
  let newComputedBuilders: { [k: string]: VMBuilder } = {};
  Combinatorics.cartesianProduct(...configValueArrays).toArray().forEach((additionalBuilderValues, additionalBuilderId) => {
    const additionalBuilderData = additionalBuilderValues.reduce((acc, value, keyIdx) => {
      acc[configKeys[keyIdx]] = value;
      return acc;
    }, {} as VMBuilderData)
    const additionalBuilder = new VMBuilder().setData(additionalBuilderData);
    newComputedBuilders[`config ${idx}-${additionalBuilderId}`] = new VMBuilder(baseBuilder).setBuilder(additionalBuilder).generateName(`${additionalBuilderId}`);
  });

  // newComputedBuilders.forEach(builder => {
  //   acc[`config ${idx}`] = builder;
  // })
  return newComputedBuilders;
}, {}));

const rootTestDisk: TestDisk = {
  disk: {
    name: 'rootdisk',
  },
  volume: {
    name: 'rootdisk',
  }
}

const network: TestNetwork = {
  network: {
    name: `multus-${testName}`,
    multus: {
      networkName: `multus-${testName}???`,
    },
  },
  nic: {
    name: `nic1-${testName.slice(-5)}`,
    model: NIC_MODEL.VirtIO,
    macAddress: getRandomMacAddress(),
    bridge: {},

  }
}

const baseVM = new VMBuilder()
  .setNamespace(testName)
  .setDescription('Default description')
  .setFlavor({ flavor: Flavor.TINY })
  .setOS(OperatingSystem.RHEL7_6)
  .setWorkload(WorkloadProfile.DESKTOP)
  .setStartOnCreation(false);


const vmPresets: { [k: string]: VirtualMachine } = {
  [VMPresets.CONTAINER]: new VMBuilder(baseVM)
    .setProvisionSource(provisionSources[ProvisionSourceName.CONTAINER])
    .setDisks([])
    .setNetworks([multusNetworkInterface])
    .build(),
  [VMPresets.URL]: new VMBuilder(baseVM)
    .setProvisionSource(provisionSources[ProvisionSourceName.URL])
    .setDisks([rootDisk])
    .setNetworks([multusNetworkInterface])
    .build(),
  [VMPresets.PXE]: new VMBuilder(baseVM)
    .setProvisionSource(provisionSources[ProvisionSourceName.PXE])
    .setDisks([rootDisk])
    .setNetworks([multusNetworkInterface])
    .build(),

}

