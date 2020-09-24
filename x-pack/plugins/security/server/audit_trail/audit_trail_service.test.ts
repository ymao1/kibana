/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License;
 * you may not use this file except in compliance with the Elastic License.
 */

import { BehaviorSubject, Subject } from 'rxjs';
import { first } from 'rxjs/operators';
import { AuditTrailService, httpRequestEvent, filterEvent } from './audit_trail_service';
import {
  coreMock,
  loggingSystemMock,
  httpServiceMock,
  httpServerMock,
} from 'src/core/server/mocks';
import { AuditEvent } from 'src/core/server';

describe('AuditTrail plugin', () => {
  let coreSetup: ReturnType<typeof coreMock.createSetup>;
  let service: AuditTrailService;
  const license = {
    features$: new BehaviorSubject({
      showLogin: true,
      allowLogin: true,
      showLinks: true,
      showRoleMappingsManagement: true,
      allowAccessAgreement: true,
      allowAuditLogging: true,
      allowRoleDocumentLevelSecurity: true,
      allowRoleFieldLevelSecurity: true,
      allowRbac: true,
      allowSubFeaturePrivileges: true,
    }),
  };
  const config = {
    enabled: true,
  };
  const getCurrentUser = jest.fn();
  const getSpacesService = jest.fn();
  const logger = loggingSystemMock.createLogger();
  const http = httpServiceMock.createSetupContract();

  beforeEach(() => {
    service = new AuditTrailService(logger);
    coreSetup = coreMock.createSetup();
    logger.debug.mockClear();
    http.registerOnPreResponse.mockClear();
  });

  afterEach(async () => {
    await service.stop();
  });

  describe('#setup', () => {
    it('registers AuditTrail factory', async () => {
      service.setup({
        license,
        config,
        http,
        logging: coreSetup.logging,
        auditTrail: coreSetup.auditTrail,
        getCurrentUser,
        getSpacesService,
      });
      expect(coreSetup.auditTrail.register).toHaveBeenCalledTimes(1);
    });

    it('registers pre response hook', async () => {
      service.setup({
        license,
        config,
        http,
        logging: coreSetup.logging,
        auditTrail: coreSetup.auditTrail,
        getCurrentUser,
        getSpacesService,
      });
      expect(http.registerOnPreResponse).toHaveBeenCalledTimes(1);
    });

    it('logs to audit trail if license allows', async () => {
      const event$: Subject<any> = (service as any).event$;
      service.setup({
        license,
        config,
        http,
        logging: coreSetup.logging,
        auditTrail: coreSetup.auditTrail,
        getCurrentUser,
        getSpacesService,
      });
      event$.next({ message: 'MESSAGE', other: 'OTHER' });
      expect(logger.debug).toHaveBeenCalledWith('MESSAGE', { other: 'OTHER' });
    });

    it('does not log to audit trail if license does not allow', async () => {
      const event$: Subject<any> = (service as any).event$;
      service.setup({
        license: {
          features$: new BehaviorSubject({
            showLogin: true,
            allowLogin: true,
            showLinks: true,
            showRoleMappingsManagement: true,
            allowAccessAgreement: true,
            allowAuditLogging: false,
            allowRoleDocumentLevelSecurity: true,
            allowRoleFieldLevelSecurity: true,
            allowRbac: true,
            allowSubFeaturePrivileges: true,
          }),
        },
        config,
        http,
        logging: coreSetup.logging,
        auditTrail: coreSetup.auditTrail,
        getCurrentUser,
        getSpacesService,
      });
      event$.next({ message: 'MESSAGE', other: 'OTHER' });
      expect(logger.debug).not.toHaveBeenCalled();
    });

    it('does not log to audit trail if event matches ignore filter', async () => {
      const event$: Subject<any> = (service as any).event$;
      service.setup({
        license,
        config: {
          enabled: true,
          ignore_filters: [{ actions: ['ACTION'] }],
        },
        http,
        logging: coreSetup.logging,
        auditTrail: coreSetup.auditTrail,
        getCurrentUser,
        getSpacesService,
      });
      event$.next({ message: 'MESSAGE', event: { action: 'ACTION' } });
      expect(logger.debug).not.toHaveBeenCalled();
    });

    describe('logger', () => {
      it('registers a custom logger', async () => {
        service.setup({
          license,
          config,
          http,
          logging: coreSetup.logging,
          auditTrail: coreSetup.auditTrail,
          getCurrentUser,
          getSpacesService,
        });

        expect(coreSetup.logging.configure).toHaveBeenCalledTimes(1);
      });

      it('disables logging if config.enabled: false', async () => {
        service.setup({
          license,
          config: {
            enabled: false,
          },
          http,
          logging: coreSetup.logging,
          auditTrail: coreSetup.auditTrail,
          getCurrentUser,
          getSpacesService,
        });

        const args = coreSetup.logging.configure.mock.calls[0][0];
        const value = await args.pipe(first()).toPromise();
        expect(value.loggers?.every((l) => l.level === 'off')).toBe(true);
      });

      it('logs with DEBUG level if config.enabled: true', async () => {
        service.setup({
          license,
          config,
          http,
          logging: coreSetup.logging,
          auditTrail: coreSetup.auditTrail,
          getCurrentUser,
          getSpacesService,
        });

        const args = coreSetup.logging.configure.mock.calls[0][0];
        const value = await args.pipe(first()).toPromise();
        expect(value.loggers?.every((l) => l.level === 'info')).toBe(true);
      });

      it('uses appender adjusted via config', async () => {
        service.setup({
          license,
          config: {
            enabled: true,
            appender: {
              kind: 'file',
              path: '/path/to/file.txt',
              layout: {
                kind: 'json',
              },
            },
          },
          http,
          logging: coreSetup.logging,
          auditTrail: coreSetup.auditTrail,
          getCurrentUser,
          getSpacesService,
        });

        const args = coreSetup.logging.configure.mock.calls[0][0];
        const value = await args.pipe(first()).toPromise();
        expect(value.appenders).toEqual({
          auditTrailAppender: {
            kind: 'file',
            path: '/path/to/file.txt',
            layout: {
              kind: 'json',
            },
          },
        });
      });

      it('falls back to the default appender if not configured', async () => {
        service.setup({
          license,
          config: {
            enabled: true,
          },
          http,
          logging: coreSetup.logging,
          auditTrail: coreSetup.auditTrail,
          getCurrentUser,
          getSpacesService,
        });

        const args = coreSetup.logging.configure.mock.calls[0][0];
        const value = await args.pipe(first()).toPromise();
        expect(value.appenders).toEqual({
          auditTrailAppender: {
            kind: 'console',
            layout: {
              kind: 'pattern',
              highlight: true,
            },
          },
        });
      });
    });
  });
});

describe('#httpRequestEvent', () => {
  const baseEvent: Pick<AuditEvent, 'user' | 'trace' | 'kibana'> = {
    user: { name: 'USER_NAME' },
    trace: { id: 'TRACE_ID' },
    kibana: { space_id: 'SPACE_ID' },
  };

  test(`creates audit event with successful outcome`, () => {
    expect(
      httpRequestEvent(baseEvent, {
        request: httpServerMock.createKibanaRequest({
          path: '/path?query=param',
          kibanaRequestState: { requestId: 'REQUEST_ID', requestUuid: 'REQUEST_UUID' },
        }),
        preResponseInfo: { statusCode: 200 },
      })
    ).toMatchInlineSnapshot(`
      Object {
        "event": Object {
          "action": "http_request",
          "category": "web",
          "outcome": "success",
        },
        "http": Object {
          "request": Object {
            "method": "get",
          },
          "response": Object {
            "status_code": 200,
          },
        },
        "kibana": Object {
          "space_id": "SPACE_ID",
        },
        "message": "HTTP request '/path' by user 'USER_NAME' succeeded",
        "trace": Object {
          "id": "TRACE_ID",
        },
        "url": Object {
          "domain": undefined,
          "path": "/path",
          "port": undefined,
          "query": "query=param",
          "scheme": undefined,
        },
        "user": Object {
          "name": "USER_NAME",
        },
      }
    `);
  });

  test(`creates audit event with failure outcome`, () => {
    expect(
      httpRequestEvent(baseEvent, {
        request: httpServerMock.createKibanaRequest({
          path: '/path?query=param',
          kibanaRequestState: { requestId: 'REQUEST_ID', requestUuid: 'REQUEST_UUID' },
        }),
        preResponseInfo: { statusCode: 400 },
      })
    ).toMatchInlineSnapshot(`
      Object {
        "event": Object {
          "action": "http_request",
          "category": "web",
          "outcome": "failure",
        },
        "http": Object {
          "request": Object {
            "method": "get",
          },
          "response": Object {
            "status_code": 400,
          },
        },
        "kibana": Object {
          "space_id": "SPACE_ID",
        },
        "message": "HTTP request '/path' by user 'USER_NAME' failed",
        "trace": Object {
          "id": "TRACE_ID",
        },
        "url": Object {
          "domain": undefined,
          "path": "/path",
          "port": undefined,
          "query": "query=param",
          "scheme": undefined,
        },
        "user": Object {
          "name": "USER_NAME",
        },
      }
    `);
  });

  test(`creates audit event with unknown outcome`, () => {
    expect(
      httpRequestEvent(baseEvent, {
        request: httpServerMock.createKibanaRequest({
          path: '/path?query=param',
          kibanaRequestState: { requestId: 'REQUEST_ID', requestUuid: 'REQUEST_UUID' },
        }),
      })
    ).toMatchInlineSnapshot(`
      Object {
        "event": Object {
          "action": "http_request",
          "category": "web",
          "outcome": "unknown",
        },
        "http": Object {
          "request": Object {
            "method": "get",
          },
          "response": undefined,
        },
        "kibana": Object {
          "space_id": "SPACE_ID",
        },
        "message": "Incoming HTTP request '/path' by user 'USER_NAME'",
        "trace": Object {
          "id": "TRACE_ID",
        },
        "url": Object {
          "domain": undefined,
          "path": "/path",
          "port": undefined,
          "query": "query=param",
          "scheme": undefined,
        },
        "user": Object {
          "name": "USER_NAME",
        },
      }
    `);
  });
});

describe('#filterEvent', () => {
  const event: AuditEvent = {
    message: "HTTP request '/path' by user 'jdoe' succeeded",
    event: {
      action: 'http_request',
      category: 'web',
      type: 'access',
      outcome: 'success',
    },
    user: {
      name: 'jdoe',
    },
    kibana: {
      space_id: 'default',
    },
    trace: {
      id: 'TRACE_ID',
    },
  };

  test(`filters events correctly when a single match is found per criteria`, () => {
    expect(filterEvent(event, [{ actions: ['NO_MATCH'] }])).toBeTruthy();
    expect(filterEvent(event, [{ actions: ['NO_MATCH', 'http_request'] }])).toBeFalsy();
    expect(filterEvent(event, [{ categories: ['NO_MATCH', 'web'] }])).toBeFalsy();
    expect(filterEvent(event, [{ types: ['NO_MATCH', 'access'] }])).toBeFalsy();
    expect(filterEvent(event, [{ outcomes: ['NO_MATCH', 'success'] }])).toBeFalsy();
    expect(filterEvent(event, [{ spaces: ['NO_MATCH', 'default'] }])).toBeFalsy();
  });

  test(`keeps events when one criteria per rule does not match`, () => {
    expect(
      filterEvent(event, [
        {
          actions: ['NO_MATCH'],
          categories: ['web'],
          types: ['access'],
          outcomes: ['success'],
          spaces: ['default'],
        },
        {
          actions: ['http_request'],
          categories: ['NO_MATCH'],
          types: ['access'],
          outcomes: ['success'],
          spaces: ['default'],
        },
        {
          actions: ['http_request'],
          categories: ['web'],
          types: ['NO_MATCH'],
          outcomes: ['success'],
          spaces: ['default'],
        },
        {
          actions: ['http_request'],
          categories: ['web'],
          types: ['access'],
          outcomes: ['NO_MATCH'],
          spaces: ['default'],
        },
        {
          actions: ['http_request'],
          categories: ['web'],
          types: ['access'],
          outcomes: ['success'],
          spaces: ['NO_MATCH'],
        },
      ])
    ).toBeTruthy();
  });

  test(`filters out event when all criteria in a single rule match`, () => {
    expect(
      filterEvent(event, [
        {
          actions: ['NO_MATCH'],
          categories: ['NO_MATCH'],
          types: ['NO_MATCH'],
          outcomes: ['NO_MATCH'],
          spaces: ['NO_MATCH'],
        },
        {
          actions: ['http_request'],
          categories: ['web'],
          types: ['access'],
          outcomes: ['success'],
          spaces: ['default'],
        },
      ])
    ).toBeFalsy();
  });
});
