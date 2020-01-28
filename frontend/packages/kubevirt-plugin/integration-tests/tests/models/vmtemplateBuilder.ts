import { BaseVMBuilder } from './baseModels/baseVMBuilder';
import { VMTemplateBuilderData } from '../types/vm';
import { TemplateModel } from '../../../../../public/models/index';
import { VirtualMachineTemplate } from './virtualMachineTemplate';


export class VMTemplateBuilder extends BaseVMBuilder<VMTemplateBuilderData> {
  constructor(builder?: VMTemplateBuilder) {
    super(TemplateModel, builder);
  }

  build() {
    return {
      vm: new VirtualMachineTemplate(this.getData()),
      data: this.getData(),
    }
  }
}
