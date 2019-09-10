import { $, $$ } from 'protractor';
import { selectDropdownOption } from '../../../console-shared/src/test-utils/utils';
import { fillInput } from '../tests/utils/utils';

// Wizard Common
export const closeWizard = $('.modal-footer > button.btn-cancel');
export const wizardContent = $('.wizard-pf-contents');
export const wizardHeader = $('.modal-header');
export const provisionResultIcon = wizardContent.$('.pficon-ok');
export const nextButton = $('.modal-footer > button.btn-primary');
export const apply = $('.inline-edit-buttons > button:first-child');
export const cancelButton = $('.inline-edit-buttons > button:last-child');
export const wizardHelpBlock = $('.modal-body .help-block');
// Basic Settings tab
export const createWithWizardLink = $('#wizard-link');
export const createWithYAMLLink = $('#yaml-link');

export const nameInput = $('#vm-name');
export const descriptionInput = $('#vm-description');

const provisionSourceURL = $('#provision-source-url');
const provisionSourceContainerImage = $('#provision-source-container');
export const provisionSources = {
  URL: provisionSourceURL,
  Container: provisionSourceContainerImage,
};

export const providerDropdownId = '#provider-dropdown';
export const vcenterInstanceDropdownId = '#vcenter-instance-dropdown';
export const namespaceDropdownId = '#namespace-dropdown';
export const provisionSourceDropdownId = '#image-source-type-dropdown';
export const operatingSystemDropdownId = '#operating-system-dropdown';
export const templateDropdownId = '#template-dropdown';
export const flavorDropdownId = '#flavor-dropdown';
export const customFlavorCpus = '#resources-cpu';
export const customFlavorMemory = '#resources-memory';
export const workloadProfileDropdownId = '#workload-profile-dropdown';

export const vcenterHostname = $('#vcenter-hostname-dropdown');
export const vcenterUsername = $('#vcenter-username');
export const vcenterPassword = $('#vcenter-password');
export const saveVcenterCreds = $('#vcenter-remember-credentials');
export const vcenterSaveInstanceButton = $('#vcenter-connect');

export const startVMOnCreation = $('#start-vm');
export const useCloudInit = $('#use-cloud-init');
export const useCustomScript = $('#use-cloud-init-custom-script');
export const customCloudInitScript = $('#cloud-init-custom-script');
export const cloudInitHostname = $('#cloud-init-hostname');
export const cloudInitSSH = $('#cloud-init-ssh');

// Networking tab
export const createNIC = $('#create-network-btn');
export const pxeNICDropdownId = '#pxe-nic-dropdown';

// Storage tab
export const attachDisk = $('#attach-disk-btn');
export const createDisk = $('#create-storage-btn');

// Result tab
export const errorMessage = $('.kubevirt-create-vm-wizard__result-tab-row--error');

// Tables
export const tableRowsCount = () => $$('.kubevirt-editable-table tbody tr').count();
export const activateTableRow = (rowNumber: number) =>
  $$('.kubevirt-editable-table tbody tr')
    .get(rowNumber)
    .click();

/**
 * Sets an attribute of a disk (name, size) on a given row.
 * @param  {number}    rowNumber     Number of row to select, indexed from 1 for the first row.
 * @param  {string}    attribute     Attribute name - size or name.
 * @param  {string}    value         Value to set.
 * @throws {Error}                   Will throw an Error when input for selected attribute doesn't exist.
 */
export const setTableInputAttribute = async (
  rowNumber: number,
  attribute: string,
  value: string,
) => {
  await fillInput($(`#${attribute}-edit-${rowNumber}-row`), value);
};

/**
 * Selects a dropdown attribute of an entity (disk, NIC) on a given row.
 * @param {number}    rowNumber     Number of row to select, indexed from 1 for the first row.
 * @param {string}    tableType     Type of resource table (network, storage, ...).
 * @param {string}    attribute     Attribute name - size, name, mac.
 * @param {string}    value         Value to set.
 */
export const selectTableDropdownAttribute = async (
  rowNumber: number,
  tableType: string,
  value: string,
) => {
  await selectDropdownOption(`#${tableType}-edit-${rowNumber.toString()}-row`, value);
};
