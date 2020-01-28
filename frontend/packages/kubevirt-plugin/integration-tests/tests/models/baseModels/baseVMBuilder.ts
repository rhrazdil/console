import * as _ from 'lodash';
import { OperatingSystem, WorkloadProfile, OSIDLookup } from '../../utils/constants/wizard';
import { FlavorConfig, ProvisionSource, Disk, Network } from '../../utils/types';
import { TestNetwork, TestDisk, BaseVMBuilderData } from '../../types/vm';
import { K8sKind } from '@console/internal/module/k8s';
import { getRandStr } from '../../utils/utils';


export abstract class BaseVMBuilder<T extends BaseVMBuilderData> {
  protected kind: K8sKind;
  protected data: T;

  constructor(kind: K8sKind, builder?: BaseVMBuilder<T>) {
    this.kind = kind;
    this.data = builder ? builder.getData() : { networks: [], disks: [], storageClassAttributes: {} } as any;
  }

  public setName(name: string) {
    this.data.name = name;
    return this;
  }

  public generateName(id?: string) {
    const finalId = id || getRandStr(5);
    const osId = OSIDLookup[this.data.os];
    this.data.name = [this.kind.abbr.toLowerCase(), this.data.namespace, finalId, this.data.flavor?.flavor, osId]
      .filter(a => a)
      .map((a) => a.toLowerCase().replace(/[^-a-zA-Z0-9]/g, ''))
      .join('-');
    return this;
  }

  public setDescription(description: string) {
    this.data.description = description;
    return this;
  }

  public setNamespace(namespace: string) {
    this.data.namespace = namespace;
    return this;
  }

  public setTemplate(template: string) {
    this.data.template = template;
    return this;
  }

  public setFlavor(flavor: FlavorConfig) {
    this.data.flavor = flavor;
    return this;
  }

  public setWorkload(workload: WorkloadProfile) {
    this.data.workload = workload;
    return this;
  }

  public setOS(os: OperatingSystem) {
    this.data.os = os;
    return this;
  }

  public setProvisionSource(provisionSource: ProvisionSource) {
    this.data.provisionSource = provisionSource;
    return this;
  }

  public setNetworks(networks: Network[]) {
    this.data.networks = networks;
    return this;
  }

  public setDisks(disks: Disk[]) {
    this.data.disks = disks;
    return this;
  }

  public setStorageAttributes(storageAttributes: { [k: string]: string }) {
    this.data.storageClassAttributes = storageAttributes;
    return this;
  }

  public setBuilder(builder: BaseVMBuilder<T>) {
    Object.keys(builder.data).filter((key) => builder.data[key] !== undefined).forEach((key) => {
      this.data[key] = builder.data[key];
    });
    return this;
  }

  public appendBuilder(builder: BaseVMBuilder<T>) {
    const customAppendKeys = new Set(['networks', 'disks', 'storageClassAttributes'])
    Object.keys(builder.data).filter((key) => !customAppendKeys.has(key) && builder.data[key] !== undefined).forEach((key) => {
      this.data[key] = builder.data[key];
    });
    if (builder.data.networks) {
      this.data.networks.push(...builder.data.networks);
    }

    if (builder.data.disks) {
      this.data.disks.push(...builder.data.disks);
    }

    if (builder.data.storageClassAttributes) {
      if (!this.data.storageClassAttributes) {
        this.data.storageClassAttributes = {};
      }
      _.mergeWith(this.data.storageClassAttributes, builder.data.storageClassAttributes, (objValue, srcValue) => {
        if (srcValue === undefined) {
          return objValue;
        }
        return undefined;
      });
    }
  }

  public setData(data: T) {
    this.data = data;
    return this;
  }

  protected getData(): T {
    return _.cloneDeep(this.data);
  }

}






