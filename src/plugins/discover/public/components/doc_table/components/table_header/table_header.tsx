/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0 and the Server Side Public License, v 1; you may not use this file except
 * in compliance with, at your election, the Elastic License 2.0 or the Server
 * Side Public License, v 1.
 */

import React from 'react';
import type { DataView } from 'src/plugins/data/common';
import { TableHeaderColumn } from './table_header_column';
import { SortOrder, getDisplayedColumns } from './helpers';
import { getDefaultSort } from '../../lib/get_default_sort';

interface Props {
  columns: string[];
  defaultSortOrder: string;
  hideTimeColumn: boolean;
  indexPattern: DataView;
  isShortDots: boolean;
  onChangeSortOrder?: (sortOrder: SortOrder[]) => void;
  onMoveColumn?: (name: string, index: number) => void;
  onRemoveColumn?: (name: string) => void;
  sortOrder: SortOrder[];
}

export function TableHeader({
  columns,
  defaultSortOrder,
  hideTimeColumn,
  indexPattern,
  isShortDots,
  onChangeSortOrder,
  onMoveColumn,
  onRemoveColumn,
  sortOrder,
}: Props) {
  const displayedColumns = getDisplayedColumns(columns, indexPattern, hideTimeColumn, isShortDots);

  return (
    <tr data-test-subj="docTableHeader" className="kbnDocTableHeader">
      <th style={{ width: '24px' }} />
      {displayedColumns.map((col) => {
        return (
          <TableHeaderColumn
            key={col.name}
            {...col}
            customLabel={indexPattern.getFieldByName(col.name)?.customLabel}
            isTimeColumn={indexPattern.timeFieldName === col.name}
            sortOrder={
              sortOrder.length ? sortOrder : getDefaultSort(indexPattern, defaultSortOrder)
            }
            onMoveColumn={onMoveColumn}
            onRemoveColumn={onRemoveColumn}
            onChangeSortOrder={onChangeSortOrder}
          />
        );
      })}
    </tr>
  );
}
