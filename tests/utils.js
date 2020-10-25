export const randomString = () => Math.random().toString(36).substring(7);
export const randomItem = items => items[Math.floor(Math.random() * items.length)];
export const randomProvider = () => randomItem(['aws', 'google', 'generic']);
export const randomService = () => randomItem(['route53', 'ec2', 's3']);
export const randomNode = () => ({
  id: randomString(),
  provider: randomProvider(),
  service: randomService(),
});
