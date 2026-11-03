export type InterfaceType = 'REST_API' | 'WEBHOOK' | 'SFTP' | 'EDI' | 'KAFKA' | 'GRAPHQL';

export type InterfaceStatus = 'unknown' | 'healthy' | 'degraded' | 'down' | 'maintenance';

export type Direction = 'inbound' | 'outbound' | 'bidirectional';

export type Environment = 'production' | 'staging' | 'development';

export type AuthType = 'Bearer Token' | 'API Key' | 'OAuth 2.0' | 'Basic Auth' | 'Mutual TLS' | 'None';

export interface InterfaceItem {
  id: string;
  name: string;
  description: string;
  sourceSystem: string;
  targetSystem: string;
  type: InterfaceType;
  direction: Direction;
  status: InterfaceStatus;
  environment: Environment;
  endpointUrl: string;
  authType: AuthType;
  uptimePercent: number;
  averageLatencyMs: number;
  requestsPerMin: number;
  lastSyncAt: string;
  syncInterval: string;
  retryAttempts: number;
  timeoutSeconds: number;
  alertOnFailure: boolean;
  tags: string[];
}

export interface TransactionRecord {
  id: string;
  interfaceId: string;
  interfaceName: string;
  timestamp: string;
  direction: Direction;
  statusCode: number;
  status: 'SUCCESS' | 'FAILED' | 'RETRYING' | 'PENDING';
  latencyMs: number;
  payloadSizeKb: number;
  requestPayload?: string;
  responsePayload?: string;
  errorMessage?: string;
}

export interface InterfaceFilter {
  query: string;
  type: string;
  status: string;
  environment: string;
}
