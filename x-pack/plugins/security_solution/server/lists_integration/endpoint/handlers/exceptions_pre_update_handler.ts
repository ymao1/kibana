/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import {
  ExceptionsListPreUpdateItemServerExtension,
  UpdateExceptionListItemOptions,
} from '../../../../../lists/server';
import { EndpointAppContextService } from '../../../endpoint/endpoint_app_context_services';
import {
  EventFilterValidator,
  TrustedAppValidator,
  HostIsolationExceptionsValidator,
} from '../validators';

type ValidatorCallback = ExceptionsListPreUpdateItemServerExtension['callback'];
export const getExceptionsPreUpdateItemHandler = (
  endpointAppContextService: EndpointAppContextService
): ValidatorCallback => {
  return async function ({
    data,
    context: { request, exceptionListClient },
  }): Promise<UpdateExceptionListItemOptions> {
    if (data.namespaceType !== 'agnostic') {
      return data;
    }

    const currentSavedItem = await exceptionListClient.getExceptionListItem({
      id: data.id,
      itemId: data.itemId,
      namespaceType: data.namespaceType,
    });

    // We don't want to `throw` here because we don't know for sure that the item is one we care about.
    // So we just return the data and the Lists plugin will likely error out because it can't find the item
    if (!currentSavedItem) {
      return data;
    }

    const listId = currentSavedItem.list_id;

    // Validate Trusted Applications
    if (TrustedAppValidator.isTrustedApp({ listId })) {
      return new TrustedAppValidator(endpointAppContextService, request).validatePreUpdateItem(
        data,
        currentSavedItem
      );
    }

    // Validate Event Filters
    if (EventFilterValidator.isEventFilter({ listId })) {
      return new EventFilterValidator(endpointAppContextService, request).validatePreUpdateItem(
        data,
        currentSavedItem
      );
    }

    // Validate host isolation
    if (HostIsolationExceptionsValidator.isHostIsolationException({ listId })) {
      return new HostIsolationExceptionsValidator(
        endpointAppContextService,
        request
      ).validatePreUpdateItem(data);
    }

    return data;
  };
};
