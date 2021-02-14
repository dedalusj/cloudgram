/*
Import all the SVG files for the services and make them available for other components

All the provider files are automatically generated via the `scripts/assets.js` file
while this file and the generic.js file are manually maintained.
*/

import * as awsIcons from './aws.js';
import * as k8sIcons from './k8s.js';
import * as azureIcons from './azure.js';
import * as gcpIcons from './gcp.js';
import * as genericIcons from './generic.js';

export default {
  aws: awsIcons,
  k8s: k8sIcons,
  azure: azureIcons,
  gcp: gcpIcons,
  generic: genericIcons,
};
