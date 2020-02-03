import { appHost, testName } from '../protractor.conf';
import * as sideNavView from '../../views/sidenav.view';

describe('Project Dashboard', () => {
  beforeAll(async () => {
    sideNavView.clickNavLink(['Home', 'Projects']);
    await clusterDashboardView.isLoaded();
  });
  /*
      afterEach(() => {
        checkLogs();
        checkErrors();
      });
      */

  describe('Details Card', () => {
    it('has all fields populated', async () => {
      expect(clusterDashboardView.detailsCard.isDisplayed()).toBe(true);
      const items = clusterDashboardView.detailsCardList.$$('dt');
      const values = clusterDashboardView.detailsCardList.$$('dd');

      expect(items.count()).toBe(5);
      expect(values.count()).toBe(5);
      expect(items.get(0).getText()).toEqual('Cluster API Address');
      expect(items.get(1).getText()).toEqual('Cluster ID');
      expect(items.get(2).getText()).toEqual('Provider');
      expect(items.get(3).getText()).toEqual('OpenShift Version');
      expect(items.get(4).getText()).toEqual('Update Channel');
      for (let i = 0; i < 5; i++) {
        const text = values.get(i).getText();
        expect(text.length).not.toBe(0);
        expect(text).not.toBe('Not available');
      }
    });
    it('has View settings link', () => {
      const link = clusterDashboardView.detailsCard.$('[href="/settings/cluster/"]');
      expect(link.isDisplayed()).toBe(true);
      expect(link.getText()).toEqual('View settings');
    });
  });

  describe('Status Card', () => {
    it('has View alerts link', () => {
      expect(clusterDashboardView.detailsCard.isDisplayed()).toBe(true);
      const link = clusterDashboardView.statusCard.$('[href="/monitoring/alerts"]');
      expect(link.isDisplayed()).toBe(true);
      expect(link.getText()).toEqual('View alerts');
    });
    it('has health indicators', () => {
      const items = clusterDashboardView.statusCard.$$('.co-status-card__health-item');
      expect(items.count()).toBe(3); //TODO 3 on clean cluster
      expect(items.get(0).getText()).toEqual('Cluster');
      expect(items.get(1).getText()).toMatch('Control Plane.*');
      expect(items.get(2).getText()).toMatch('Operators.*'); //TODO just use toEqual
    });
  });

  describe('Inventory Card', () => {
    it('has all items', async () => {
      //await clusterDashboardView.isLoaded();
      expect(clusterDashboardView.inventoryCard.isDisplayed()).toBe(true);
      inventoryItems.forEach((item) => {
        const link = clusterDashboardView.inventoryCard.$(`[href="${item.link}"]`);
        expect(link.isDisplayed()).toBe(true);
        expect(link.getText()).toMatch(`^[0-9]* ${item.title}?.*`);
      });
    });
  });

  describe('Utilization Card', () => {
    it('has all items', () => {
      expect(clusterDashboardView.utilizationCard.isDisplayed()).toBe(true);
    });
  });

  describe('Activity Card', () => {
    it('has all items', () => {
      expect(clusterDashboardView.activityCard.isDisplayed()).toBe(true);
    });
    it('has View events link', () => {
      const link = clusterDashboardView.activityCard.$('[href="/k8s/all-namespaces/events"]');
      expect(link.isDisplayed()).toBe(true);
      expect(link.getText()).toEqual('View events');
    });
  });
});
