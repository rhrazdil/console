/* eslint-disable no-await-in-loop */
import { browser, ExpectedConditions as until } from 'protractor';
import { click, waitForCount } from '@console/shared/src/test-utils/utils';
import { isLoaded, resourceRows } from '@console/internal-integration-tests/views/crud.view';
import {
  TAB,
  diskTabCol,
  networkTabCol,
  PAGE_LOAD_TIMEOUT_SECS,
  DISK_SOURCE,
} from '../utils/consts';
import { StorageResource, NetworkResource } from '../utils/types';
import { fillInput, selectOptionByText } from '../utils/utils';
import * as kubevirtDetailView from '../../views/kubevirtDetailView.view';
import { confirmAction } from '../../views/vm.actions.view';
import { vmDetailFlavorEditButton } from '../../views/virtualMachine.view';
import { DetailView } from './detailView';
import * as editFlavor from './editFlavorView';

export class KubevirtDetailView extends DetailView {
  async getAttachedDisks(): Promise<StorageResource[]> {
    await this.navigateToTab(TAB.Disks);
    const rows = await kubevirtDetailView.tableRows();
    return rows.map((line) => {
      const cols = line.split(/\t/);
      return {
        name: cols[diskTabCol.name],
        size: cols[diskTabCol.size].slice(0, -3),
        interface: cols[diskTabCol.interface],
        storageClass: cols[diskTabCol.storageClass],
      };
    });
  }

  async getAttachedNICs(): Promise<NetworkResource[]> {
    await this.navigateToTab(TAB.NetworkInterfaces);
    const rows = await kubevirtDetailView.tableRows();
    return rows.map((line) => {
      const cols = line.split(/\t/);
      return {
        name: cols[networkTabCol.name],
        model: cols[networkTabCol.model],
        mac: cols[networkTabCol.mac],
        networkDefinition: cols[networkTabCol.networkDefinition],
        binding: cols[networkTabCol.binding],
      };
    });
  }

  async addDisk(disk: StorageResource) {
    await this.navigateToTab(TAB.Disks);
    await click(kubevirtDetailView.createDisk, 1000);
    await isLoaded();
    await selectOptionByText(kubevirtDetailView.diskSource, DISK_SOURCE.Blank); // TODO: ATM always adds a Blank disk
    await fillInput(kubevirtDetailView.diskName, disk.name);
    await fillInput(kubevirtDetailView.diskSize, disk.size);
    await selectOptionByText(kubevirtDetailView.diskInterface, disk.interface);
    await selectOptionByText(kubevirtDetailView.diskStorageClass, disk.storageClass);
    await click(kubevirtDetailView.applyBtn);
    await isLoaded();
  }

  async removeDisk(name: string) {
    await this.navigateToTab(TAB.Disks);
    const count = await resourceRows.count();
    await kubevirtDetailView.selectKebabOption(name, 'Delete');
    await confirmAction();
    await browser.wait(until.and(waitForCount(resourceRows, count - 1)), PAGE_LOAD_TIMEOUT_SECS);
  }

  async addNIC(nic: NetworkResource) {
    await this.navigateToTab(TAB.NetworkInterfaces);
    await click(kubevirtDetailView.createNic, 1000);
    await isLoaded();
    await fillInput(kubevirtDetailView.nicName, nic.name);
    await selectOptionByText(kubevirtDetailView.nicModel, nic.model);
    await selectOptionByText(kubevirtDetailView.nicNetwork, nic.networkDefinition);
    await selectOptionByText(kubevirtDetailView.nicBinding, nic.binding);
    await fillInput(kubevirtDetailView.nicMACAddress, nic.mac);
    await click(kubevirtDetailView.applyBtn);
    await isLoaded();
  }

  async removeNIC(name: string) {
    await this.navigateToTab(TAB.NetworkInterfaces);
    const count = await resourceRows.count();
    await kubevirtDetailView.selectKebabOption(name, 'Delete');
    await confirmAction();
    await browser.wait(until.and(waitForCount(resourceRows, count - 1)), PAGE_LOAD_TIMEOUT_SECS);
  }

  // pops-up modal dialog
  async modalEditFlavor() {
    await click(vmDetailFlavorEditButton(this.namespace, this.name));
    await browser.wait(until.presenceOf(editFlavor.modalTitle()));
  }
}
