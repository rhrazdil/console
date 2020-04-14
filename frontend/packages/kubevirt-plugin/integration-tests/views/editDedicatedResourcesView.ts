import { $, element, by } from 'protractor';

export const guaranteedPolicyCheckbox = $('.pf-c-check__label');
export const saveButton = element(by.buttonText('Save'));
export const noGuaranteedPolicyText = 'No Dedicated resources applied';
export const guaranteedPolicyText =
  'Workload scheduled with dedicated resources (guaranteed policy)';
