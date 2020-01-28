import { browser } from 'protractor';
import { appHost, testName } from '@console/internal-integration-tests/protractor.conf';
import { clickHorizontalTab } from '@console/internal-integration-tests/views/horizontal-nav.view';
import { isLoaded, resourceTitle } from '@console/internal-integration-tests/views/crud.view';
import { activeTab } from '../../../views/detailView.view';
import { TAB } from '../../utils/constants/consts';
import { K8sKind } from '../../../../../../public/module/k8s/index';
import { clickNavLink } from '../../../../../../integration-tests/views/sidenav.view';

export class k8sUIResource {
  readonly name: string;

  readonly namespace: string;

  readonly kind: K8sKind;

  constructor(instance) {
    this.name = instance.name;
    this.namespace = instance.namespace;
    this.kind = instance.kind;
  }

  static async getResourceTitle() {
    return resourceTitle.getText();
  }

  async navigateToListView() {
    const resourceListUrl = (namespace) =>
      `${appHost}/k8s/${namespace === 'all-namespaces' ? '' : 'ns/'}${namespace}/${this.kind.plural}`;
    const currentUrl = await browser.getCurrentUrl();
    if (![resourceListUrl(testName), resourceListUrl('all-namespaces')].includes(currentUrl)) {
      await clickNavLink(['Workloads', this.kind.labelPlural]);
      await isLoaded();
    }
  }

  async navigateToTab(tabName: string) {
    await this.navigateToListView();
    if ((await activeTab.getText()) !== tabName) {
      await clickHorizontalTab(tabName);
      await isLoaded();
    }
  }

  async navigateToDetails() {
    await this.navigateToTab(TAB.Details);
  }

  async navigateToOverview() {
    await this.navigateToTab(TAB.Overview);
  }

  async navigateToConsoles() {
    await this.navigateToTab(TAB.Consoles);
  }

  asResource() {
    return {
      kind: this.kind.plural,
      metadata: {
        namespace: this.namespace,
        name: this.name,
      },
    };
  }
}
