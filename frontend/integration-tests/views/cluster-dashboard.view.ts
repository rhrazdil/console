import { $, browser, element, by } from 'protractor';
import { waitForNone } from '../protractor.conf';
import * as crudView from './crud.view';

export const loaders = element.all(by.xpath(`//*[contains(@class, 'skeleton-')]`));
export const isLoaded = async () => {
  //await crudView.isLoaded();
  await browser.wait(waitForNone(loaders));
};
export const detailsCard = $('[data-test-id="cluster-details-card"]');
export const detailsCardList = detailsCard.$('dl');

export const statusCard = $('[data-test-id="cluster-status-card"]');
export const inventoryCard = $('[data-test-id="cluster-inventory-card"]');
export const utilizationCard = $('[data-test-id="cluster-utilization-card"]');
export const durationDropdown = utilizationCard.$('[data-test-id="dropdown-button"]');
export const activityCard = $('[data-test-id="cluster-activity-card"]');
export const eventsPauseButton = $('[data-test-id="events-pause-button"]');
