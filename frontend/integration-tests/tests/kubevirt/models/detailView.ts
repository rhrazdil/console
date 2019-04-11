/* eslint-disable no-unused-vars, no-undef */
import { browser } from 'protractor';

import { appHost } from '../../../protractor.conf';
import { clickHorizontalTab } from '../../../views/horizontal-nav.view';
import { isLoaded } from '../../../views/crud.view';
import * as vmView from '../../../views/kubevirt/virtualMachine.view';

export class DetailView {
  readonly name: string;
  readonly namespace: string;
  readonly kind: string;

  constructor(name: string, namespace: string, kind: string) {
    this.name = name;
    this.namespace = namespace;
    this.kind = kind;
  }

  static async getResourceTitle() {
    return vmView.resourceTitle.getText();
  }

  async navigateToTab(tabName: string) {
    if (!await vmView.resourceTitle.isPresent() || await vmView.resourceTitle.getText() !== this.name) {
      await browser.get(`${appHost}/k8s/ns/${this.namespace}/${this.kind}/${this.name}`);
      await isLoaded();
    }
    await clickHorizontalTab(tabName);
    await isLoaded();
  }
}
