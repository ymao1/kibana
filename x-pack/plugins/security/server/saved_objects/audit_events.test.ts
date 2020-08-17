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

const baseEvent = {
  user: { name: 'USER_NAME' },
  trace: { id: 'TRACE_ID' },
  kibana: { namespace: 'SPACE_ID' },
};

describe('#savedObjectCreateEvent', () => {
  test(`creates audit event with creation details`, () => {
    expect(
      savedObjectCreateEvent(baseEvent, {
        action: 'ACTION',
        objects: [{ type: 'SAVED_OBJECT_TYPE', id: 'SAVED_OBJECT_ID' }],
      })
    ).toMatchInlineSnapshot(`
        Object {
          "error": undefined,
          "event": Object {
            "action": "ACTION",
            "category": "database",
            "outcome": "success",
            "type": "creation",
          },
          "kibana": Object {
            "namespace": "SPACE_ID",
            "saved_objects": Array [
              Object {
                "id": "SAVED_OBJECT_ID",
                "type": "SAVED_OBJECT_TYPE",
              },
            ],
          },
          "message": "User 'USER_NAME' created saved object 'SAVED_OBJECT_ID' of type 'SAVED_OBJECT_TYPE'",
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
        objects: [{ type: 'SAVED_OBJECT_TYPE', id: 'SAVED_OBJECT_ID' }],
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
            "namespace": "SPACE_ID",
            "saved_objects": Array [
              Object {
                "id": "SAVED_OBJECT_ID",
                "type": "SAVED_OBJECT_TYPE",
              },
            ],
          },
          "message": "Failed attempt to create saved object 'SAVED_OBJECT_ID' of type 'SAVED_OBJECT_TYPE' by user 'USER_NAME'",
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
        objects: [{ type: 'SAVED_OBJECT_TYPE', id: 'SAVED_OBJECT_ID' }],
      })
    ).toMatchInlineSnapshot(`
      Object {
        "error": undefined,
        "event": Object {
          "action": "ACTION",
          "category": "database",
          "outcome": "success",
          "type": "deletion",
        },
        "kibana": Object {
          "namespace": "SPACE_ID",
          "saved_objects": Array [
            Object {
              "id": "SAVED_OBJECT_ID",
              "namespaces": undefined,
              "type": "SAVED_OBJECT_TYPE",
            },
          ],
        },
        "message": "User 'USER_NAME' deleted saved object 'SAVED_OBJECT_ID' of type 'SAVED_OBJECT_TYPE'",
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
        objects: [{ type: 'SAVED_OBJECT_TYPE', id: 'SAVED_OBJECT_ID' }],
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
          "namespace": "SPACE_ID",
          "saved_objects": Array [
            Object {
              "id": "SAVED_OBJECT_ID",
              "namespaces": undefined,
              "type": "SAVED_OBJECT_TYPE",
            },
          ],
        },
        "message": "Failed attempt to delete saved object 'SAVED_OBJECT_ID' of type 'SAVED_OBJECT_TYPE' by user 'USER_NAME'",
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
        objects: [{ type: 'SAVED_OBJECT_TYPE', id: 'SAVED_OBJECT_ID' }],
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
          "namespace": "SPACE_ID",
          "saved_objects": Array [
            Object {
              "id": "SAVED_OBJECT_ID",
              "type": "SAVED_OBJECT_TYPE",
            },
          ],
        },
        "message": "User 'USER_NAME' accessed saved object 'SAVED_OBJECT_ID' of type 'SAVED_OBJECT_TYPE'",
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
        objects: [{ type: 'SAVED_OBJECT_TYPE', id: 'SAVED_OBJECT_ID' }],
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
          "namespace": "SPACE_ID",
          "saved_objects": Array [
            Object {
              "id": "SAVED_OBJECT_ID",
              "type": "SAVED_OBJECT_TYPE",
            },
          ],
        },
        "message": "Failed attempt to access saved object 'SAVED_OBJECT_ID' of type 'SAVED_OBJECT_TYPE' by user 'USER_NAME'",
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
        objects: [{ type: 'SAVED_OBJECT_TYPE', id: 'SAVED_OBJECT_ID' }],
      })
    ).toMatchInlineSnapshot(`
      Object {
        "error": undefined,
        "event": Object {
          "action": "ACTION",
          "category": "database",
          "outcome": "success",
          "type": "change",
        },
        "kibana": Object {
          "namespace": "SPACE_ID",
          "saved_objects": Array [
            Object {
              "id": "SAVED_OBJECT_ID",
              "namespaces": undefined,
              "type": "SAVED_OBJECT_TYPE",
            },
          ],
        },
        "message": "User 'USER_NAME' updated saved object 'SAVED_OBJECT_ID' of type 'SAVED_OBJECT_TYPE'",
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
        objects: [{ type: 'SAVED_OBJECT_TYPE', id: 'SAVED_OBJECT_ID' }],
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
          "namespace": "SPACE_ID",
          "saved_objects": Array [
            Object {
              "id": "SAVED_OBJECT_ID",
              "namespaces": undefined,
              "type": "SAVED_OBJECT_TYPE",
            },
          ],
        },
        "message": "Failed attempt to update saved object 'SAVED_OBJECT_ID' of type 'SAVED_OBJECT_TYPE' by user 'USER_NAME'",
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
