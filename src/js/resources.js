import resourcesMap from './icons';

export const drawProvider = provider => {
  const servicesEl = document.getElementById('services');
  servicesEl.innerHTML = '';

  Object.keys(resourcesMap[provider]).forEach(service => {
    const serviceItem = document.createElement('li');
    serviceItem.append(document.createTextNode(`${provider}.${service}`));
    servicesEl.append(serviceItem);
  });

  document.getElementById('provider-name').innerText = provider.toUpperCase();
};

export const drawProviders = providers => {
  const providersEl = document.getElementById('providers');

  providers.forEach(p => {
    const providerItem = document.createElement('li');
    providersEl.append(providerItem);

    const providerLink = document.createElement('a');
    providerLink.append(document.createTextNode(p));
    providerLink.title = p;
    providerLink.id = p;
    providerLink.href = `#${p}`;
    providerItem.append(providerLink);
  });
};

const providerChanged = () => drawProvider(location.hash.slice(1));

document.addEventListener('DOMContentLoaded', function () {
  const providers = Object.keys(resourcesMap);
  drawProviders(providers);
  window.addEventListener('hashchange', providerChanged);
  window.location.hash = `#${providers[0]}`;
  drawProvider(providers[0]);
});
