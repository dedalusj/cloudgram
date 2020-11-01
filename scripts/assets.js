#!/usr/bin/env node

import fs from 'fs';
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
  prettyPrint: {
    colorize: true,
    translateTime: true,
    ignore: 'pid,hostname',
  },
});

const __filename = url.fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const parser = new xml2js.Parser();
const builder = new xml2js.Builder();
const providerJsTemplate = fs.readFileSync(path.join(__dirname, 'provider.js.njk')).toString();
const docsTemplate = fs.readFileSync(path.join(__dirname, 'resources_content.html.njk')).toString();

const imagesDir = provider => path.join(__dirname, '..', 'src', 'images', provider);
const renderJSFile = provider => path.join(__dirname, '..', 'src', 'js', 'icons', `${provider}.js`);
const resourceDocsFile = path.join(__dirname, '..', 'src', 'resources_content.html');

const tap = fn => data => {
  fn(data);
  return data;
};
const groupBy = key => objs =>
  objs.reduce(
    (acc, o) => ({
      ...acc,
      [o[key]]: [...(acc[o[key]] || []), o],
    }),
    {}
  );
const getParent = (f, level = 1) => path.dirname(f).split(path.sep).slice(-level)[0];
const basename = filepath => path.basename(filepath, path.extname(filepath));
const sanitize = s => s.replace(/[^a-zA-Z0-9_$-]/g, '').replace(/-+/, '-');

const mkdir = async dir => {
  if (!fs.existsSync(dir)) return fs.promises.mkdir(dir, {recursive: true});
};

const rmdir = async dir => fs.promises.rmdir(dir, {recursive: true, maxRetries: 10});

const downloadFile = async url => {
  const outputFile = tmp.tmpNameSync({});
  const writer = fs.createWriteStream(outputFile);

  const response = await axios({
    url,
    method: 'GET',
    responseType: 'stream',
  });

  response.data.pipe(writer);

  return new Promise((resolve, reject) => {
    writer.on('finish', _ => resolve(outputFile));
    writer.on('error', reject);
  });
};

const unzipFile = async (sourceFile, outputDir) => {
  const w = fs.createReadStream(sourceFile).pipe(unzipper.Extract({path: outputDir}));
  return new Promise((resolve, reject) => {
    w.on('finish', resolve);
    w.on('error', reject);
  });
};

const extractFilename = ({source, ...rest}) => ({...rest, source, filename: path.basename(source).toLowerCase()});
const replacePatterns = patterns => ({filename, ...rest}) => ({
  ...rest,
  filename: patterns.length
    ? patterns.reduce((acc, [pattern, replacement]) => acc.replace(pattern, replacement), filename)
    : filename,
});
const addTarget = ({provider, filename, ...rest}) => ({
  ...rest,
  filename,
  provider,
  target: path.join(imagesDir(provider), filename),
});
const addImportName = ({filename, ...rest}) => ({
  ...rest,
  filename,
  importName: camelCase(sanitize(basename(filename))),
});
const readContent = async ({source, ...rest}) =>
  fs.promises.readFile(source).then(s => ({
    ...rest,
    source,
    originalContent: s.toString(),
  }));
const resizeContent = async ({originalContent, ...rest}) =>
  parser
    .parseStringPromise(originalContent)
    .then(({svg: {$: attr, ...svgRest}, ...topRest}) => ({
      ...topRest,
      svg: {...svgRest, $: {...attr, width: '80px', height: '80px'}},
    }))
    .then(o => builder.buildObject(o))
    .then(resizedContent => ({...rest, originalContent, resizedContent}));
const removeDuplicateAssets = assets =>
  assets.filter((v, i, a) => a.findIndex(t => t.importName === v.importName) === i);
const compareAssets = ({importName: n1}, {importName: n2}) => (n1 < n2 ? -1 : n2 > n1 ? 1 : 0);

const saveAssets = async assets =>
  Promise.all(
    assets.map(({target, resizedContent, ...rest}) =>
      mkdir(path.dirname(target))
        .then(_ => fs.promises.writeFile(target, resizedContent))
        .then(_ => ({...rest, target, resizedContent}))
    )
  );

const renderJS = provider => async assets => {
  const toRender = assets.map(({target, ...rest}) => ({
    ...rest,
    target,
    importPath: path.relative(path.dirname(renderJSFile(provider)), target),
  }));
  const rendered = nunjucks.renderString(providerJsTemplate, {assets: toRender});
  return fs.promises.writeFile(renderJSFile(provider), rendered).then(_ => toRender);
};

const AWS = 'aws';
const Azure = 'azure';
const K8s = 'k8s';

// order is important in the following
const awsPatterns = [
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
const azurePatterns = [
  [/^[0-9]+-icon-service-/i, ''],
  [/^azure-/i, ''],
  [/ /, '-'],
  [/machinesazurearc/, 'machines-azure-arc'],
];
const k8sPatterns = [];

// extract groups from paths
const awsExtractGroup = ({source, ...rest}) => ({
  ...rest,
  source,
  group: getParent(source, 2)
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
const azureExtractGroup = ({source, ...rest}) => ({
  ...rest,
  source,
  group: getParent(source)
    .toLocaleLowerCase()
    .trim()
    .replace(/\+/g, 'and')
    .replace('iot', 'Internet of things')
    .replace(/^\w/, c => c.toUpperCase()),
});
const k8sExtractGroup = ({source, ...rest}) => ({
  ...rest,
  source,
  group: 'Generic', // no group information available in k8s
});

const config = {
  [AWS]: {
    url:
      'https://d1.awsstatic.com/webteam/architecture-icons/Q32020/AWS-Architecture-Assets-For-Light-and-Dark-BG_20200911.478ff05b80f909792f7853b1a28de8e28eac67f4.zip',
    filter: filepath => filepath.match(/(64.*|Dark)\.svg$/i),
    prepare: filepath =>
      Promise.resolve({provider: AWS, source: filepath})
        .then(extractFilename)
        .then(awsExtractGroup)
        .then(replacePatterns(awsPatterns))
        .then(addTarget)
        .then(addImportName)
        .then(readContent)
        .then(resizeContent),
  },
  [Azure]: {
    url: 'https://arch-center.azureedge.net/icons/Azure_Public_Service_Icons_V2.zip',
    filter: _ => true, // keep all svg in downloaded assets
    prepare: filepath =>
      Promise.resolve({provider: Azure, source: filepath})
        .then(extractFilename)
        .then(azureExtractGroup)
        .then(replacePatterns(azurePatterns))
        .then(addTarget)
        .then(addImportName)
        .then(readContent)
        .then(resizeContent),
  },
  [K8s]: {
    url: 'https://github.com/kubernetes/community/archive/master.zip',
    filter: filepath => filepath.match(/.*unlabeled\/.*\.svg$/i),
    prepare: filepath =>
      Promise.resolve({provider: K8s, source: filepath})
        .then(extractFilename)
        .then(k8sExtractGroup)
        .then(replacePatterns(k8sPatterns))
        .then(addTarget)
        .then(addImportName)
        .then(readContent)
        .then(resizeContent),
  },
};

const processProvider = ([provider, options]) => {
  const providerDir = path.join('.tmp', provider);

  const removeProviderDir = _ => rmdir(providerDir);
  const createProviderDir = _ => mkdir(providerDir);
  const downloadAssets = _ => downloadFile(options.url);
  const extractAssets = downloadedFile => unzipFile(downloadedFile, providerDir);
  const selectSVGs = _ => glob.promise(`${providerDir}/**/*.svg`, {nodir: true});
  const filterRelevantFiles = files => files.filter(options.filter);
  const prepareAssets = files => Promise.all(files.map(options.prepare));
  const sort = assets => assets.sort(compareAssets);
  const removeImagesDir = _ => rmdir(imagesDir(provider));

  logger.info(`Producing assets for ${provider}`);
  return removeProviderDir()
    .then(createProviderDir)
    .then(downloadAssets)
    .then(extractAssets)
    .then(removeImagesDir)
    .then(selectSVGs)
    .then(filterRelevantFiles)
    .then(prepareAssets)
    .then(removeDuplicateAssets)
    .then(sort)
    .then(saveAssets)
    .then(renderJS(provider))
    .then(tap(removeProviderDir))
    .then(tap(_ => logger.info(`Finished producing assets for ${provider}`)))
    .catch(err => logger.error(err));
};

const keepRelevantProps = assets => assets.map(({provider, group, importName}) => ({provider, group, importName}));
const groupByProvider = assets =>
  Object.entries(groupBy('provider')(assets)).map(([k, v]) => ({provider: k, assets: v}));
const groupByGroup = assets =>
  assets.map(({provider, assets}) => ({
    name: provider,
    groups: Object.entries(groupBy('group')(assets)).map(([k, v]) => ({name: k, assets: v})),
  }));
const renderResourceDocs = providers => {
  const rendered = nunjucks.renderString(docsTemplate, {providers});
  return fs.promises.writeFile(resourceDocsFile, rendered);
};

Promise.all(Object.entries(config).map(processProvider))
  .then(assets => assets.flat())
  .then(keepRelevantProps)
  .then(groupByProvider)
  .then(groupByGroup)
  .then(renderResourceDocs)
  .catch(err => logger.error(err));
