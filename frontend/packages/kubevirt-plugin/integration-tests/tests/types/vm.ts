import { FlavorConfig, ProvisionSource, Network, Disk } from '../utils/types';

import { V1Disk } from '../../../src/types/vm/disk/V1Disk';
import { V1Volume } from '../../../src/types/vm/disk/V1Volume';
import { V1alpha1DataVolume } from '../../../src/types/vm/disk/V1alpha1DataVolume';
import { V1PersistentVolumeClaim } from '../../../src/types/vm/disk/V1PersistentVolumeClaim';
import { V1Network, V1NetworkInterface } from '../../../src/types/vm/index';
import { OperatingSystem, WorkloadProfile } from '../utils/constants/wizard';


export type TestNetwork = {
  network: V1Network,
  nic: V1NetworkInterface,
}


export type TestDisk = {
  disk: V1Disk,
  volume: V1Volume,
  dataVolume?: V1alpha1DataVolume,
  pvc?: V1PersistentVolumeClaim,
}

export type BaseVMBuilderData = {
  name?: string;
  description?: string;
  namespace?: string;
  template?: string;
  flavor?: FlavorConfig;
  workload?: WorkloadProfile;
  os?: OperatingSystem;
  provisionSource?: ProvisionSource;
  networks?: Network[];
  disks?: Disk[];
  storageClassAttributes?: { [k: string]: string };
}

export type VMBuilderData = BaseVMBuilderData & {
  startOnCreation?: boolean;
  template?: string;
}

export type VMTemplateBuilderData = BaseVMBuilderData;

export type VMBuilderDataGenerationConfig = {
  flavor?: FlavorConfig[];
  workload?: WorkloadProfile[];
  os?: OperatingSystem[];
}
