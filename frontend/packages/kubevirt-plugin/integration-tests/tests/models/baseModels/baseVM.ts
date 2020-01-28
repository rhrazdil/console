import { browser, ExpectedConditions as until } from 'protractor';
import { isLoaded, resourceTitle } from '@console/internal-integration-tests/views/crud.view';
import * as vmView from '../../../views/virtualMachine.view';
import { kubevirtResource } from './kubevirtResource';
import { VMBuilderData } from '../../types/vm';
import { nameInput as cloneDialogNameInput } from '../../../views/dialogs/cloneVirtualMachineDialog.view';
import { VM_ACTION, VMI_ACTION, TAB, VM_STATUS, VM_BOOTUP_TIMEOUT_SECS, VM_STOP_TIMEOUT_SECS, PAGE_LOAD_TIMEOUT_SECS, UNEXPECTED_ACTION_ERROR, VM_ACTIONS_TIMEOUT_SECS } from '../../utils/constants/consts';
import { resolveTimeout, selectDropdownOption } from '@console/shared/src/test-utils/utils';
import { K8sKind } from '../../../../../../public/module/k8s/index';


export class BaseVM extends kubevirtResource {
  private data: VMBuilderData;

  constructor(data: VMBuilderData, kind: K8sKind) {
    super({ ...data, kind: kind });
    this.data = data;
  }

  getData() {
    return this.data;
  }

  async getStatus(): Promise<string> {
    return vmView.vmDetailStatus(this.namespace, this.name).getText();
  }

  async getNode(): Promise<string> {
    return vmView.vmDetailNode(this.namespace, this.name).getText();
  }

  async getBootDevices(): Promise<string[]> {
    return vmView.vmDetailBootOrder(this.namespace, this.name).getText();
  }

  async waitForStatus(status: string, timeout?: number) {
    await this.navigateToDetails();
    await browser.wait(
      until.textToBePresentInElement(vmView.vmDetailStatus(this.namespace, this.name), status),
      resolveTimeout(timeout, VM_BOOTUP_TIMEOUT_SECS),
    );
  }

  async selectConsole(type: string) {
    await this.navigateToConsoles();
    await selectDropdownOption(vmView.consoleSelectorDropdownId, type);
    await isLoaded();
  }

  async getConsoleVmIpAddress(): Promise<string> {
    await browser.wait(until.presenceOf(vmView.rdpIpAddress), PAGE_LOAD_TIMEOUT_SECS);
    return vmView.rdpIpAddress.getText();
  }

  async getConsoleRdpPort(): Promise<string> {
    await browser.wait(until.presenceOf(vmView.rdpPort), PAGE_LOAD_TIMEOUT_SECS);
    return vmView.rdpPort.getText();
  }

  async waitForActionFinished(action: VM_ACTION | VMI_ACTION, timeout?: number) {
    await this.navigateToTab(TAB.Details);
    switch (action) {
      case VM_ACTION.Start:
        await this.waitForStatus(
          VM_STATUS.Running,
          resolveTimeout(timeout, VM_BOOTUP_TIMEOUT_SECS),
        );
        break;
      case VM_ACTION.Restart:
        await browser.wait(
          until.or(
            until.textToBePresentInElement(
              vmView.vmDetailStatus(this.namespace, this.name),
              VM_STATUS.Error,
            ),
            until.textToBePresentInElement(
              vmView.vmDetailStatus(this.namespace, this.name),
              VM_STATUS.Starting,
            ),
          ),
          resolveTimeout(timeout, VM_BOOTUP_TIMEOUT_SECS),
        );
        await this.waitForStatus(
          VM_STATUS.Running,
          resolveTimeout(timeout, VM_BOOTUP_TIMEOUT_SECS),
        );
        break;
      case VM_ACTION.Stop:
        await this.waitForStatus(VM_STATUS.Off, resolveTimeout(timeout, VM_STOP_TIMEOUT_SECS));
        break;
      case VM_ACTION.Clone:
        await browser.wait(
          until.visibilityOf(cloneDialogNameInput),
          resolveTimeout(timeout, PAGE_LOAD_TIMEOUT_SECS),
        );
        break;
      case VM_ACTION.Migrate:
        await this.waitForStatus(
          VM_STATUS.Migrating,
          resolveTimeout(timeout, PAGE_LOAD_TIMEOUT_SECS),
        );
        await this.waitForStatus(
          VM_STATUS.Running,
          resolveTimeout(timeout, VM_ACTIONS_TIMEOUT_SECS),
        );
        break;
      case VM_ACTION.Cancel:
        await this.waitForStatus(
          VM_STATUS.Running,
          resolveTimeout(timeout, PAGE_LOAD_TIMEOUT_SECS),
        );
        break;
      case (VM_ACTION.Delete || VMI_ACTION.Delete):
        // wait for redirect
        await browser.wait(
          until.textToBePresentInElement(resourceTitle, this.kind.labelPlural),
          resolveTimeout(timeout, PAGE_LOAD_TIMEOUT_SECS),
        );
        break;
      default:
        throw Error(UNEXPECTED_ACTION_ERROR);
    }
  }
}


