/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import { HttpSetup } from '@kbn/core/public';
import type { SortOrder } from '@elastic/elasticsearch/lib/api/typesWithBodyKey';
import { escapeKuery } from '@kbn/es-query';
import { IExecutionErrorsResult, ActionErrorLogSortFields } from '@kbn/alerting-plugin/common';
import { INTERNAL_BASE_ALERTING_API_PATH } from '../../constants';

export interface SortField {
  sort_field: ActionErrorLogSortFields;
  sort_order: SortOrder;
}

export interface LoadActionErrorLogProps {
  id: string;
  runId?: string;
  message?: string;
  dateStart: string;
  dateEnd?: string;
  filter?: string[];
  perPage?: number;
  page?: number;
  sort?: SortField[];
}

const SORT_MAP: Record<string, string> = {
  timestamp: '@timestamp',
};

// Remaps sorting keys to ones that the server knows how to handle
const getRenamedSort = (sort?: SortField[]) => {
  if (!sort) {
    return [];
  }
  return sort.map(({ sort_field: sortField, sort_order: sortOrder }) => ({
    sort_field: SORT_MAP[sortField] || sortField,
    sort_order: sortOrder,
  }));
};

// TODO (Jiawei): Use node builder instead of strings
const getFilter = ({ runId, message }: { runId?: string; message?: string }) => {
  const filter: string[] = [];

  if (runId) {
    filter.push(`kibana.alert.rule.execution.uuid: ${runId}`);
  }

  if (message) {
    filter.push(`message: "${escapeKuery(message)}"`);
  }

  return filter;
};

export const loadActionErrorLog = async ({
  id,
  http,
  dateStart,
  dateEnd,
  runId,
  message,
  perPage = 10,
  page = 0,
  sort,
}: LoadActionErrorLogProps & { http: HttpSetup }) => {
  const renamedSort = getRenamedSort(sort);
  const filter = getFilter({ runId, message });

  return http.get<IExecutionErrorsResult>(
    `${INTERNAL_BASE_ALERTING_API_PATH}/rule/${id}/_action_error_log`,
    {
      query: {
        date_start: dateStart,
        date_end: dateEnd,
        filter: filter.length ? filter.join(' and ') : undefined,
        per_page: perPage,
        // Need to add the + 1 for pages because APIs are 1 indexed,
        // whereas data grid sorts are 0 indexed.
        page: page + 1,
        sort: renamedSort.length ? JSON.stringify(renamedSort) : undefined,
      },
    }
  );
};
