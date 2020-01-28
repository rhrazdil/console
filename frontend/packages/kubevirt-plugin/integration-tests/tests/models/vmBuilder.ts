import { BaseVMBuilder } from './baseModels/baseVMBuilder';
import { VMBuilderData } from '../types/vm';
import { VirtualMachineModel } from '../../../src/models/index';
import { VirtualMachine } from './virtualMachine';

export class VMBuilder extends BaseVMBuilder<VMBuilderData> {
  constructor(builder?: VMBuilder) {
    super(VirtualMachineModel, builder);
  }

  public setStartOnCreation(startOnCreation: boolean) {
    this.data.startOnCreation = startOnCreation;
    return this;
  }

  build() {
    return new VirtualMachine(this.getData());
  }
}

