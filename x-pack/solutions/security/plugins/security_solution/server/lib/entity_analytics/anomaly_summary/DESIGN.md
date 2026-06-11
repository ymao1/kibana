# Anomaly Summary API — Design Diagram

## Endpoint

```
POST /internal/entity_analytics/entities/{entity_type}/{entity_id}/anomaly_summary
```

**Auth:** `securitySolution` + `{APP_ID}-entity-analytics` privileges, Platinum license minimum.

---

## Request / Response Shapes

```
Request params:  entity_type (user|host), entity_id
Request body:    page, pageSize, from (epoch ms), jobIds[], sort[]
Response:        { entityId, entityType, anomalies: AnomalySummaryEntry[] }
```

---

## Sequence Diagram

```mermaid
sequenceDiagram
    participant Client
    participant Route as route.ts<br/>(registerAnomalySummaryRoutes)
    participant Logic as get_anomaly_details.ts<br/>(getEntityAnomalies)
    participant Search as search_anomalies.ts<br/>(searchEntityAnomalies)
    participant JobCfg as get_job_config.ts<br/>(getJobConfig)
    participant Baseline as fetch_baseline_behavior.ts<br/>(fetchBaselineBehavior)
    participant MLAnomIdx as .ml-anomalies-*<br/>(ML Anomaly Results Index)
    participant MLJobAPI as ML Anomaly Detectors API<br/>(ml.anomalyDetectorsProvider)
    participant SrcIdx as Source Data Index<br/>(per-job: logs, auditbeat, etc.)

    Client->>Route: POST /entities/{type}/{id}/anomaly_summary<br/>{page, pageSize, from, jobIds, sort}

    Note over Route: Validate params/body (Zod)<br/>Check license ≥ Platinum<br/>Check ML plugin available

    Route->>Logic: getEntityAnomalies({entityId, entityType, ...})

    %% Step 1: Search anomaly index
    Logic->>Search: searchEntityAnomalies({entityType, entityId, fromMs, jobIds, sort, from, size})
    Search->>MLJobAPI: getSecurityMlJobIds() — list all security ML job IDs
    MLJobAPI-->>Search: string[] (security job IDs)
    Note over Search: Intersect caller jobIds with security job IDs<br/>Build EUID runtime mapping for entity_type
    Search->>MLAnomIdx: mlAnomalySearch({<br/>  filter: result_type=record, is_interim=false,<br/>  record_score≥1, time range, entity_id, job_ids<br/>  runtime_mappings: entity_id = EUID(entity_type)<br/>})
    MLAnomIdx-->>Search: AnomalyHit[]
    Search-->>Logic: AnomalyHit[]

    %% Step 2: Fetch job configs
    Logic->>JobCfg: getJobConfig({jobIds: unique job IDs from page})
    JobCfg->>MLJobAPI: anomalyDetectorsProvider().jobs(jobIds)
    MLJobAPI-->>JobCfg: ML job definitions
    Note over JobCfg: Extract: sourceIndex, datafeedQuery,<br/>detectors, bucketSpanMs,<br/>jobName (custom_settings.security_app_display_name),<br/>threatTactics/threatTechniques (MITRE IDs → names)
    JobCfg-->>Logic: Map<jobId, JobConfig>

    %% Step 3: Enrich with baseline (parallel per anomaly)
    par For each AnomalyHit (in parallel)
        Logic->>Baseline: fetchBaselineBehavior({anomaly, entityId, entityType, jobConfig, ...})
        alt detector.function === 'rare'
            Baseline->>SrcIdx: search({aggs: baseline terms + anomaly filter})<br/>Top 3 by_field_value baseline distribution<br/>+ count of anomalous events
            SrcIdx-->>Baseline: {baseline buckets, anomaly doc_count}
            Baseline-->>Logic: EnrichedAnomalyHit {baselineValues[], anomalousValue, anomalousValueCount}
        else detector.function starts with 'time_'
            Baseline->>SrcIdx: search({aggs: time_bucket filter})<br/>Count of events in anomalous hour/day bucket<br/>(runtime fields: hour_of_day, day_of_week)
            SrcIdx-->>Baseline: {time_bucket doc_count}
            Baseline-->>Logic: EnrichedAnomalyHit {baselineValues=[typical], anomalousValue=actual, anomalousValueCount}
        else metric function (high_count, high_mean, etc.)
            Note over Baseline: No ES query needed —<br/>actual and typical already in anomaly record
            Baseline-->>Logic: EnrichedAnomalyHit {baselineValues=[typical], anomalousValue=actual}
        end
    end

    %% Map and respond
    Note over Logic: mapToAnomalySummaryEntry():<br/>merge jobConfig metadata onto each enriched hit
    Logic-->>Route: AnomalySummaryEntry[]
    Route-->>Client: 200 { entityId, entityType, anomalies: AnomalySummaryEntry[] }
```

---

## Component Overview

```mermaid
graph TD
    subgraph "API Layer"
        R[route.ts<br/>POST /entities/:type/:id/anomaly_summary<br/>Auth: securitySolution + entity-analytics<br/>License: Platinum+]
    end

    subgraph "Business Logic"
        G[get_anomaly_details.ts<br/>getEntityAnomalies]
        S[search_anomalies.ts<br/>searchEntityAnomalies]
        J[get_job_config.ts<br/>getJobConfig]
        B[fetch_baseline_behavior.ts<br/>fetchBaselineBehavior]
    end

    subgraph "Detector Function Strategies"
        BR[fetchRareBaselineForAnomaly<br/>rare — baseline distribution via terms agg]
        BT[fetchTimeBaselineForAnomaly<br/>time_of_day / time_of_week — time bucket count]
        BD[defaultBaselineForAnomaly<br/>metric functions — actual/typical from record]
    end

    subgraph "Data Sources"
        MLI[".ml-anomalies-*<br/>ML Anomaly Results Index<br/>(via mlSystem.mlAnomalySearch)"]
        MLJ["ML Anomaly Detectors API<br/>(via ml.anomalyDetectorsProvider)"]
        SRC["Source Data Index<br/>per-job (e.g., logs-*, auditbeat-*)"]
    end

    R --> G
    G --> S
    G --> J
    G --> B
    S --> MLI
    S --> MLJ
    J --> MLJ
    B --> BR
    B --> BT
    B --> BD
    BR --> SRC
    BT --> SRC
```

---

## Key Design Decisions

| Concern | Decision |
|---|---|
| **Pagination** | Offset-based (`page`/`pageSize` → `from`/`size` in ES query) |
| **Entity identification** | EUID runtime mapping — computes `entity_id` from raw fields at query time, no pre-indexing needed |
| **Job scoping** | Always intersects caller-supplied `jobIds` with known security ML job IDs; never exposes non-security jobs |
| **Baseline enrichment** | Parallel `Promise.all` per anomaly; failures fall back gracefully to un-enriched record |
| **Detector strategy** | Three strategies selected by `detector.function`: `rare` (occurrence), `time_*` (temporal), else metric (actual/typical passthrough) |
| **MITRE metadata** | IDs resolved to human-readable names at runtime using bundled tactics/techniques lookup maps |
| **ML plugin absent** | Returns `{ anomalies: [] }` with a warning log — no error thrown |
