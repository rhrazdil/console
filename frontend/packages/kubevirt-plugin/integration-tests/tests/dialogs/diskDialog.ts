import { click } from '@console/shared/src/test-utils/utils';
import { fillInput, selectOptionByText, getSelectedOptionText } from '../utils/utils';
import * as view from '../../views/dialogs/diskDialog.view';
import { applyButton, saveButton } from '../../views/kubevirtDetailView.view';
import { StorageResource } from '../utils/types';
import { DISK_SOURCE } from '../utils/consts';
import { waitForNoLoaders } from '../../views/wizard.view';

export class DiskDialog {
  async fillName(name: string) {
    await fillInput(view.diskName, name);
  }

  async fillSize(size: string) {
    if (size !== undefined && (await view.diskSize.isPresent())) {
      await fillInput(view.diskSize, size);
    }
  }

  async selectInterface(diskInterface: string) {
    await selectOptionByText(view.diskInterface, diskInterface);
  }

  async selectStorageClass(storageClass: string) {
    if (await view.diskStorageClass.isPresent()) {
      await selectOptionByText(view.diskStorageClass, storageClass);
    }
  }

  async getDiskSource() {
    return getSelectedOptionText(view.diskSource);
  }

  static async selectSourceAttachDisk(PVCName: string) {
    await selectOptionByText(view.diskSource, DISK_SOURCE.AttachDisk);
    await selectOptionByText(view.diskPVC, PVCName);
  }

  static async selectSourceAttachClonedDisk(PVCName: string, PVCNamespace: string) {
    await selectOptionByText(view.diskSource, DISK_SOURCE.AttachClonedDisk);
    await selectOptionByText(view.diskNamespace, PVCNamespace);
    await selectOptionByText(view.diskPVC, PVCName);
  }

  static async selectSourceContainer(container: string) {
    await selectOptionByText(view.diskSource, DISK_SOURCE.Container);
    await selectOptionByText(view.diskContainer, container);
  }

  static async selectSourceURL(URL: string) {
    await selectOptionByText(view.diskSource, DISK_SOURCE.Url);
    await selectOptionByText(view.diskURL, URL);
  }

  static async selectSourceBlank() {
    await selectOptionByText(view.diskSource, DISK_SOURCE.Blank);
  }

  async create(disk: StorageResource) {
    await waitForNoLoaders();
    if (disk.selectSource !== undefined) {
      await disk.selectSource();
    } else {
      // use Blank disk by default
      await selectOptionByText(view.diskSource, DISK_SOURCE.Blank);
    }
    await this.fillName(disk.name);
    await this.fillSize(disk.size);
    await this.selectInterface(disk.interface);
    await this.selectStorageClass(disk.storageClass);
    await click(applyButton);
    await waitForNoLoaders();
  }

  async edit(disk: StorageResource) {
    await this.fillName(disk.name);
    await this.selectInterface(disk.interface);
    await this.fillSize(disk.size);
    await this.selectStorageClass(disk.storageClass);
    await click(saveButton);
    await waitForNoLoaders();
  }
}
