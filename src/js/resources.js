import resourcesMap from './icons';

document.addEventListener('DOMContentLoaded', function () {
  const main = document.getElementById('main');

  for (const [provider, services] of Object.entries(resourcesMap)) {
    const details = document.createElement('details');
    const summary = document.createElement('summary');

    details.append(summary);
    summary.append(document.createTextNode(provider));
    main.append(details);

    const servicesList = document.createElement('ul');
    details.append(servicesList);
    for (const service of Object.keys(services)) {
      const serviceItem = document.createElement('li');
      serviceItem.classList.add('service');
      serviceItem.appendChild(document.createTextNode(service));
      servicesList.appendChild(serviceItem);
    }
  }
});
