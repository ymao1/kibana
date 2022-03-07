/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0 and the Server Side Public License, v 1; you may not use this file except
 * in compliance with, at your election, the Elastic License 2.0 or the Server
 * Side Public License, v 1.
 */

import Fsp from 'fs/promises';
import Path from 'path';

import { run } from './lib/run';
import { parseBazelCliConfig } from './lib/bazel_cli_config';

import { summarizePackage } from './summarize_package';
import { runApiExtractor } from './run_api_extractor';

const HELP = `
Script called from bazel to create the summarized version of a package. When called by Bazel
config is passed as a JSON encoded object.

When called via "node scripts/build_type_summarizer_output" pass a path to a package and that
package's types will be read from node_modules and written to data/type-summarizer-output.

`;

run(
  async ({ argv, log }) => {
    log.debug('cwd:', process.cwd());
    log.debug('argv', process.argv);

    const config = parseBazelCliConfig(argv);
    await Fsp.mkdir(config.outputDir, { recursive: true });

    // generate pkg json output
    await Fsp.writeFile(
      Path.resolve(config.outputDir, 'package.json'),
      JSON.stringify(
        {
          name: `@types/${config.packageName.replaceAll('@', '').replaceAll('/', '__')}`,
          description: 'Generated by @kbn/type-summarizer',
          types: './index.d.ts',
          private: true,
          license: 'MIT',
          version: '1.1.0',
        },
        null,
        2
      )
    );

    if (config.use === 'type-summarizer') {
      await summarizePackage(log, {
        dtsDir: Path.dirname(config.inputPath),
        inputPaths: [config.inputPath],
        outputDir: config.outputDir,
        tsconfigPath: config.tsconfigPath,
        repoRelativePackageDir: config.repoRelativePackageDir,
      });
      log.success('type summary created for', config.repoRelativePackageDir);
    } else {
      await runApiExtractor(
        config.tsconfigPath,
        config.inputPath,
        Path.resolve(config.outputDir, 'index.d.ts')
      );
    }
  },
  {
    helpText: HELP,
    defaultLogLevel: 'quiet',
  }
);
