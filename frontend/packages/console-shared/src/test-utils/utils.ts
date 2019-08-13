/* eslint-disable no-await-in-loop, no-console, no-underscore-dangle */
import { execSync } from 'child_process';
import * as _ from 'lodash';
import { $, by, ElementFinder, browser, ExpectedConditions as until, element, ElementArrayFinder } from 'protractor';
import { config } from '@console/../integration-tests/protractor.conf';

export function resolveTimeout(timeout: number, defaultTimeout: number) {
  return timeout !== undefined ? timeout : defaultTimeout;
}

export function removeLeakedResources(leakedResources: Set<string>) {
  const leakedArray: string[] = [...leakedResources];
  if (leakedArray.length > 0) {
    console.error(`Leaked ${leakedArray.join()}`);
    leakedArray
      .map((r) => JSON.parse(r) as { name: string; namespace: string; kind: string })
      .forEach(({ name, namespace, kind }) => {
        try {
          execSync(`kubectl delete -n ${namespace} --cascade ${kind} ${name}`);
        } catch (error) {
          console.error(`Failed to delete ${kind} ${name}:\n${error}`);
        }
      });
  }
  leakedResources.clear();
}

export function addLeakableResource(leakedResources: Set<string>, resource) {
  leakedResources.add(
    JSON.stringify({
      name: resource.metadata.name,
      namespace: resource.metadata.namespace,
      kind: resource.kind,
    }),
  );
}

export function removeLeakableResource(leakedResources: Set<string>, resource) {
  leakedResources.delete(
    JSON.stringify({
      name: resource.metadata.name,
      namespace: resource.metadata.namespace,
      kind: resource.kind,
    }),
  );
}

export function createResource(resource) {
  execSync(`echo '${JSON.stringify(resource)}' | kubectl create -f -`);
}

export function createResources(resources) {
  resources.forEach(createResource);
}

export function deleteResource(resource) {
  const kind = resource.kind === 'NetworkAttachmentDefinition' ? 'net-attach-def' : resource.kind;
  execSync(
    `kubectl delete -n ${resource.metadata.namespace} --cascade ${kind} ${resource.metadata.name}`,
  );
}

export function deleteResources(resources) {
  resources.forEach(deleteResource);
}

export async function withResource(
  resourceSet: Set<string>,
  resource: any,
  callback: Function,
  keepResource: boolean = false,
) {
  addLeakableResource(resourceSet, resource);
  await callback();
  if (!keepResource) {
    deleteResource(resource);
    removeLeakableResource(resourceSet, resource);
  }
}

export async function click(elem: ElementFinder, timeout?: number) {
  const _timeout = resolveTimeout(timeout, config.jasmineNodeOpts.defaultTimeoutInterval);
  await browser.wait(until.elementToBeClickable(elem), _timeout);
  await elem.click();
}

export async function selectDropdownOption(dropdownId: string, option: string) {
  await click($(dropdownId));
  await browser.wait(until.presenceOf(element(by.linkText(option))));
  await $(`${dropdownId} + ul`)
    .element(by.linkText(option))
    .click();
}

export async function getDropdownOptions(dropdownId: string): Promise<string[]> {
  const options = [];
  await $(`${dropdownId} + ul`)
    .$$('li')
    .each((elem) => {
      elem
        .getText()
        .then((text) => {
          options.push(text);
        })
        .catch((err) => {
          return Promise.reject(err);
        });
    });
  return options;
}

export async function asyncForEach(iterable, callback) {
  const array = [...iterable];
  for (let index = 0; index < array.length; index++) {
    await callback(array[index], index, array);
  }
}

export const waitForCount = (elementArrayFinder: ElementArrayFinder, targetCount: number) => {
  return async () => {
    const count = await elementArrayFinder.count();
    return count === targetCount;
  };
};

export const waitForStringInElement = (elem: ElementFinder, needle: string) => {
  return async () => {
    const content = await elem.getText();
    return content.includes(needle);
  };
};

export const waitForStringNotInElement = (elem: ElementFinder, needle: string) => {
  return async () => {
    const content = await elem.getText();
    return !content.includes(needle);
  };
};