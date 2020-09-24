/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License;
 * you may not use this file except in compliance with the Elastic License.
 */

import { AuditEventDecorator, AuditEvent } from '../../../../../src/core/server';

export interface SavedObjectEventArgs {
  action: string;
  object?: AuditEvent['object'];
  error?: Error;
}

export const savedObjectCreateEvent: AuditEventDecorator<SavedObjectEventArgs> = (
  event,
  { action, object, error }
) => {
  const doc = object ? `saved object '${object.id}' of type '${object.type}'` : `saved objects`;

  return {
    message: error
      ? `Failed attempt to create ${doc} by user '${event.user.name}'`
      : `User '${event.user.name}' is creating ${doc}`,
    event: {
      action,
      category: 'database',
      type: 'creation',
      outcome: error ? 'failure' : 'unknown',
    },
    object: object && {
      type: object.type,
      id: object.id,
      additional_details: object.additional_details,
    },
    error: error
      ? {
          code: error.name,
          message: error.message,
        }
      : undefined,
    ...event,
  };
};

export const savedObjectReadEvent: AuditEventDecorator<SavedObjectEventArgs> = (
  event,
  { action, object, error }
) => {
  const doc = object ? `saved object '${object.id}' of type '${object.type}'` : `saved objects`;

  return {
    message: error
      ? `Failed attempt to access ${doc} by user '${event.user.name}'`
      : `User '${event.user.name}' accessed ${doc}`,
    event: {
      action,
      category: 'database',
      type: 'access',
      outcome: error ? 'failure' : 'success',
    },
    object: object && {
      type: object.type,
      id: object.id,
      additional_details: object.additional_details,
    },
    error: error
      ? {
          code: error.name,
          message: error.message,
        }
      : undefined,
    ...event,
  };
};

export const savedObjectUpdateEvent: AuditEventDecorator<SavedObjectEventArgs> = (
  event,
  { action, object, error }
) => {
  const doc = object ? `saved object '${object.id}' of type '${object.type}'` : `saved objects`;

  return {
    message: error
      ? `Failed attempt to update ${doc} by user '${event.user.name}'`
      : `User '${event.user.name}' is updating ${doc}`,
    event: {
      action,
      category: 'database',
      type: 'change',
      outcome: error ? 'failure' : 'unknown',
    },
    object: object && {
      type: object.type,
      id: object.id,
      additional_details: object.additional_details,
    },
    error: error
      ? {
          code: error.name,
          message: error.message,
        }
      : undefined,
    ...event,
  };
};

export const savedObjectDeleteEvent: AuditEventDecorator<SavedObjectEventArgs> = (
  event,
  { action, object, error }
) => {
  const doc = object ? `saved object '${object.id}' of type '${object.type}'` : `saved objects`;

  return {
    message: error
      ? `Failed attempt to delete ${doc} by user '${event.user.name}'`
      : `User '${event.user.name}' is deleting ${doc}`,
    event: {
      action,
      category: 'database',
      type: 'deletion',
      outcome: error ? 'failure' : 'unknown',
    },
    object: object && {
      type: object.type,
      id: object.id,
      additional_details: object.additional_details,
    },
    error: error
      ? {
          code: error.name,
          message: error.message,
        }
      : undefined,
    ...event,
  };
};
