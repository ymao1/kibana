/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */
const path = require('path');
const fs = require('fs');
const util = require('util');
const https = require('https');
const yaml = require('js-yaml');
const { exec: execCb } = require('child_process');
const { reduce } = require('lodash');

const readFile = util.promisify(fs.readFile);
const writeFile = util.promisify(fs.writeFile);
const deleteFile = util.promisify(fs.unlink);
const exec = util.promisify(execCb);

const ecsYmlUrlPrefix = `https://raw.githubusercontent.com/elastic/ecs/v8.5.2/generated/ecs/`;
const ecsYmlFilename = `ecs_flat.yml`;

const outputDir = path.join(__dirname, '../../alert_schema/field_maps');
const outputFieldMapFilename = path.join(outputDir, 'ecs_field_map.ts');

async function generate() {
  https.get(
    `${ecsYmlUrlPrefix}${ecsYmlFilename}`,
    (response) => {
      const filePath = fs.createWriteStream(ecsYmlFilename);
      response.pipe(filePath);
      filePath.on('finish', async () => {
        filePath.close();
        console.log(`Successfully downloaded ${ecsYmlUrlPrefix}${ecsYmlFilename}`);

        const flatYaml = await yaml.safeLoad(await readFile(ecsYmlFilename));

        const fields = reduce(
          flatYaml,
          (fieldsObj, value, key) => {
            const field = {
              type: value.type,
              array: value.normalize.includes('array'),
              required: !!value.required,
            };

            if (value.scaling_factor) {
              field.scaling_factor = value.scaling_factor;
            }

            if (value.ignore_above) {
              field.ignore_above = value.ignore_above;
            }

            if (null != value.doc_values) {
              field.doc_values = value.doc_values;
            }

            if (null != value.index) {
              field.index = value.index;
            }

            if (value.multi_fields) {
              field.multi_fields = value.multi_fields;
            }

            fieldsObj[key] = field;

            return fieldsObj;
          },
          {}
        );

        await Promise.all([
          writeFile(
            outputFieldMapFilename,
            `
      /* This file is generated by x-pack/plugins/alerting/common/alert_schema/scripts/generate_ecs_fieldmap.js,
      do not manually edit
      */

          export const ecsFieldMap = ${JSON.stringify(fields, null, 2)}

          export type EcsFieldMap = typeof ecsFieldMap;
          `,
            { encoding: 'utf-8' }
          ).then(() => {
            return exec(`node scripts/eslint --fix ${outputFieldMapFilename}`);
          }),
        ]);

        console.log(`Successfully generated fieldmap at ${outputFieldMapFilename}`);

        await deleteFile(ecsYmlFilename);
      });
    },
    (err) => {
      console.log(`Error downloading ${ecsYmlUrlPrefix}${ecsYmlFilename} - ${err.message}`);
      process.exit(1);
    }
  );
}

generate().catch((err) => {
  console.log(err);
  process.exit(1);
});
