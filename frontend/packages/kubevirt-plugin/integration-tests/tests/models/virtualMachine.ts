/* eslint-disable no-await-in-loop, no-console */
import { browser, ExpectedConditions as until } from 'protractor';
import {
  waitForStringNotInElement,
} from '@console/shared/src/test-utils/utils';
import * as vmView from '../../views/virtualMachine.view';
import { VMConfig, VMImportConfig } from '../utils/types';
import {
  PAGE_LOAD_TIMEOUT_SECS,
  VM_BOOTUP_TIMEOUT_SECS,
  VM_MIGRATION_TIMEOUT_SECS,
  VM_ACTION,
  TAB,
  VM_IMPORT_TIMEOUT_SECS,
  VM_STATUS,
} from '../utils/constants/consts';
import { detailViewAction, listViewAction } from '../../views/vm.actions.view';
import { ProvisionSourceName } from '../utils/constants/wizard';
import { Wizard } from './wizard';
import { ImportWizard } from './importWizard';
import { BaseVM } from './baseModels/baseVM';
import { VirtualMachineModel } from '../../../src/models/index';
import { VMBuilderData } from '../types/vm';

export class VirtualMachine extends BaseVM {
  private noConfirmDialogActions: VM_ACTION[] = [VM_ACTION.Start, VM_ACTION.Clone];

  constructor(data: VMBuilderData) {
    super(data, VirtualMachineModel);
  }

  async action(action: VM_ACTION, waitForAction?: boolean, timeout?: number) {
    await this.navigateToDetails();
    await detailViewAction(action, !this.noConfirmDialogActions.includes(action));
    if (waitForAction !== false) {
      await this.waitForActionFinished(action, timeout);
    }
  }

  async listViewAction(action: VM_ACTION, waitForAction?: boolean, timeout?: number) {
    await this.navigateToListView();
    await listViewAction(this.name)(action, !this.noConfirmDialogActions.includes(action));
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

  async create({
    name,
    description,
    template,
    provisionSource,
    operatingSystem,
    flavorConfig,
    workloadProfile,
    startOnCreation,
    cloudInit,
    storageResources,
    CDRoms,
    networkResources,
    bootableDevice,
  }: VMConfig) {
    const wizard = new Wizard();
    await this.navigateToListView();
    await wizard.openWizard();
    if (template !== undefined) {
      await wizard.selectTemplate(template);
    } else {
      await wizard.selectProvisionSource(provisionSource);
      await wizard.selectOperatingSystem(operatingSystem);
      await wizard.selectWorkloadProfile(workloadProfile);
    }
    await wizard.selectFlavor(flavorConfig);
    await wizard.fillName(name);
    await wizard.fillDescription(description);
    if (startOnCreation) {
      await wizard.startOnCreation();
    }
    await wizard.next();

    // Networking
    for (const resource of networkResources) {
      await wizard.addNIC(resource);
    }
    if (provisionSource.method === ProvisionSourceName.PXE && template === undefined) {
      // Select the last NIC as the source for booting
      await wizard.selectBootableNIC(networkResources[networkResources.length - 1].name);
    }
    await wizard.next();

    // Storage
    for (const resource of storageResources) {
      if (resource.name === 'rootdisk' && provisionSource.method === ProvisionSourceName.URL) {
        await wizard.editDisk(resource.name, resource);
      } else {
        await wizard.addDisk(resource);
      }
    }
    if (provisionSource.method === ProvisionSourceName.DISK) {
      if (bootableDevice !== undefined) {
        await wizard.selectBootableDisk(bootableDevice);
      } else if (storageResources.length > 0) {
        // Select the last Disk as the source for booting
        await wizard.selectBootableDisk(storageResources[storageResources.length - 1].name);
      } else {
        throw Error(`No bootable device provided for ${provisionSource.method} provision method.`);
      }
    }
    await wizard.next();

    // Advanced - Cloud Init
    if (cloudInit.useCloudInit) {
      if (template !== undefined) {
        // TODO: wizard.useCloudInit needs to check state of checkboxes before clicking them to ensure desired state is achieved with specified template
        throw new Error('Using cloud init with template not implemented.');
      }
      await wizard.configureCloudInit(cloudInit);
    }
    await wizard.next();

    // Advanced - Virtual Hardware
    if (CDRoms) {
      for (const resource of CDRoms) {
        await wizard.addCD(resource);
      }
    }
    await wizard.next();

    // Review page
    await wizard.confirmAndCreate();
    await wizard.waitForCreation();

    await this.navigateToTab(TAB.Details);
    if (startOnCreation === true) {
      // If startOnCreation is true, wait for VM to boot up
      await this.waitForStatus(VM_STATUS.Running, VM_BOOTUP_TIMEOUT_SECS);
    } else {
      // Else wait for possible import to finish
      await this.waitForStatus(VM_STATUS.Off, VM_IMPORT_TIMEOUT_SECS);
    }
  }

  async import({
    provider,
    instanceConfig,
    sourceVMName,
    name,
    description,
    operatingSystem,
    flavorConfig,
    workloadProfile,
    storageResources,
    networkResources,
    cloudInit,
  }: VMImportConfig) {
    const importWizard = new ImportWizard();
    await this.navigateToListView();
    await importWizard.openWizard();

    // General section
    await importWizard.selectProvider(provider);
    await importWizard.waitForVMWarePod();
    await importWizard.configureInstance(instanceConfig);

    await importWizard.connectToInstance();
    await importWizard.waitForInstanceSync();

    await importWizard.selectSourceVirtualMachine(sourceVMName);
    await importWizard.waitForInstanceSync();

    if (operatingSystem) {
      await importWizard.selectOperatingSystem(operatingSystem as string);
    }
    if (flavorConfig) {
      await importWizard.selectFlavor(flavorConfig);
    }
    if (workloadProfile) {
      await importWizard.selectWorkloadProfile(workloadProfile);
    }
    if (name) {
      await importWizard.fillName(name);
    }
    if (description) {
      await importWizard.fillDescription(description);
    }
    await importWizard.next();

    // Networking
    // Frst update imported network interfaces to comply with k8s
    await importWizard.updateImportedNICs();
    // Optionally add new interfaces, if any
    if (networkResources !== undefined) {
      for (const NIC of networkResources) {
        await importWizard.addNIC(NIC);
      }
    }
    await importWizard.next();

    // Storage
    // First update disks that come from the source VM
    await importWizard.updateImportedDisks();
    // Optionally add new disks
    if (networkResources !== undefined) {
      for (const disk of storageResources) {
        await importWizard.addDisk(disk);
      }
    }
    await importWizard.next();

    // Advanced - Cloud Init
    if (cloudInit !== undefined) {
      await importWizard.configureCloudInit(cloudInit);
    }
    await importWizard.next();
    // Advanced - Virtual HW
    await importWizard.next();
    // Review
    await importWizard.confirmAndCreate();
    await importWizard.waitForCreation();

    // Navigate to detail page
    await importWizard.navigateToDetail();
  }
}
