#!/usr/bin/env node

import fs from 'fs';
import path from 'path';

import axios from 'axios';
import camelCase from 'camelcase';
import glob from 'glob';
import mustache from 'mustache';
import pino from 'pino';
import unzipper from 'unzipper';

const logger = pino({
  prettyPrint: {
    colorize: true,
    translateTime: true,
    ignore: 'pid,hostname',
  },
});

const assetsUrl = require('./assets.config.json');

const mkdir = async dir => {
  if (!fs.existsSync(dir)) return fs.promises.mkdir(dir, {recursive: true});
};

const rmdir = async dir => fs.promises.rmdir(dir, {recursive: true, maxRetries: 10});

const downloadFile = async (url, outputFile) => {
  const writer = fs.createWriteStream(outputFile);

  const response = await axios({
    url,
    method: 'GET',
    responseType: 'stream',
  });

  response.data.pipe(writer);

  return new Promise((resolve, reject) => {
    writer.on('finish', resolve);
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

const copyFiles = async (sourcePattern, outputDir) => {
  await mkdir(outputDir);
  const files = glob.sync(sourcePattern, {nodir: true}).map(f => [f, path.join(outputDir, path.basename(f))]);
  return Promise.all(files.map(([src, dest]) => fs.promises.copyFile(src, dest)));
};

const renameFiles = async (sourceDir, pattern, outputDir) => {
  await mkdir(outputDir);
  const files = glob
    .sync(`${sourceDir}/*`)
    .map(f => [f, path.basename(f)])
    .map(([src, basename]) => [src, basename.match(pattern).slice(1, 3).join('')]) // TODO: watch out for matches
    .map(([src, renamed]) => [src, renamed.toLowerCase()])
    .map(([src, filename]) => [src, path.join(outputDir, filename)]);
  return Promise.all(files.map(([src, dest]) => fs.promises.copyFile(src, dest)));
};

const basename = filepath => path.basename(filepath, path.extname(filepath));
const sanitize = s => s.replace(/[^a-zA-Z0-9_$-]/g, '').replace(/-+/, '-');
const importName = filepath => camelCase(sanitize(basename(filepath)));

const renderJS = async (sourceDir, outputFile) => {
  const files = glob
    .sync(`${sourceDir}/*`)
    .map(f => path.relative(path.dirname(outputFile), f))
    .map(f => ({filepath: f, name: importName(f)}));
  const template = fs.readFileSync(path.join(__dirname, 'assets.mustache')).toString();
  const rendered = mustache.render(template, {assets: files});
  return fs.promises.writeFile(outputFile, rendered);
};

for (const [provider, {url, copyPattern, renamePattern}] of Object.entries(assetsUrl)) {
  const rootMsg = `Provider: ${provider} - `;
  const providerDir = path.join('.tmp', provider);
  const downloadedFile = path.join(providerDir, 'downloaded');
  const extractDir = path.join(providerDir, 'extract');
  const copiedDir = path.join(providerDir, 'copy');
  const renamedDir = path.join(providerDir, 'rename');

  const finalDir = path.join(__dirname, '..', 'src', 'images', provider);
  const renderedJS = path.join(__dirname, '..', 'src', 'js', 'icons', `${provider}.js`);

  rmdir(providerDir) // clean up old stale assets
    .then(_ => mkdir(providerDir))
    .then(_ => logger.info(`${rootMsg}Downloading assets`))
    .then(_ => downloadFile(url, downloadedFile))
    .then(_ => logger.info(`${rootMsg}Downloaded assets to ${downloadedFile}`))
    .then(_ => unzipFile(downloadedFile, extractDir))
    .then(_ => logger.info(`${rootMsg}Unzipped content to ${extractDir}`))
    .then(_ => copyFiles(`${extractDir}/${copyPattern || '**/*.svg'}`, copiedDir))
    .then(_ => logger.info(`${rootMsg}Copied files to ${copiedDir}`))
    .then(_ => renameFiles(copiedDir, renamePattern, renamedDir))
    .then(_ => logger.info(`${rootMsg}Renamed files to ${renamedDir}`))
    .then(_ => copyFiles(`${renamedDir}/*`, finalDir))
    .then(_ => logger.info(`${rootMsg}Copied files to final location ${finalDir}`))
    .then(_ => renderJS(finalDir, renderedJS))
    .then(_ => logger.info(`${rootMsg}Rendered javascript to ${renderedJS}`))
    .then(_ => rmdir(providerDir))
    .then(_ => logger.info(`${rootMsg}Deleted temporary content from ${providerDir}`))
    .catch(err => logger.error(err));
}
