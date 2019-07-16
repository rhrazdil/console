import { $, element, by, browser, ExpectedConditions as until } from 'protractor';
import { rowForName } from '../crud.view';
import { click } from '../../tests/kubevirt/utils/utils';

// export const detailViewVmStatus = $('#details-column-1 .kubevirt-vm-status__link');
// export const listViewVmStatus = (name: string) => rowForName(name).$('.kubevirt-vm-status__link');
const dialogOverlay = $('.co-overlay');

const listViewKebabDropdown = '.pf-c-dropdown__toggle';
const listViewKebabDropdownMenu = '.pf-c-dropdown__menu';
export const detailViewDropdown = '#action-dropdown';
export const detailViewDropdownMenu = '.dropdown-menu-right';

export const confirmAction = () => browser.wait(until.presenceOf($('button[type=submit]')))
  .then(() => $('button[type=submit]').click())
  .then(() => browser.wait(until.not(until.presenceOf(dialogOverlay))));

/**
 * Selects option button from given dropdown element.
 */
const selectDropdownItem = (getActionsDropdown, getActionsDropdownMenu) => async(action) => {
  await browser.wait(until.elementToBeClickable(getActionsDropdown())).then(() => getActionsDropdown().click());
  const option = getActionsDropdownMenu().$$('button').filter(button => button.getText().then(text => text.startsWith(action))).first();
  await browser.wait(until.elementToBeClickable(option)).then(() => option.click());
};

/**
 * Performs action for VM via list view kebab menu.
 */
export const listViewAction = (name) => async(action, confirm?: boolean) => {
  const getActionsDropdown = () => rowForName(name).$$(listViewKebabDropdown).first();
  const getActionsDropdownMenu = () => rowForName(name).$(listViewKebabDropdownMenu);
  await selectDropdownItem(getActionsDropdown, getActionsDropdownMenu)(action);
  if (confirm === true) {
    if (action === 'Migrate') {
      await click(element(by.buttonText('Migrate')));
    } else {
      // TODO: WA for BZ(1719227), remove when resolved
      await confirmAction();
      await browser.wait(until.not(until.presenceOf(dialogOverlay)));
    }
  }
};
