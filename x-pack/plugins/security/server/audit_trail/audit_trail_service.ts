/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License;
 * you may not use this file except in compliance with the Elastic License.
 */

import { Subject, combineLatest, of } from 'rxjs';
import { filter } from 'rxjs/operators';
import { KibanaRequest, Logger } from 'src/core/server';

import { AuditEvent, LoggingServiceSetup, AuditTrailSetup } from 'src/core/server';
import { AuditTrailClient } from './audit_trail_client';

import { SecurityPluginSetup } from '../';
import { SpacesPluginSetup } from '../../../spaces/server';
import { SecurityLicense } from '../../common/licensing';
import { ConfigType } from '../config';

interface SetupParams {
  license: Pick<SecurityLicense, 'features$'>;
  config: ConfigType['audit'];
  getCurrentUser: SecurityPluginSetup['authc']['getCurrentUser'];
  getSpacesService(): Pick<SpacesPluginSetup['spacesService'], 'getSpaceId'> | undefined;
  logging: Pick<LoggingServiceSetup, 'configure'>;
  auditTrail: Pick<AuditTrailSetup, 'register'>;
}

export class AuditTrailService {
  private readonly event$ = new Subject<AuditEvent>();

  constructor(private readonly logger: Logger) {}

  public setup({
    license,
    config,
    logging,
    auditTrail,
    getCurrentUser,
    getSpacesService,
  }: SetupParams) {
    const depsApi = {
      getCurrentUser,
      getSpaceId: (request: KibanaRequest) => getSpacesService?.()?.getSpaceId(request)!,
    };

    combineLatest(this.event$.asObservable(), license.features$)
      .pipe(filter(([, licenseFeatures]) => licenseFeatures.allowAuditLogging))
      .subscribe(([{ message, ...other }]) => this.logger.debug(message, other));

    auditTrail.register({
      asScoped: (request: KibanaRequest) => {
        return new AuditTrailClient(request, this.event$, depsApi);
      },
    });

    logging.configure(
      of({
        appenders: {
          auditTrailAppender: config.appender ?? {
            kind: 'console',
            layout: {
              kind: 'pattern',
              highlight: true,
            },
          },
        },
        loggers: [
          {
            context: 'audit_trail',
            level: config.enabled ? 'debug' : 'off',
            appenders: ['auditTrailAppender'],
          },
        ],
      })
    );
  }

  public stop() {
    this.event$.complete();
  }
}
