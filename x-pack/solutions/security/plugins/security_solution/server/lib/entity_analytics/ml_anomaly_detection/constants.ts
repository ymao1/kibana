/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

export const ML_AD_JOB_ENTITY_TYPES = ['user', 'host'] as const;

// Window of anomaly records to inspect.
export const ML_AD_LOOKBACK = '30d';

// Safety check to prevent infinite loops in full-scan iteration.
export const MAX_ALLOWED_ITERS = 10000;

// Page size for paginating anomaly search results in full-scan mode.
export const ANOMALY_SEARCH_PAGE_SIZE = 1000;
