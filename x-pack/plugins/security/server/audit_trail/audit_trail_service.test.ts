/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License;
 * you may not use this file except in compliance with the Elastic License.
 */

import { BehaviorSubject, Subject } from 'rxjs';
import { first } from 'rxjs/operators';
import { AuditTrailService } from './audit_trail_service';
import { coreMock, loggingSystemMock } from 'src/core/server/mocks';

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
  const debugLoggerSpy = jest.spyOn(logger, 'debug');

  beforeEach(() => {
    service = new AuditTrailService(logger);
    debugLoggerSpy.mockClear();
    coreSetup = coreMock.createSetup();
  });

  afterEach(async () => {
    await service.stop();
  });

  describe('#setup', () => {
    it('registers AuditTrail factory', async () => {
      service.setup({
        license,
        config,
        logging: coreSetup.logging,
        auditTrail: coreSetup.auditTrail,
        getCurrentUser,
        getSpacesService,
      });
      expect(coreSetup.auditTrail.register).toHaveBeenCalledTimes(1);
    });

    it('logs to audit trail if license allows', async () => {
      const event$: Subject<any> = (service as any).event$;
      service.setup({
        license,
        config,
        logging: coreSetup.logging,
        auditTrail: coreSetup.auditTrail,
        getCurrentUser,
        getSpacesService,
      });
      event$.next({ message: 'MESSAGE', other: 'OTHER' });
      expect(debugLoggerSpy).toHaveBeenCalledWith('MESSAGE', { other: 'OTHER' });
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
        logging: coreSetup.logging,
        auditTrail: coreSetup.auditTrail,
        getCurrentUser,
        getSpacesService,
      });
      event$.next({ message: 'MESSAGE', other: 'OTHER' });
      expect(debugLoggerSpy).not.toHaveBeenCalled();
    });

    describe('logger', () => {
      it('registers a custom logger', async () => {
        service.setup({
          license,
          config,
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
