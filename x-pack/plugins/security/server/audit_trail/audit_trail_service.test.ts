/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License;
 * you may not use this file except in compliance with the Elastic License.
 */

import { BehaviorSubject, Subject } from 'rxjs';
import { first } from 'rxjs/operators';
import { AuditTrailService, httpRequestEvent } from './audit_trail_service';
import {
  coreMock,
  loggingSystemMock,
  httpServiceMock,
  httpServerMock,
} from 'src/core/server/mocks';

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
        expect(value.loggers?.every((l) => l.level === 'debug')).toBe(true);
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
  const baseEvent = {
    user: { name: 'USER_NAME' },
    trace: { id: 'TRACE_ID' },
    kibana: { namespace: 'SPACE_ID' },
  };

  test(`creates audit event`, () => {
    expect(
      httpRequestEvent(baseEvent, {
        request: httpServerMock.createKibanaRequest({
          path: '/path?query=param',
          kibanaRequestState: { requestId: 'REQUEST_ID' },
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
          "namespace": "SPACE_ID",
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
});
