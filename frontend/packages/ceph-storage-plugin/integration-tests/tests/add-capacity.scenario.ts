import { execSync } from 'child_process';
import { browser, ExpectedConditions as until } from 'protractor';
import { appHost } from '@console/internal-integration-tests/protractor.conf';
import * as _ from 'lodash';
import { click } from '@console/shared/src/test-utils/utils';

import {
  ocsOp,
  storageClusterView,
  addCapacityLbl,
  addCapacityBtn,
  storageClusterRow,
} from '../views/add-capacity.view';

const namespace = 'openshift-storage';
const kind = 'storagecluster';
const storageCluster = JSON.parse(execSync(`kubectl get -o json -n ${namespace} ${kind}`).toString());
const name = storageCluster.items[0].metadata.name;
let clusterJSON, previousCnt, previousPods, updatedClusterJSON, updatedCnt, updatedPods;

describe('Check add capacity functionality for ocs service', () => {

  beforeAll(async () => {

    clusterJSON = JSON.parse(
      execSync(`kubectl get -o json -n ${namespace} ${kind} ${name}`).toString(),
    );
    previousCnt = _.get(clusterJSON, 'spec.storageDeviceSets[0].count', undefined);
    const uid = _.get(clusterJSON, 'metadata.uid', undefined).toString();
    previousPods = JSON.parse(execSync(`kubectl get pods -n ${namespace} -o json`).toString());

    await browser.get(
      `${appHost}/k8s/ns/openshift-storage/operators.coreos.com~v1alpha1~ClusterServiceVersion`,
    );

    await click(ocsOp);
    await click(storageClusterView);


    await browser.wait(until.presenceOf(storageClusterRow(uid)));
    const kebabMenu = storageClusterRow(uid).$('button[data-test-id="kebab-button"]');

    await click(kebabMenu);
    await click(addCapacityLbl);
    await click(addCapacityBtn);

    updatedClusterJSON = JSON.parse(
      execSync(
        `kubectl get -o json -n ${namespace} ${kind} ${name}`,
      ).toString()
    );

    const statusCol = storageClusterRow(uid).$('td:nth-child(4)');
    await browser.wait(
      until.textToBePresentInElement(statusCol, 'Progressing'),
    );
    await browser.wait(
      until.textToBePresentInElement(statusCol.$('span.co-icon-and-text span'), 'Ready'),
    );
    updatedCnt = _.get(updatedClusterJSON, 'spec.storageDeviceSets[0].count', undefined);
    updatedPods = JSON.parse(
      execSync(`kubectl get pod -o json -n ${namespace}`).toString(),
    );
    console.log(previousPods.items.length, updatedPods.items.length);

  });

  it('Newly added capacity should takes into effect at the storage level', () => {
    // by default 2Tib capacity is being added
    expect(updatedCnt - previousCnt).toEqual(1);
  });

  it('New osd pods corresponding to the additional capacity should be in running state', () => {

    const isPodPresent = (podName) => {
      return previousPods.items.some((pod) => pod.metadata.name === podName);
    };

    const newPods = [];
    updatedPods.items.forEach((pod) => {
      if (!isPodPresent(pod.metadata.name) && pod.startsWith('rook-ceph-osd')) {
        newPods.push(pod);
      }
    });

    expect(newPods.length).toEqual(6);
    console.log(newPods);
  });

  it('New osds are added correctly to the nodes in availability zones/failure domains', () => {

  });

  it('Ceph osd tree should show the new osds under right nodes/hosts', () => {

  });

  it('Ceph cluster should be healthy', () => {

  });

  it('No ocs pods should get restarted unexpectedly', () => {
    // previousPods.items.forEach((pod) => {
    //   if(!isPodPresent(pod.metadata.name) && pod.startsWith('rook-ceph-osd')) {
    //     newPods.push(pod);
    //   }
    // });
  });

  it('No OCP/OCS nodes should go to NotReady state', () => {

  });

  afterAll(async () => {
    //execSync(`echo '${JSON.stringify(testCSV)}' | kubectl delete -f -`);
  });
});
