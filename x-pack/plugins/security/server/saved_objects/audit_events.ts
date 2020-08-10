/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License;
 * you may not use this file except in compliance with the Elastic License.
 */

import { AuditEventDecorator } from '../../../../../src/core/server';

export interface SavedObjectEventArgs {
  action: string;
  objects: Array<{
    type: string;
    id?: string;
    namespaces?: string[];
  }>;
  error?: Error;
}

export const savedObjectCreateEvent: AuditEventDecorator<SavedObjectEventArgs> = (
  event,
  { action, objects, error }
) => {
  const doc =
    objects.length === 1
      ? `saved object '${objects[0].id}' of type '${objects[0].type}'`
      : `${objects.length} saved objects`;

  return {
    ...event,
    message: error
      ? `Failed attempt to create ${doc} by user '${event.user.name}'`
      : `User '${event.user.name}' created ${doc}`,
    event: {
      action,
      category: 'database',
      type: 'creation',
      outcome: error ? 'failure' : 'success',
    },
    error: error
      ? {
          code: error.name,
          message: error.message,
        }
      : undefined,
    kibana: {
      saved_objects: objects.map(({ type, id, namespaces }) => ({ type, id, namespaces })),
    },
  };
};

export const savedObjectReadEvent: AuditEventDecorator<SavedObjectEventArgs> = (
  event,
  { action, objects, error }
) => {
  const doc =
    objects.length === 1
      ? `saved object '${objects[0].id}' of type '${objects[0].type}'`
      : `${objects.length} saved objects`;

  return {
    ...event,
    message: error
      ? `Failed attempt to access ${doc} by user '${event.user.name}'`
      : `User '${event.user.name}' accessed ${doc}`,
    event: {
      action,
      category: 'database',
      type: 'access',
      outcome: error ? 'failure' : 'success',
    },
    error: error
      ? {
          code: error.name,
          message: error.message,
        }
      : undefined,
    kibana: {
      saved_objects: objects.map(({ type, id, namespaces }) => ({ type, id, namespaces })),
    },
  };
};

export const savedObjectUpdateEvent: AuditEventDecorator<SavedObjectEventArgs> = (
  event,
  { action, objects, error }
) => {
  const doc =
    objects.length === 1
      ? `saved object '${objects[0].id}' of type '${objects[0].type}'`
      : `${objects.length} saved objects`;

  return {
    ...event,
    message: error
      ? `Failed attempt to change ${doc} by user '${event.user.name}'`
      : `User '${event.user.name}' changed ${doc}`,
    event: {
      action,
      category: 'database',
      type: 'change',
      outcome: error ? 'failure' : 'success',
    },
    error: error
      ? {
          code: error.name,
          message: error.message,
        }
      : undefined,
    kibana: {
      saved_objects: objects.map(({ type, id, namespaces }) => ({ type, id, namespaces })),
    },
  };
};

export const savedObjectDeleteEvent: AuditEventDecorator<SavedObjectEventArgs> = (
  event,
  { action, objects, error }
) => {
  const doc =
    objects.length === 1
      ? `saved object '${objects[0].id}' of type '${objects[0].type}'`
      : `${objects.length} saved objects`;

  return {
    ...event,
    message: error
      ? `Failed attempt to delete ${doc} by user '${event.user.name}'`
      : `User '${event.user.name}' deleted ${doc}`,
    event: {
      action,
      category: 'database',
      type: 'deletion',
      outcome: error ? 'failure' : 'success',
    },
    error: error
      ? {
          code: error.name,
          message: error.message,
        }
      : undefined,
    kibana: {
      saved_objects: objects.map(({ type, id, namespaces }) => ({ type, id, namespaces })),
    },
  };
};
