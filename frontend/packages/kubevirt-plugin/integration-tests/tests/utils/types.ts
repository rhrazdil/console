import { DISK_SOURCE } from './constants/consts';
import { Flavor, OperatingSystem, WorkloadProfile } from './constants/wizard';

export type ProvisionSource = {
  method: string;
  source?: string;
};

export type Network = {
  name: string;
  model: string;
  mac: string;
  network: string;
  type: string;
};

export type DiskSourceConfig = {
  PVCName?: string;
  PVCNamespace?: string;
  URL?: string;
  container?: string;
};

export type Disk = {
  name?: string;
  size?: string;
  storageClass: string;
  interface: string;
  sourceConfig?: DiskSourceConfig;
  source?: DISK_SOURCE;
};

export type FlavorConfig = {
  flavor: Flavor;
  memory?: string;
  cpu?: string;
};

export type CloudInitConfig = {
  useCloudInit: boolean;
  useCustomScript?: boolean;
  customScript?: string;
  hostname?: string;
  sshKeys?: string[];
};

export type NodePortService = {
  name: string;
  namespace: string;
  kind: string;
  port: string;
  targetPort: string;
  exposeName: string;
  type: string;
};

export type VMConfig = {
  name: string;
  description: string;
  template?: string;
  provisionSource?: ProvisionSource;
  operatingSystem?: string;
  flavorConfig?: FlavorConfig;
  workloadProfile?: string;
  startOnCreation: boolean;
  cloudInit: CloudInitConfig;
  storageResources: Disk[];
  CDRoms?: Disk[];
  networkResources: Network[];
  bootableDevice?: string;
};

export type InstanceConfig = {
  instance?: string;
  hostname?: string;
  username?: string;
  password?: string;
  saveInstance?: boolean;
};

export type VMImportConfig = {
  name: string;
  provider: string;
  instanceConfig: InstanceConfig;
  sourceVMName: string;
  description?: string;
  operatingSystem?: OperatingSystem;
  flavorConfig?: FlavorConfig;
  workloadProfile?: WorkloadProfile;
  storageResources?: Disk[];
  networkResources?: Network[];
  cloudInit?: CloudInitConfig;
};

export type BaseVMConfig = {
  operatingSystem: OperatingSystem;
  flavorConfig: FlavorConfig;
  workloadProfile: WorkloadProfile;
  sourceURL: string;
  sourceContainer: string;
  cloudInitScript: string;
};

export type ProvisionConfig = {
  provision: ProvisionSource;
  networkResources: Network[];
  storageResources: Disk[];
  CDRoms?: Disk[];
};

export type VMTemplateConfig = {
  name: string;
  description: string;
  provisionSource?: ProvisionSource;
  operatingSystem?: string;
  flavorConfig?: FlavorConfig;
  workloadProfile?: string;
  cloudInit?: CloudInitConfig;
  storageResources?: Disk[];
  networkResources?: Network[];
};

