/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License;
 * you may not use this file except in compliance with the Elastic License.
 */

import {
  savedObjectCreateEvent,
  savedObjectDeleteEvent,
  savedObjectReadEvent,
  savedObjectUpdateEvent,
} from './audit_events';
import { AuditEvent } from '../../../../../src/core/server';

const baseEvent: Pick<AuditEvent, 'user' | 'trace' | 'kibana'> = {
  user: { name: 'USER_NAME' },
  trace: { id: 'TRACE_ID' },
  kibana: { space_id: 'SPACE_ID' },
};

describe('#savedObjectCreateEvent', () => {
  test(`creates audit event with creation details`, () => {
    expect(
      savedObjectCreateEvent(baseEvent, {
        action: 'ACTION',
        object: { type: 'SAVED_OBJECT_TYPE', id: 'SAVED_OBJECT_ID' },
      })
    ).toMatchInlineSnapshot(`
      Object {
        "error": undefined,
        "event": Object {
          "action": "ACTION",
          "category": "database",
          "outcome": "unknown",
          "type": "creation",
        },
        "kibana": Object {
          "space_id": "SPACE_ID",
        },
        "message": "User 'USER_NAME' is creating saved object 'SAVED_OBJECT_ID' of type 'SAVED_OBJECT_TYPE'",
        "object": Object {
          "additional_details": undefined,
          "id": "SAVED_OBJECT_ID",
          "type": "SAVED_OBJECT_TYPE",
        },
        "trace": Object {
          "id": "TRACE_ID",
        },
        "user": Object {
          "name": "USER_NAME",
        },
      }
    `);
  });

  test(`creates audit event with error message`, () => {
    expect(
      savedObjectCreateEvent(baseEvent, {
        action: 'ACTION',
        object: { type: 'SAVED_OBJECT_TYPE', id: 'SAVED_OBJECT_ID' },
        error: new Error('ERROR_MESSAGE'),
      })
    ).toMatchInlineSnapshot(`
      Object {
        "error": Object {
          "code": "Error",
          "message": "ERROR_MESSAGE",
        },
        "event": Object {
          "action": "ACTION",
          "category": "database",
          "outcome": "failure",
          "type": "creation",
        },
        "kibana": Object {
          "space_id": "SPACE_ID",
        },
        "message": "Failed attempt to create saved object 'SAVED_OBJECT_ID' of type 'SAVED_OBJECT_TYPE' by user 'USER_NAME'",
        "object": Object {
          "additional_details": undefined,
          "id": "SAVED_OBJECT_ID",
          "type": "SAVED_OBJECT_TYPE",
        },
        "trace": Object {
          "id": "TRACE_ID",
        },
        "user": Object {
          "name": "USER_NAME",
        },
      }
    `);
  });
});

describe('#savedObjectDeleteEvent', () => {
  test(`creates audit event with deletion details`, () => {
    expect(
      savedObjectDeleteEvent(baseEvent, {
        action: 'ACTION',
        object: { type: 'SAVED_OBJECT_TYPE', id: 'SAVED_OBJECT_ID' },
      })
    ).toMatchInlineSnapshot(`
      Object {
        "error": undefined,
        "event": Object {
          "action": "ACTION",
          "category": "database",
          "outcome": "unknown",
          "type": "deletion",
        },
        "kibana": Object {
          "space_id": "SPACE_ID",
        },
        "message": "User 'USER_NAME' is deleting saved object 'SAVED_OBJECT_ID' of type 'SAVED_OBJECT_TYPE'",
        "object": Object {
          "additional_details": undefined,
          "id": "SAVED_OBJECT_ID",
          "type": "SAVED_OBJECT_TYPE",
        },
        "trace": Object {
          "id": "TRACE_ID",
        },
        "user": Object {
          "name": "USER_NAME",
        },
      }
    `);
  });

  test(`creates audit event with error message`, () => {
    expect(
      savedObjectDeleteEvent(baseEvent, {
        action: 'ACTION',
        object: { type: 'SAVED_OBJECT_TYPE', id: 'SAVED_OBJECT_ID' },
        error: new Error('ERROR_MESSAGE'),
      })
    ).toMatchInlineSnapshot(`
      Object {
        "error": Object {
          "code": "Error",
          "message": "ERROR_MESSAGE",
        },
        "event": Object {
          "action": "ACTION",
          "category": "database",
          "outcome": "failure",
          "type": "deletion",
        },
        "kibana": Object {
          "space_id": "SPACE_ID",
        },
        "message": "Failed attempt to delete saved object 'SAVED_OBJECT_ID' of type 'SAVED_OBJECT_TYPE' by user 'USER_NAME'",
        "object": Object {
          "additional_details": undefined,
          "id": "SAVED_OBJECT_ID",
          "type": "SAVED_OBJECT_TYPE",
        },
        "trace": Object {
          "id": "TRACE_ID",
        },
        "user": Object {
          "name": "USER_NAME",
        },
      }
    `);
  });
});

describe('#savedObjectReadEvent', () => {
  test(`creates audit event with access details`, () => {
    expect(
      savedObjectReadEvent(baseEvent, {
        action: 'ACTION',
        object: { type: 'SAVED_OBJECT_TYPE', id: 'SAVED_OBJECT_ID' },
      })
    ).toMatchInlineSnapshot(`
      Object {
        "error": undefined,
        "event": Object {
          "action": "ACTION",
          "category": "database",
          "outcome": "success",
          "type": "access",
        },
        "kibana": Object {
          "space_id": "SPACE_ID",
        },
        "message": "User 'USER_NAME' accessed saved object 'SAVED_OBJECT_ID' of type 'SAVED_OBJECT_TYPE'",
        "object": Object {
          "additional_details": undefined,
          "id": "SAVED_OBJECT_ID",
          "type": "SAVED_OBJECT_TYPE",
        },
        "trace": Object {
          "id": "TRACE_ID",
        },
        "user": Object {
          "name": "USER_NAME",
        },
      }
    `);
  });

  test(`creates audit event with error message`, () => {
    expect(
      savedObjectReadEvent(baseEvent, {
        action: 'ACTION',
        object: { type: 'SAVED_OBJECT_TYPE', id: 'SAVED_OBJECT_ID' },
        error: new Error('ERROR_MESSAGE'),
      })
    ).toMatchInlineSnapshot(`
      Object {
        "error": Object {
          "code": "Error",
          "message": "ERROR_MESSAGE",
        },
        "event": Object {
          "action": "ACTION",
          "category": "database",
          "outcome": "failure",
          "type": "access",
        },
        "kibana": Object {
          "space_id": "SPACE_ID",
        },
        "message": "Failed attempt to access saved object 'SAVED_OBJECT_ID' of type 'SAVED_OBJECT_TYPE' by user 'USER_NAME'",
        "object": Object {
          "additional_details": undefined,
          "id": "SAVED_OBJECT_ID",
          "type": "SAVED_OBJECT_TYPE",
        },
        "trace": Object {
          "id": "TRACE_ID",
        },
        "user": Object {
          "name": "USER_NAME",
        },
      }
    `);
  });
});

describe('#savedObjectUpdateEvent', () => {
  test(`creates audit event with update details`, () => {
    expect(
      savedObjectUpdateEvent(baseEvent, {
        action: 'ACTION',
        object: { type: 'SAVED_OBJECT_TYPE', id: 'SAVED_OBJECT_ID' },
      })
    ).toMatchInlineSnapshot(`
      Object {
        "error": undefined,
        "event": Object {
          "action": "ACTION",
          "category": "database",
          "outcome": "unknown",
          "type": "change",
        },
        "kibana": Object {
          "space_id": "SPACE_ID",
        },
        "message": "User 'USER_NAME' is updating saved object 'SAVED_OBJECT_ID' of type 'SAVED_OBJECT_TYPE'",
        "object": Object {
          "additional_details": undefined,
          "id": "SAVED_OBJECT_ID",
          "type": "SAVED_OBJECT_TYPE",
        },
        "trace": Object {
          "id": "TRACE_ID",
        },
        "user": Object {
          "name": "USER_NAME",
        },
      }
    `);
  });

  test(`creates audit event with error message`, () => {
    expect(
      savedObjectUpdateEvent(baseEvent, {
        action: 'ACTION',
        object: { type: 'SAVED_OBJECT_TYPE', id: 'SAVED_OBJECT_ID' },
        error: new Error('ERROR_MESSAGE'),
      })
    ).toMatchInlineSnapshot(`
      Object {
        "error": Object {
          "code": "Error",
          "message": "ERROR_MESSAGE",
        },
        "event": Object {
          "action": "ACTION",
          "category": "database",
          "outcome": "failure",
          "type": "change",
        },
        "kibana": Object {
          "space_id": "SPACE_ID",
        },
        "message": "Failed attempt to update saved object 'SAVED_OBJECT_ID' of type 'SAVED_OBJECT_TYPE' by user 'USER_NAME'",
        "object": Object {
          "additional_details": undefined,
          "id": "SAVED_OBJECT_ID",
          "type": "SAVED_OBJECT_TYPE",
        },
        "trace": Object {
          "id": "TRACE_ID",
        },
        "user": Object {
          "name": "USER_NAME",
        },
      }
    `);
  });
});
