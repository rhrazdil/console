/* eslint-disable no-await-in-loop, no-console */
import { browser, ExpectedConditions as until } from 'protractor';
import {
  waitForStringNotInElement,
} from '@console/shared/src/test-utils/utils';
import * as vmView from '../../views/virtualMachine.view';
import {
  PAGE_LOAD_TIMEOUT_SECS,
  VM_MIGRATION_TIMEOUT_SECS,
  VMI_ACTION,
  VM_STATUS,
} from '../utils/constants/consts';
import { detailViewAction, listViewAction } from '../../views/vm.actions.view';
import { BaseVM } from './baseModels/baseVM';
import { VirtualMachineModel } from '../../../src/models/index';
import { VMBuilderData } from '../types/vm';

export class VirtualMachineInstance extends BaseVM {
  constructor(data: VMBuilderData) {
    super(data, VirtualMachineModel);
  }

  async action(action: VMI_ACTION, waitForAction?: boolean, timeout?: number) {
    await this.navigateToDetails();
    const confirmAction = true;
    await detailViewAction(action, confirmAction);
    if (waitForAction !== false) {
      await this.waitForActionFinished(action, timeout);
    }
  }

  async listViewAction(action: VMI_ACTION, waitForAction?: boolean, timeout?: number) {
    await this.navigateToListView();
    const confirmAction = true;
    await listViewAction(this.name)(action, confirmAction);
    if (waitForAction !== false) {
      await this.waitForActionFinished(action, timeout);
    }
  }

  async waitForMigrationComplete(fromNode: string, timeout: number) {
    await this.waitForStatus(VM_STATUS.Running, VM_MIGRATION_TIMEOUT_SECS);
    await browser.wait(
      waitForStringNotInElement(vmView.vmDetailNode(this.namespace, this.name), fromNode),
      timeout,
    );
  }

  async getConsoleVmIpAddress(): Promise<string> {
    await browser.wait(until.presenceOf(vmView.rdpIpAddress), PAGE_LOAD_TIMEOUT_SECS);
    return vmView.rdpIpAddress.getText();
  }

  async getConsoleRdpPort(): Promise<string> {
    await browser.wait(until.presenceOf(vmView.rdpPort), PAGE_LOAD_TIMEOUT_SECS);
    return vmView.rdpPort.getText();
  }

}
