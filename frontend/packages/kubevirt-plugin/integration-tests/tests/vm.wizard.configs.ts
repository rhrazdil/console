import { OrderedMap } from 'immutable';
import { testName } from '@console/internal-integration-tests/protractor.conf';
import {
  basicVMConfig,
  multusNetworkInterface,
  rootDisk,
  hddDisk,
  dataVolumeManifest,
} from './utils/mocks/mocks';
import { Disk, ProvisionConfig, BaseVMConfig } from './utils/types';
import {
  KUBEVIRT_STORAGE_CLASS_DEFAULTS,
  KUBEVIRT_PROJECT_NAME,
  DISK_INTERFACE,
  DISK_SOURCE,
} from './utils/constants/consts';
import { resolveStorageDataAttribute, getResourceObject } from './utils/utils';
import { ProvisionSourceName } from './utils/constants/wizard';

export const vmConfig = (
  name: string,
  namespace: string,
  provisionConfig: ProvisionConfig,
  baseConfig: BaseVMConfig = basicVMConfig,
  startOnCreation: boolean = true,
) => {
  const commonSettings = {
    startOnCreation,
    cloudInit: {
      useCloudInit: false,
    },
    namespace,
    description: `Default description ${namespace}`,
    flavorConfig: baseConfig.flavorConfig,
    operatingSystem: baseConfig.operatingSystem,
    workloadProfile: baseConfig.workloadProfile,
  };

  return {
    ...commonSettings,
    name: `${name}-${namespace}`,
    provisionSource: provisionConfig.provision,
    storageResources: provisionConfig.storageResources,
    CDRoms: provisionConfig.CDRoms,
    networkResources: provisionConfig.networkResources,
  };
};

export const kubevirtStorage = getResourceObject(
  KUBEVIRT_STORAGE_CLASS_DEFAULTS,
  KUBEVIRT_PROJECT_NAME,
  'configMap',
);

export const getTestDataVolume = () =>
  dataVolumeManifest({
    name: `toclone-${testName}`,
    namespace: testName,
    sourceURL: basicVMConfig.sourceURL,
    accessMode: resolveStorageDataAttribute(kubevirtStorage, 'accessMode'),
    volumeMode: resolveStorageDataAttribute(kubevirtStorage, 'volumeMode'),
  });

const getDiskToCloneFrom = (): Disk => {
  const testDV = getTestDataVolume();
  return {
    name: testDV.metadata.name,
    size: testDV.spec.pvc.resources.requests.storage.slice(0, -2),
    interface: DISK_INTERFACE.VirtIO,
    storageClass: testDV.spec.pvc.storageClassName,
    sourceConfig: {
      PVCName: testDV.metadata.name,
      PVCNamespace: testName,
    },
    source: DISK_SOURCE.AttachClonedDisk,
  };
};

export const getProvisionConfigs = () =>
  OrderedMap<ProvisionSourceName, ProvisionConfig>()
    .set(ProvisionSourceName.URL, {
      provision: {
        method: ProvisionSourceName.URL,
        source: basicVMConfig.sourceURL,
      },
      networkResources: [multusNetworkInterface],
      storageResources: [rootDisk],
    })
    .set(ProvisionSourceName.CONTAINER, {
      provision: {
        method: ProvisionSourceName.CONTAINER,
        source: basicVMConfig.sourceContainer,
      },
      networkResources: [multusNetworkInterface],
      storageResources: [hddDisk],
    })
    .set(ProvisionSourceName.PXE, {
      provision: {
        method: ProvisionSourceName.PXE,
      },
      networkResources: [multusNetworkInterface],
      storageResources: [rootDisk],
    })
    .set(ProvisionSourceName.DISK, {
      provision: {
        method: ProvisionSourceName.DISK,
      },
      networkResources: [multusNetworkInterface],
      storageResources: [getDiskToCloneFrom()],
    });
