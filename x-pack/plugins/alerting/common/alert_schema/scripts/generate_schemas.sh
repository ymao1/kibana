#!/usr/bin/env bash

# Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
# or more contributor license agreements. Licensed under the Elastic License
# 2.0; you may not use this file except in compliance with the Elastic License
# 2.0.

echo --- Generating ECS field map from template

node x-pack/plugins/alerting/common/alert_schema/scripts/generate_ecs_fieldmap.js

echo --- Generating Alert and ECS schemas from template

npx -q ts-node x-pack/plugins/alerting/common/alert_schema/scripts/create_schema_from_mapping.ts
