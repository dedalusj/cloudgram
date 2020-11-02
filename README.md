# CloudGram

[![License](https://img.shields.io/badge/License-Apache%202.0-blue.svg)](https://opensource.org/licenses/Apache-2.0)
[![Test](https://github.com/dedalusj/cloudgram/workflows/Test/badge.svg?branch=main)](https://github.com/dedalusj/cloudgram/actions)

CloudGram lets you generate diagrams for your cloud architecture directly in your browser using code in a syntax similar to the [DOT language](https://graphviz.org/doc/info/lang.html) and familiar to [GraphViz](https://graphviz.org/) users.

To start using CloudGram navigate to [https://cloudgram.dedalusone.com](https://cloudgram.dedalusone.com) and follow the examples and online editor to experiment visualizing your architecture.

### Development

#### Pre-requisites

- [Node](https://nodejs.org/en/) 14+
- [Yarn](https://yarnpkg.com)

#### Bootstrap

Upon cloning the project install the dependencies with `yarn install`. Beside install the project dependencies this will also install git hooks that will run tests and linting on every commit.

#### Running

Use the `yarn run dev` command to launch a dev server that will also watch for files changes and recompile if necessary. The app will be accessible at [http://localhost:1234/](http://localhost:1234/).

#### Deployment

Use `yarn run build` to build the minified production assets and build.

The [infra](infra) directory contains an example CloudFormation template to set up an S3 bucket, and a CloudFront distribution to serve CloudGram via CDN.

#### Regenerating service icons

The command `yarn run assets` can be used to automatically regenerate the SVG and JS files for the service icons for the supported providers. The command runs the [scripts/assets,js](scripts/assets.js) node script. Currently, the script will always regenerate the icons for all providers hence no command line options are supported.

#### Regenerating grammar diagram

To regenerate the grammar diagram HTML, the [src/grammar_diagram.html](src/grammar_diagram.html) file, use the `yarn run diagram` command. This command is also run automatically at commit time via git hooks.

### Related projects

CloudGram is inspired by the [diagrams](https://github.com/mingrammer/diagrams) project.
