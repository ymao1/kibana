/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import { loggingSystemMock, savedObjectsClientMock } from '@kbn/core/server/mocks';
import type { ElasticsearchClient } from '@kbn/core/server';
import type { MlPluginSetup } from '@kbn/ml-plugin/server';
import { getEntityAnomalies } from './get_anomaly_details';
import type { AnomalyHit } from '../ml_anomaly_detection/types';
import type { JobConfig } from '../ml_anomaly_detection/get_job_config';

// Mock the barrel directly to avoid "Cannot redefine property: getJobConfig" caused by
// the barrel exporting getJobConfig from two different source files.
jest.mock('../ml_anomaly_detection', () => ({
  searchEntityAnomalies: jest.fn(),
  fetchBaselineBehavior: jest.fn(),
  getJobConfig: jest.fn(),
}));

const { searchEntityAnomalies, fetchBaselineBehavior, getJobConfig } =
  jest.requireMock('../ml_anomaly_detection');

const makeAnomaly = (overrides: Partial<AnomalyHit> = {}): AnomalyHit => ({
  _id: 'anomaly-1',
  entityId: 'user:alice',
  jobId: 'security-job-1',
  detectorIndex: 0,
  detectorFunction: 'rare',
  timestamp: 1778241600000,
  recordScore: 75,
  actual: 5,
  typical: 1,
  byFieldName: 'source.ip',
  byFieldValue: 'evil-ip',
  ...overrides,
});

const makeJobConfig = (overrides: Partial<JobConfig> = {}): JobConfig => ({
  sourceIndex: ['logs-*'],
  datafeedQuery: { match_all: {} },
  detectors: [],
  bucketSpanMs: 3600000,
  jobName: null,
  threatTactics: [],
  threatTechniques: [],
  ...overrides,
});

const soClient = savedObjectsClientMock.create();
let logger: ReturnType<typeof loggingSystemMock.createLogger>;
let esClient: ElasticsearchClient;
let mockMl: MlPluginSetup;

const defaultParams = {
  entityId: 'user:alice',
  entityType: 'user' as const,
  namespace: 'default',
};

beforeEach(() => {
  jest.clearAllMocks();
  logger = loggingSystemMock.createLogger();
  esClient = {} as unknown as ElasticsearchClient;
  mockMl = {
    mlSystemProvider: jest.fn().mockReturnValue({}),
  } as unknown as MlPluginSetup;
  searchEntityAnomalies.mockResolvedValue([]);
  getJobConfig.mockResolvedValue(new Map());
  fetchBaselineBehavior.mockImplementation(
    ({ anomaly }: { anomaly: ReturnType<typeof makeAnomaly> }) => Promise.resolve(anomaly)
  );
});

describe('getEntityAnomalies', () => {
  it('returns empty array when no anomalies are found', async () => {
    searchEntityAnomalies.mockResolvedValue([]);

    const result = await getEntityAnomalies({
      ...defaultParams,
      esClient,
      logger,
      ml: mockMl,
      soClient,
    });

    expect(result).toEqual([]);
    expect(fetchBaselineBehavior).not.toHaveBeenCalled();
  });

  it('maps an EnrichedAnomalyHit to an AnomalySummaryEntry correctly', async () => {
    const anomaly = makeAnomaly({
      _id: 'a1',
      timestamp: 1_700_000_000_000,
      recordScore: 88,
      actual: 10,
      typical: 2,
      byFieldName: 'source.ip',
      byFieldValue: 'evil-ip',
    });
    searchEntityAnomalies.mockResolvedValue([anomaly]);
    fetchBaselineBehavior.mockResolvedValue({
      ...anomaly,
      baselineValues: ['10.0.0.1', '10.0.0.2'],
      anomalousValue: 'evil-ip',
      anomalousValueCount: 3,
    });

    const result = await getEntityAnomalies({
      ...defaultParams,
      esClient,
      logger,
      ml: mockMl,
      soClient,
    });

    expect(result).toHaveLength(1);
    expect(result[0]).toMatchObject({
      jobId: 'security-job-1',
      detectorIndex: 0,
      detectorFunction: 'rare',
      byFieldName: 'source.ip',
      byFieldValue: 'evil-ip',
      recordScore: 88,
      timestamp: new Date(1_700_000_000_000).toISOString(),
      actual: [10],
      typical: [2],
      baselineValues: ['10.0.0.1', '10.0.0.2'],
      anomalousValue: 'evil-ip',
      anomalousValueCount: 3,
    });
  });

  it('converts numeric anomalousValue to string', async () => {
    const anomaly = makeAnomaly({ _id: 'a1' });
    searchEntityAnomalies.mockResolvedValue([anomaly]);
    fetchBaselineBehavior.mockResolvedValue({ ...anomaly, anomalousValue: 42 });

    const result = await getEntityAnomalies({
      ...defaultParams,
      esClient,
      logger,
      ml: mockMl,
      soClient,
    });

    expect(result[0].anomalousValue).toBe('42');
  });

  it('converts baseline values to strings', async () => {
    const anomaly = makeAnomaly({ _id: 'a1' });
    searchEntityAnomalies.mockResolvedValue([anomaly]);
    fetchBaselineBehavior.mockResolvedValue({ ...anomaly, baselineValues: [1.5, 2.5] });

    const result = await getEntityAnomalies({
      ...defaultParams,
      esClient,
      logger,
      ml: mockMl,
      soClient,
    });

    expect(result[0].baselineValues).toEqual(['1.5', '2.5']);
  });

  it('preserves the query-time order', async () => {
    const a1 = makeAnomaly({ _id: 'a1', jobId: 'job-A', timestamp: 2000, recordScore: 90 });
    const a2 = makeAnomaly({ _id: 'a2', jobId: 'job-B', timestamp: 1000, recordScore: 50 });
    searchEntityAnomalies.mockResolvedValue([a1, a2]);

    fetchBaselineBehavior.mockImplementation(
      ({ anomaly, jobId }: { anomaly: unknown; jobId: string }) =>
        Promise.resolve({ ...(anomaly as object), baselineValues: [`baseline-${jobId}`] })
    );

    const result = await getEntityAnomalies({
      ...defaultParams,
      esClient,
      logger,
      ml: mockMl,
      soClient,
    });

    expect(result).toHaveLength(2);
    expect(result[0].jobId).toBe('job-A');
    expect(result[1].jobId).toBe('job-B');
  });

  it('rejects when fetchBaselineBehavior throws', async () => {
    const anomaly = makeAnomaly({ _id: 'a1', actual: 5, typical: 1 });
    searchEntityAnomalies.mockResolvedValue([anomaly]);
    fetchBaselineBehavior.mockRejectedValue(new Error('source index unavailable'));

    await expect(
      getEntityAnomalies({
        ...defaultParams,
        esClient,
        logger,
        ml: mockMl,
        soClient,
      })
    ).rejects.toThrow('source index unavailable');
  });

  it('calls fetchBaselineBehavior once per anomaly record', async () => {
    const anomalies = [
      makeAnomaly({ _id: 'a1', jobId: 'job-A' }),
      makeAnomaly({ _id: 'a2', jobId: 'job-A' }),
      makeAnomaly({ _id: 'a3', jobId: 'job-B' }),
    ];
    searchEntityAnomalies.mockResolvedValue(anomalies);
    fetchBaselineBehavior.mockImplementation(({ anomaly }: { anomaly: unknown }) =>
      Promise.resolve(anomaly)
    );

    await getEntityAnomalies({
      ...defaultParams,
      esClient,
      logger,
      ml: mockMl,
      soClient,
    });

    expect(fetchBaselineBehavior).toHaveBeenCalledTimes(3);
  });

  it('passes the resolved jobConfig to fetchBaselineBehavior', async () => {
    const anomaly = makeAnomaly({ _id: 'a1', jobId: 'job-A' });
    const jobConfig = makeJobConfig({ sourceIndex: ['custom-index'] });
    searchEntityAnomalies.mockResolvedValue([anomaly]);
    getJobConfig.mockResolvedValue(new Map([['job-A', jobConfig]]));

    await getEntityAnomalies({
      ...defaultParams,
      esClient,
      logger,
      ml: mockMl,
      soClient,
    });

    expect(fetchBaselineBehavior).toHaveBeenCalledWith(
      expect.objectContaining({ jobConfig, jobId: 'job-A' })
    );
  });

  it('passes null jobConfig when the job is unknown', async () => {
    const anomaly = makeAnomaly({ _id: 'a1', jobId: 'unknown-job' });
    searchEntityAnomalies.mockResolvedValue([anomaly]);
    getJobConfig.mockResolvedValue(new Map()); // no entry for unknown-job

    await getEntityAnomalies({
      ...defaultParams,
      esClient,
      logger,
      ml: mockMl,
      soClient,
    });

    expect(fetchBaselineBehavior).toHaveBeenCalledWith(
      expect.objectContaining({ jobConfig: null })
    );
  });

  it('populates jobName, threatTactics, and threatTechniques from getJobConfig result', async () => {
    const anomaly = makeAnomaly({ _id: 'a1', jobId: 'auth_high_count_ea' });
    searchEntityAnomalies.mockResolvedValue([anomaly]);
    fetchBaselineBehavior.mockResolvedValue(anomaly);
    getJobConfig.mockResolvedValue(
      new Map([
        [
          'auth_high_count_ea',
          makeJobConfig({
            jobName: 'Spike in Logon Events',
            threatTactics: ['Credential Access'],
            threatTechniques: ['Brute Force'],
          }),
        ],
      ])
    );

    const result = await getEntityAnomalies({
      ...defaultParams,
      esClient,
      logger,
      ml: mockMl,
      soClient,
    });

    expect(result[0].jobName).toBe('Spike in Logon Events');
    expect(result[0].threatTactics).toEqual(['Credential Access']);
    expect(result[0].threatTechniques).toEqual(['Brute Force']);
  });

  it('calls getJobConfig with the unique job IDs from the page', async () => {
    const anomalies = [
      makeAnomaly({ _id: 'a1', jobId: 'job-A' }),
      makeAnomaly({ _id: 'a2', jobId: 'job-A' }), // duplicate — should dedupe
      makeAnomaly({ _id: 'a3', jobId: 'job-B' }),
    ];
    searchEntityAnomalies.mockResolvedValue(anomalies);

    await getEntityAnomalies({
      ...defaultParams,
      esClient,
      logger,
      ml: mockMl,
      soClient,
    });

    expect(getJobConfig).toHaveBeenCalledWith(
      expect.objectContaining({ jobIds: expect.arrayContaining(['job-A', 'job-B']) })
    );
    expect(getJobConfig.mock.calls[0][0].jobIds).toHaveLength(2);
  });

  it('forwards fromMs, jobIds, sort, and pagination to searchEntityAnomalies', async () => {
    searchEntityAnomalies.mockResolvedValue([]);

    await getEntityAnomalies({
      ...defaultParams,
      esClient,
      fromMs: 1_700_000_000_000,
      jobIds: ['job-A'],
      sort: [{ field: 'record_score', order: 'desc' }],
      offset: 10,
      pageSize: 20,
      logger,
      ml: mockMl,
      soClient,
    });

    expect(searchEntityAnomalies).toHaveBeenCalledWith(
      expect.objectContaining({
        entityId: 'user:alice',
        entityType: 'user',
        fromMs: 1_700_000_000_000,
        jobIds: ['job-A'],
        sort: [{ field: 'record_score', order: 'desc' }],
        from: 10,
        size: 20,
      })
    );
  });
});
