/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License;
 * you may not use this file except in compliance with the Elastic License.
 */

import { Subject, combineLatest, of } from 'rxjs';
import { filter } from 'rxjs/operators';
import { KibanaRequest, Logger } from 'src/core/server';

import {
  AuditEvent,
  AuditEventDecorator,
  AuditorFactory,
  LoggingServiceSetup,
  AuditTrailSetup,
  HttpServiceSetup,
  OnPreResponseInfo,
} from 'src/core/server';
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
  http: Pick<HttpServiceSetup, 'registerOnPreResponse'>;
}

export class AuditTrailService {
  private readonly event$ = new Subject<AuditEvent>();

  constructor(private readonly logger: Logger) {}

  public setup({
    license,
    config,
    logging,
    http,
    auditTrail,
    getCurrentUser,
    getSpacesService,
  }: SetupParams) {
    combineLatest(this.event$.asObservable(), license.features$)
      .pipe(filter(([, licenseFeatures]) => licenseFeatures.allowAuditLogging))
      .subscribe(([{ message, ...other }]) => this.logger.debug(message, other));

    const depsApi = {
      getCurrentUser,
      getSpaceId: (request: KibanaRequest) => getSpacesService?.()?.getSpaceId(request)!,
    };
    const auditorFactory: AuditorFactory = {
      asScoped: (request) => {
        return new AuditTrailClient(request, this.event$, depsApi);
      },
    };
    auditTrail.register(auditorFactory);

    // TODO: Probably not the right hook since response can still change
    http.registerOnPreResponse((request, preResponseInfo, t) => {
      auditorFactory.asScoped(request).add(httpRequestEvent, { request, preResponseInfo });
      return t.next();
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

export interface HttpRequestEventArgs {
  request: KibanaRequest;
  preResponseInfo: OnPreResponseInfo;
}

export const httpRequestEvent: AuditEventDecorator<HttpRequestEventArgs> = (
  event,
  { request, preResponseInfo }
) => {
  const [path, query] = request.url.path?.split('?') ?? [];

  return {
    ...event,
    message: `HTTP request '${path}' by user '${event.user.name}' ${
      preResponseInfo.statusCode >= 400 ? 'failed' : 'succeeded'
    }`,
    event: {
      action: 'http_request',
      category: 'web',
      outcome: preResponseInfo.statusCode >= 400 ? 'failure' : 'success',
    },
    http: {
      request: {
        method: request.route.method,
        // body: {
        //   content: request.body // TODO: validation rules are required to read this out - can we relax these restrictions for request interceptors?
        // }
      },
      response: {
        status_code: preResponseInfo.statusCode,
      },
    },
    url: {
      domain: request.url.hostname,
      path,
      port: request.url.port ? parseInt(request.url.port, 10) : undefined,
      query,
      scheme: request.url.protocol,
    },
  };
};
