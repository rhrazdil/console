/* eslint-disable no-await-in-loop */
import { browser, ExpectedConditions as until } from 'protractor';
import { click, waitForCount } from '@console/shared/src/test-utils/utils';
import { resourceRows } from '@console/internal-integration-tests/views/crud.view';
import { TAB, diskTabCol, networkTabCol, PAGE_LOAD_TIMEOUT_SECS } from '../../utils/constants/consts';
import { Disk, Network } from '../../utils/types';
import * as kubevirtDetailView from '../../../views/kubevirtDetailView.view';
import { confirmAction } from '../../../views/vm.actions.view';
import {
  vmDetailFlavorEditButton,
  vmDetailCdEditButton,
  vmDetailBootOrderEditButton,
  vmDetailDedicatedResourcesEditButton,
} from '../../../views/virtualMachine.view';
import * as editCD from '../../../views/editCDView';
import * as editBootOrder from '../../../views/editBootOrderView';
import * as editDedicatedResourcesView from '../../../views/editDedicatedResourcesView';
import { NetworkInterfaceDialog } from '../../dialogs/networkInterfaceDialog';
import { DiskDialog } from '../../dialogs/diskDialog';
import { k8sUIResource } from './k8sUIResource';
import * as editFlavor from '../../../views/editFlavorView';

export class kubevirtResource extends k8sUIResource {
  async getAttachedDisks(): Promise<Disk[]> {
    await this.navigateToTab(TAB.Disks);
    const rows = await kubevirtDetailView.tableRows();
    return rows.map((line) => {
      const cols = line.split(/\t/);
      return {
        name: cols[diskTabCol.name],
        size: cols[diskTabCol.size].slice(0, -4),
        interface: cols[diskTabCol.interface],
        storageClass: cols[diskTabCol.storageClass],
      };
    });
  }

  async getAttachedNICs(): Promise<Network[]> {
    await this.navigateToTab(TAB.NetworkInterfaces);
    const rows = await kubevirtDetailView.tableRows();
    return rows.map((line) => {
      const cols = line.split(/\t/);
      return {
        name: cols[networkTabCol.name],
        model: cols[networkTabCol.model],
        mac: cols[networkTabCol.mac],
        network: cols[networkTabCol.network],
        type: cols[networkTabCol.type],
      };
    });
  }

  async addDisk(disk: Disk) {
    await this.navigateToTab(TAB.Disks);
    const count = await resourceRows.count();
    await click(kubevirtDetailView.createDiskButton);
    const dialog = new DiskDialog();
    await dialog.create(disk);
    await browser.wait(until.and(waitForCount(resourceRows, count + 1)), PAGE_LOAD_TIMEOUT_SECS);
  }

  async removeDisk(name: string) {
    await this.navigateToTab(TAB.Disks);
    const count = await resourceRows.count();
    await kubevirtDetailView.selectKebabOption(name, 'Delete');
    await confirmAction();
    await browser.wait(until.and(waitForCount(resourceRows, count - 1)), PAGE_LOAD_TIMEOUT_SECS);
  }

  async addNIC(nic: Network) {
    await this.navigateToTab(TAB.NetworkInterfaces);
    const count = await resourceRows.count();
    await click(kubevirtDetailView.createNICButton);
    const dialog = new NetworkInterfaceDialog();
    await dialog.create(nic);
    await browser.wait(until.and(waitForCount(resourceRows, count + 1)), PAGE_LOAD_TIMEOUT_SECS);
  }

  async removeNIC(name: string) {
    await this.navigateToTab(TAB.NetworkInterfaces);
    const count = await resourceRows.count();
    await kubevirtDetailView.selectKebabOption(name, 'Delete');
    await confirmAction();
    await browser.wait(until.and(waitForCount(resourceRows, count - 1)), PAGE_LOAD_TIMEOUT_SECS);
  }

  async modalEditFlavor() {
    await click(vmDetailFlavorEditButton(this.namespace, this.name));
    await browser.wait(until.presenceOf(editFlavor.modalTitle()));
  }

  async modalEditCDRoms() {
    await click(vmDetailCdEditButton(this.namespace, this.name));
    await browser.wait(until.presenceOf(editCD.modalTitle));
  }

  async modalEditBootOrder() {
    await click(vmDetailBootOrderEditButton(this.namespace, this.name));
    await browser.wait(until.presenceOf(editBootOrder.bootOrderDialog));
  }

  async modalEditDedicatedResources() {
    await click(vmDetailDedicatedResourcesEditButton(this.namespace, this.name));
    await browser.wait(until.presenceOf(editDedicatedResourcesView.guaranteedPolicyCheckbox));
  }
}
