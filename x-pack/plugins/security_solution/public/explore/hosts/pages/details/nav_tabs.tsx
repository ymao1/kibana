/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import { omit } from 'lodash/fp';
import * as i18n from '../translations';
import type { HostDetailsNavTab } from './types';
import { HostsTableType } from '../../store/model';
import { HOSTS_PATH } from '../../../../../common/constants';

const getTabsOnHostDetailsUrl = (hostName: string, tabName: HostsTableType) =>
  `${HOSTS_PATH}/name/${hostName}/${tabName}`;

export const navTabsHostDetails = ({
  hasMlUserPermissions,
  hostName,
  isEnterprise,
}: {
  hostName: string;
  hasMlUserPermissions: boolean;
  isEnterprise?: boolean;
}): HostDetailsNavTab => {
  const hiddenTabs = [];

  const hostDetailsNavTabs = {
    [HostsTableType.events]: {
      id: HostsTableType.events,
      name: i18n.NAVIGATION_EVENTS_TITLE,
      href: getTabsOnHostDetailsUrl(hostName, HostsTableType.events),
      disabled: false,
    },
    [HostsTableType.authentications]: {
      id: HostsTableType.authentications,
      name: i18n.NAVIGATION_AUTHENTICATIONS_TITLE,
      href: getTabsOnHostDetailsUrl(hostName, HostsTableType.authentications),
      disabled: false,
    },
    [HostsTableType.uncommonProcesses]: {
      id: HostsTableType.uncommonProcesses,
      name: i18n.NAVIGATION_UNCOMMON_PROCESSES_TITLE,
      href: getTabsOnHostDetailsUrl(hostName, HostsTableType.uncommonProcesses),
      disabled: false,
    },
    [HostsTableType.anomalies]: {
      id: HostsTableType.anomalies,
      name: i18n.NAVIGATION_ANOMALIES_TITLE,
      href: getTabsOnHostDetailsUrl(hostName, HostsTableType.anomalies),
      disabled: false,
    },
    [HostsTableType.risk]: {
      id: HostsTableType.risk,
      name: i18n.NAVIGATION_HOST_RISK_TITLE,
      href: getTabsOnHostDetailsUrl(hostName, HostsTableType.risk),
      disabled: false,
    },
    [HostsTableType.sessions]: {
      id: HostsTableType.sessions,
      name: i18n.NAVIGATION_SESSIONS_TITLE,
      href: getTabsOnHostDetailsUrl(hostName, HostsTableType.sessions),
      disabled: false,
      isBeta: false,
    },
  };

  if (!hasMlUserPermissions) {
    hiddenTabs.push(HostsTableType.anomalies);
  }

  if (!isEnterprise) {
    hiddenTabs.push(HostsTableType.sessions);
  }

  return omit(hiddenTabs, hostDetailsNavTabs);
};
