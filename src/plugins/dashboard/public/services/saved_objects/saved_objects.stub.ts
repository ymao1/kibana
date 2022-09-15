/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0 and the Server Side Public License, v 1; you may not use this file except
 * in compliance with, at your election, the Elastic License 2.0 or the Server
 * Side Public License, v 1.
 */

import { savedObjectsServiceMock } from '@kbn/core-saved-objects-browser-mocks';
import { PluginServiceFactory } from '@kbn/presentation-util-plugin/public';
import { DashboardSavedObjectsService } from './types';

type SavedObjectsServiceFactory = PluginServiceFactory<DashboardSavedObjectsService>;

export const savedObjectsServiceFactory: SavedObjectsServiceFactory = () => {
  const pluginMock = savedObjectsServiceMock.createStartContract();

  return {
    client: pluginMock.client,
  };
};
