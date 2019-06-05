/* eslint-disable no-undef, max-nested-callbacks */
import { OrderedMap } from 'immutable';

// eslint-disable-next-line no-unused-vars
import { networkResource, storageResource, provisionOption } from './utils/types';
import { deleteResource, removeLeakedResources, createResource, withResource } from './utils/utils';
import { VM_BOOTUP_TIMEOUT } from './utils/consts';
import { testName } from '../../protractor.conf';
import { basicVmConfig, rootDisk, networkInterface, multusNad, hddDisk } from './utils/mocks';
import { VirtualMachine } from './models/virtualMachine';

describe('Kubevirt create VM using wizard', () => {
  const leakedResources = new Set<string>();
  const commonSettings = {
    startOnCreation: true,
    cloudInit: {
      useCloudInit: false,
    },
    namespace: testName,
    description: `Default description ${testName}`,
    flavor: basicVmConfig.flavor,
    operatingSystem: basicVmConfig.operatingSystem,
    workloadProfile: basicVmConfig.workloadProfile,
  };
  const provisionConfigs = OrderedMap<string, {provision: provisionOption, networkResources: networkResource[], storageResources: storageResource[]}>()
    .set('URL', {
      provision: {
        method: 'URL',
        source: basicVmConfig.sourceURL,
      },
      networkResources: [networkInterface],
      storageResources: [rootDisk],
    })
    .set('Container', {
      provision: {
        method: 'Container',
        source: basicVmConfig.sourceContainer,
      },
      networkResources: [networkInterface],
      storageResources: [hddDisk],
    })
    .set('PXE', {
      provision: {
        method: 'PXE',
      },
      networkResources: [networkInterface],
      storageResources: [rootDisk],
    });

  beforeAll(async() => {
    createResource(multusNad);
  });

  afterAll(async() => {
    deleteResource(multusNad);
    removeLeakedResources(leakedResources);
  });

  provisionConfigs.forEach((provisionConfig, configName) => {
    it(`Create VM using ${configName}.`, async() => {
      const vmConfig = {
        ...commonSettings,
        name: `vm-${provisionConfig.provision.method.toLowerCase()}-${testName}`,
        provisionSource: provisionConfig.provision,
        storageResources: provisionConfig.storageResources,
        networkResources: provisionConfig.networkResources,
      };
      const vm = new VirtualMachine(vmConfig);
      await withResource(leakedResources, vm.asResource(), async() => {
        await vm.create(vmConfig);
        deleteResource(vm.asResource());
      });
    }, VM_BOOTUP_TIMEOUT);
  });
});
