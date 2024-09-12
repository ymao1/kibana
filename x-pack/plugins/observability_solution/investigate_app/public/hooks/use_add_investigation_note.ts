/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import { IHttpFetchError, ResponseErrorBody } from '@kbn/core/public';
import { i18n } from '@kbn/i18n';
import {
  CreateInvestigationNoteParams,
  CreateInvestigationNoteResponse,
} from '@kbn/investigation-shared';
import { useMutation } from '@tanstack/react-query';
import { useKibana } from './use_kibana';

type ServerError = IHttpFetchError<ResponseErrorBody>;

export function useAddInvestigationNote() {
  const {
    core: {
      http,
      notifications: { toasts },
    },
  } = useKibana();

  return useMutation<
    CreateInvestigationNoteResponse,
    ServerError,
    { investigationId: string; note: CreateInvestigationNoteParams },
    { investigationId: string }
  >(
    ['addInvestigationNote'],
    ({ investigationId, note }) => {
      const body = JSON.stringify(note);
      return http.post<CreateInvestigationNoteResponse>(
        `/api/observability/investigations/${investigationId}/notes`,
        { body, version: '2023-10-31' }
      );
    },
    {
      onSuccess: (response, {}) => {
        toasts.addSuccess(
          i18n.translate('xpack.investigateApp.addInvestigationNote.successMessage', {
            defaultMessage: 'Note saved',
          })
        );
      },
      onError: (error, {}, context) => {
        toasts.addError(
          new Error(
            error.body?.message ??
              i18n.translate('xpack.investigateApp.addInvestigationNote.errorMessage', {
                defaultMessage: 'an error occurred',
              })
          ),
          {
            title: i18n.translate('xpack.investigateApp.addInvestigationNote.errorTitle', {
              defaultMessage: 'Error',
            }),
          }
        );
      },
    }
  );
}
