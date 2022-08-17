/*
Node script to create SVG assets and their related
JS files for the service icons of each provider
*/

import fs from 'fs-extra';
import path from 'path';
import url from 'url';

import axios from 'axios';
import camelCase from 'camelcase';
import glob from 'glob-promise';
import nunjucks from 'nunjucks';
import pino from 'pino';
import unzipper from 'unzipper';
import xml2js from 'xml2js';
import tmp from 'tmp';

const logger = pino({
  transport: {
    target: 'pino-pretty',
    options: {
      colorize: true,
      translateTime: true,
      ignore: 'pid,hostname',
    },
  },
});

const __filename: string = url.fileURLToPath(import.meta.url);
const __dirname: string = path.dirname(__filename);
const parser = new xml2js.Parser();
const builder = new xml2js.Builder();
const providerTsTemplate = fs.readFileSync(path.join(__dirname, 'provider.ts.njk')).toString();
const docsTemplate = fs.readFileSync(path.join(__dirname, 'resources_content.html.njk')).toString();

const imagesDir = (provider: string) => path.join(__dirname, '..', 'src', 'images', provider);
const renderTsFile = (provider: string) => path.join(__dirname, '..', 'src', 'ts', 'icons', `${provider}.ts`);
const resourceDocsFile = path.join(__dirname, '..', 'src', 'resources_content.html');
const assetsOverrideDir = path.join(__dirname, 'assets_override');

const tap =
  <T>(fn: (T) => void): ((T) => T) =>
  data => {
    fn(data);
    return data;
  };
const groupBy =
  <T>(key: string) =>
  (objs: T[]): Record<string, T[]> =>
    objs.reduce(
      (acc, o) => ({
        ...acc,
        [o[key]]: [...(acc[o[key]] || []), o],
      }),
      {}
    );
const getParentDir = (f: string, level: number = 1) => path.dirname(f).split(path.sep).slice(-level)[0];
const basename = (filepath: string) => path.basename(filepath, path.extname(filepath));
const sanitizeName = (s: string) => s.replace(/[^a-zA-Z0-9_$-]/g, '').replace(/-+/, '-');

const mkdir = async (dir: string) => fs.promises.mkdir(dir, {recursive: true});
const rmdir = async (dir: string) => fs.promises.rm(dir, {recursive: true, maxRetries: 10, force: true});

// download a file onto a temporary directory
const downloadFile = async (url: string) => {
  const outputFile = tmp.tmpNameSync({});
  const writer = fs.createWriteStream(outputFile);

  const response = await axios({
    url,
    method: 'GET',
    responseType: 'stream',
  });

  response.data.pipe(writer);

  return new Promise<string>((resolve, reject) => {
    writer.on('finish', () => resolve(outputFile));
    writer.on('error', reject);
  });
};

const unzipFile = async (sourceFile: string, outputDir: string) => {
  const w = fs.createReadStream(sourceFile).pipe(unzipper.Extract({path: outputDir}));
  return new Promise<void>((resolve, reject) => {
    w.on('finish', resolve);
    w.on('error', reject);
  });
};

const copyFromDir = async (sourceDir: string, destDir: string) => fs.copy(sourceDir, destDir);
const fromRemoteZip = async (sourceUrl: string, destDir: string) =>
  downloadFile(sourceUrl).then(downloadedFile => unzipFile(downloadedFile, destDir));

// basic utility types
type Initial = {source: string; provider: string};
type WithFilename = Initial & {filename: string};
type WithGroup = WithFilename & {group: string};
type WithTarget = WithGroup & {target: string};
type WithImportName = WithTarget & {importName: string};
type WithOriginalContent = WithImportName & {originalContent: string};
type WithResizedContent = WithOriginalContent & {resizedContent: string};
type WithImportPath = WithResizedContent & {importPath: string};

// utils for the assets generation pipeline
const extractFilename = ({source, ...rest}: Initial): WithFilename => ({
  ...rest,
  source,
  filename: path.basename(source).toLowerCase(),
});
const replacePatterns =
  (patterns: Pattern[]) =>
  ({filename, ...rest}: WithGroup): WithGroup => ({
    ...rest,
    filename: patterns.length
      ? patterns.reduce((acc, [pattern, replacement]) => acc.replace(pattern, replacement), filename)
      : filename,
  });
const addTarget = ({provider, filename, ...rest}: WithGroup): WithTarget => ({
  ...rest,
  filename,
  provider,
  target: path.join(imagesDir(provider), filename),
});
const addImportName = ({filename, ...rest}: WithTarget): WithImportName => ({
  ...rest,
  filename,
  importName: camelCase(sanitizeName(basename(filename))),
});
const readContent = async ({source, ...rest}: WithImportName): Promise<WithOriginalContent> =>
  fs.promises.readFile(source).then(s => ({
    ...rest,
    source,
    originalContent: s.toString(),
  }));
const resizeContent = async ({originalContent, ...rest}: WithOriginalContent): Promise<WithResizedContent> =>
  parser
    .parseStringPromise(originalContent)
    .then(({svg: {$: attr, ...svgRest}, ...topRest}) => ({
      ...topRest,
      svg: {...svgRest, $: {...attr, width: '80px', height: '80px'}},
    }))
    .then(o => builder.buildObject(o))
    .then(resizedContent => ({...rest, originalContent, resizedContent}));
const removeDuplicateAssets = (assets: WithResizedContent[]) =>
  assets.filter((v, i, a) => a.findIndex(t => t.importName === v.importName) === i);
const compareAssets = ({importName: n1}: WithResizedContent, {importName: n2}: WithResizedContent): number =>
  n1 < n2 ? -1 : n2 > n1 ? 1 : 0;

// save the assets (SVGs) into their final destination
const saveAssets = async (assets: WithResizedContent[]) =>
  Promise.all(
    assets.map(({target, resizedContent, ...rest}) =>
      mkdir(path.dirname(target))
        .then(() => fs.promises.writeFile(target, resizedContent))
        .then(() => ({...rest, target, resizedContent}))
    )
  );

// render the JS file importing all the SVG icons for a provider
const renderJS = (provider: string) => async (assets: WithResizedContent[]) => {
  const toRender: WithImportPath[] = assets.map(({target, ...rest}) => ({
    ...rest,
    target,
    importPath: path.relative(path.dirname(renderTsFile(provider)), target),
  }));
  const rendered = nunjucks.renderString(providerTsTemplate, {assets: toRender});
  return fs.promises.writeFile(renderTsFile(provider), rendered).then(() => toRender);
};

const AWS = 'aws';
const Azure = 'azure';
const K8s = 'k8s';
const GCP = 'gcp';
const Generic = 'generic';

type Pattern = [RegExp, string];

// the following patterns in the form [regex, string replacement] allow for
// customisation of asset names for each provider.
//
// NOTE: order is important in the following as the regex
// substitutions will be applied in order of definition
const awsPatterns: Pattern[] = [
  [/lot/gi, 'iot'],
  [/lense/gi, 'lens'],
  [/&/gi, 'and'],
  [/_48_dark/gi, ''],
  [/_64/gi, ''],
  [/res_amazon-/gi, ''],
  [/res_aws-/gi, ''],
  [/^res_/i, ''],
  [/arch_aws-/gi, ''],
  [/arch_amazon-/gi, ''],
  [/^arch_/i, ''],
  [/aurora_amazon-/gi, ''],
  [/cloud9_cloud9/gi, 'cloud9'],
  [/elasticache_elasticache/gi, 'elasticache'],
  [/emr_emr/gi, 'emr'],
  [/identity-and-access-management/gi, 'identity-access-management'],
  [/identity-access-management/gi, 'iam'],
  [/iam_aws-iam/gi, 'iam'],
  [/iam_aws/gi, 'iam'],
  [/lambda_lambda/gi, 'lambda'],
  [/managed-blockchain_blockchain/gi, 'managed-blockchain'],
  [/alrternate/gi, 'alternate'],
  [/aternate/gi, 'alternate'],
  [/res-amazon-simple-storage_s3-replication/gi, 's3-replication'],
  [/shield_aws-shield/gi, 'shield'],
  [/snowball_snowball/gi, 'snowball'],
  [/amazon-simple-storage_s3/gi, 's3'],
  [/s3-standard/gi, 's3'],
  [/simple-storage_service/gi, 's3'],
  [/simple-storage/gi, 's3'],
  [/simple-email-service/gi, 'ses'],
  [/simple-queue-service/gi, 'sqs'],
  [/database-migration-service_database-migration/gi, 'database-migration'],
  [/elastic-block-store/gi, 'ebs'],
  [/elastic-container-service/gi, 'ecs'],
  [/elastic-container-registry/gi, 'ecr'],
  [/elastic-file-system/gi, 'efs'],
  [/elastic-load-balancing/gi, 'elb'],
  [/elb_application-load-balancer/gi, 'alb'],
  [/elb_network-load-balancer/gi, 'nlb'],
  [/simple-notification-service/gi, 'sns'],
];
const azurePatterns: Pattern[] = [
  [/^[0-9]+-icon-service-/i, ''],
  [/^azure-/i, ''],
  [/ /, '-'],
  [/machinesazurearc/, 'machines-azure-arc'],
];
const k8sPatterns: Pattern[] = [];
const gcpPatterns: Pattern[] = [
  [/-521/, ''],
  [/-512/, ''],
  [/-color.*\./, '.'],
  [/^cloud-?/, ''],
  [/debugger/, 'cloud-debugger'],
  [/GKEOn/i, 'gke-on'],
];
const genericPatterns: Pattern[] = [];

// custom provider functions to compute the name of the group a
// service should belong from the name of the SVG file
const awsComputeGroup = ({source, ...rest}: WithFilename): WithGroup => ({
  ...rest,
  source,
  group: getParentDir(source, 2)
    .toLowerCase()
    .replace('arch_', '')
    .replace('res_', '')
    .replace('lot', 'iot')
    .replace(/[-_]/g, ' ')
    .replace(/ +/g, ' ')
    .trim()
    .replace(/^\w/, c => c.toUpperCase())
    .replace('Iot', 'Internet of things')
    .replace('enagagement', 'engagement'),
});
const azureComputeGroup = ({source, ...rest}: WithFilename): WithGroup => ({
  ...rest,
  source,
  group: getParentDir(source)
    .toLowerCase()
    .trim()
    .replace(/\+/g, 'and')
    .replace('iot', 'Internet of things')
    .replace(/^\w/, c => c.toUpperCase()),
});
const k8sComputeGroup = ({source, ...rest}: WithFilename): WithGroup => ({
  ...rest,
  source,
  group: 'Generic', // no group information available in k8s
});
const gcpComputeGroup = ({source, ...rest}: WithFilename): WithGroup => ({
  ...rest,
  source,
  group: getParentDir(source, 1).toLowerCase().trim(),
});
const genericComputeGroup = ({source, ...rest}: WithFilename): WithGroup => ({
  ...rest,
  source,
  group: 'Generic',
});

// providers configs
// each provider object contains the following:
// - url: url of the file containing the SVG icons for the services
// - filter: a function taking the path of an SVG and returning a boolean
//           indicating whether the SVG icon should be used or not
// - prepare: a function taking the icon path as input and returning a Promise
//            resolving to an object containing all the necessary metadata,
//            e.g. source path, the svg content, the group name etc.
type ConfigOptions = {
  fetch: (string) => Promise<void>;
  filter: (string) => boolean;
  prepare: (string) => Promise<WithResizedContent>;
};

const config: Record<string, ConfigOptions> = {
  [AWS]: {
    fetch: (targetDir: string) =>
      fromRemoteZip(
        'https://d1.awsstatic.com/webteam/architecture-icons/Q32020/AWS-Architecture-Assets-For-Light-and-Dark-BG_20200911.478ff05b80f909792f7853b1a28de8e28eac67f4.zip',
        targetDir
      ),
    filter: (filepath: string) => !!filepath.match(/(64.*|Dark)\.svg$/i),
    prepare: (filepath: string) =>
      Promise.resolve({provider: AWS, source: filepath})
        .then(extractFilename)
        .then(awsComputeGroup)
        .then(replacePatterns(awsPatterns))
        .then(addTarget)
        .then(addImportName)
        .then(readContent)
        .then(resizeContent),
  },
  [Azure]: {
    fetch: targetDir =>
      fromRemoteZip('https://arch-center.azureedge.net/icons/Azure_Public_Service_Icons_V2.zip', targetDir).then(() =>
        copyFromDir(path.join(assetsOverrideDir, 'azure'), targetDir)
      ),
    filter: () => true, // keep all svg in downloaded assets
    prepare: filepath =>
      Promise.resolve({provider: Azure, source: filepath})
        .then(extractFilename)
        .then(azureComputeGroup)
        .then(replacePatterns(azurePatterns))
        .then(addTarget)
        .then(addImportName)
        .then(readContent)
        .then(resizeContent),
  },
  [K8s]: {
    fetch: targetDir => fromRemoteZip('https://github.com/kubernetes/community/archive/master.zip', targetDir),
    filter: filepath => filepath.match(/.*unlabeled\/.*\.svg$/i),
    prepare: filepath =>
      Promise.resolve({provider: K8s, source: filepath})
        .then(extractFilename)
        .then(k8sComputeGroup)
        .then(replacePatterns(k8sPatterns))
        .then(addTarget)
        .then(addImportName)
        .then(readContent)
        .then(resizeContent),
  },
  [GCP]: {
    fetch: targetDir =>
      fromRemoteZip('https://cloud.google.com/icons/files/google-cloud-icons.zip', targetDir).then(() =>
        copyFromDir(path.join(assetsOverrideDir, 'gcp'), targetDir)
      ),
    filter: filepath => filepath.match(/.*color\.svg$/i) && !filepath.includes('modifiers'),
    prepare: filepath =>
      Promise.resolve({provider: GCP, source: filepath})
        .then(extractFilename)
        .then(gcpComputeGroup)
        .then(replacePatterns(gcpPatterns))
        .then(addTarget)
        .then(addImportName)
        .then(readContent)
        .then(resizeContent),
  },
  [Generic]: {
    fetch: targetDir => copyFromDir(path.join(assetsOverrideDir, 'generic'), targetDir),
    filter: () => true, // keep all svg
    prepare: filepath =>
      Promise.resolve({provider: Generic, source: filepath})
        .then(extractFilename)
        .then(genericComputeGroup)
        .then(replacePatterns(genericPatterns))
        .then(addTarget)
        .then(addImportName)
        .then(readContent)
        .then(resizeContent),
  },
};

// define the entire processing pipeline for a provider
// it will download the provider file containing the SVGs onto a temporary directory
// extract the SVG icons, filter them, resize them if necessary, save them onto
// their final destination (src/images/<provider>/<service>.svg) and create the JS
// file used to import the icons in the app
const processProvider = ([provider, options]: [string, ConfigOptions]) => {
  const providerDir = path.join('.tmp', provider);

  const removeProviderDir = () => rmdir(providerDir);
  const createProviderDir = () => mkdir(providerDir);
  const fetchAssets = () => options.fetch(providerDir);
  const selectSVGs = () => glob.promise(`${providerDir}/**/*.svg`, {nodir: true});
  const filterRelevantFiles = (files: string[]) => files.filter(options.filter);
  const prepareAssets = (files: string[]) => Promise.all(files.map(options.prepare));
  const sortAssets = (assets: WithResizedContent[]) => assets.sort(compareAssets);
  const removeImagesDir = () => rmdir(imagesDir(provider));

  logger.info(`Producing assets for ${provider}`);
  return removeProviderDir()
    .then(createProviderDir)
    .then(fetchAssets)
    .then(removeImagesDir)
    .then(selectSVGs)
    .then(filterRelevantFiles)
    .then(prepareAssets)
    .then(removeDuplicateAssets)
    .then(sortAssets)
    .then(saveAssets)
    .then(renderJS(provider))
    .then(tap<WithResizedContent>(removeProviderDir))
    .then(tap<WithResizedContent>(() => logger.info(`Finished producing assets for ${provider}`)))
    .catch(err => logger.error(err));
};

// utility functions to render the documentation (src/resources_content.html) listing the
// available services and their groups after all the providers have been processed
const groupByProvider = (assets: WithImportPath[]) =>
  Object.entries(groupBy<WithImportPath>('provider')(assets)).map(([k, v]) => ({provider: k, assets: v}));
const groupByGroup = (assets: {provider: string; assets: WithImportPath[]}[]) =>
  assets.map(({provider, assets}) => ({
    name: provider,
    groups: Object.entries(groupBy<WithImportPath>('group')(assets)).map(([k, v]) => ({name: k, assets: v})),
  }));
const renderResourceDocs = providers => {
  const rendered = nunjucks.renderString(docsTemplate, {providers});
  return fs.promises.writeFile(resourceDocsFile, rendered);
};

// kick off the processing in parallel for each provider
Promise.all(Object.entries(config).map(processProvider))
  .then(assets => assets.flat())
  .then(groupByProvider)
  .then(groupByGroup)
  .then(renderResourceDocs)
  .catch(err => logger.error(err));
