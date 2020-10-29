import {drawProvider, drawProviders} from '../src/js/resources';
import resourceMap from '../src/js/icons';

it('draws all the services for a provider', () => {
  document.body.innerHTML = `<div id="provider-name"></div><div id="services"></div>`;
  const [provider, services] = Object.entries(resourceMap)[0];
  drawProvider(provider);
  Object.keys(services).forEach(s => expect(document.body.innerHTML).toContain(s));
});

it('draws all the providers', () => {
  document.body.innerHTML = `<div id="providers"></div>`;
  const providers = Object.keys(resourceMap);
  drawProviders(providers);
  providers.forEach(p => expect(document.body.innerHTML).toContain(p));
});
