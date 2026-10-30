import { NextResponse } from 'next/server';
import { getInterfaces, addTransaction } from '@/lib/store';
import { TransactionRecord } from '@/types/interface';

export async function POST(
  request: Request,
  props: { params: Promise<{ id: string }> }
) {
  const { id } = await props.params;
  const list = getInterfaces();
  const iface = list.find((i) => i.id === id);

  if (!iface) {
    return NextResponse.json({ error: 'Interface not found' }, { status: 404 });
  }

  let requestBody = '';
  try {
    const json = await request.json();
    requestBody = typeof json.body === 'string' ? json.body : JSON.stringify(json.body || {}, null, 2);
  } catch {
    requestBody = JSON.stringify({ ping: true, timestamp: new Date().toISOString() }, null, 2);
  }

  const startTime = Date.now();

  // If endpoint is reachable or mock simulation:
  let statusCode = 200;
  let statusText = 'OK';
  let responseData: unknown = null;
  let latencyMs = 0;

  if (iface.status === 'down') {
    statusCode = 503;
    statusText = 'Service Unavailable';
    latencyMs = Math.floor(Math.random() * 20) + 10;
    responseData = {
      error: 'Host unreachable or broker leader partition unavailable',
      endpoint: iface.endpointUrl,
      timestamp: new Date().toISOString(),
    };
  } else if (iface.status === 'degraded') {
    latencyMs = Math.floor(Math.random() * 600) + 400;
    statusCode = Math.random() > 0.4 ? 200 : 504;
    statusText = statusCode === 200 ? 'OK (Degraded Latency)' : 'Gateway Timeout';
    responseData = {
      message: 'Interface responding with degraded SLA',
      latency: `${latencyMs}ms`,
      endpoint: iface.endpointUrl,
      timestamp: new Date().toISOString(),
    };
  } else {
    latencyMs = Math.floor(Math.random() * 60) + 25;
    statusCode = 200;
    statusText = 'OK';
    responseData = {
      success: true,
      interface: iface.name,
      protocol: iface.type,
      targetSystem: iface.targetSystem,
      endpoint: iface.endpointUrl,
      responseLatency: `${latencyMs}ms`,
      timestamp: new Date().toISOString(),
      headers: {
        'content-type': 'application/json',
        'x-request-id': `req-${Date.now()}`,
        'x-m5c-gateway-trace': `trace-${Math.random().toString(36).substring(2, 9)}`,
      },
      echoPayload: requestBody ? (tryParseJson(requestBody) || requestBody) : undefined,
    };
  }

  // Record this test as a transaction in the live audit log
  const txRecord: TransactionRecord = {
    id: `tx-${Date.now().toString(36)}`,
    interfaceId: iface.id,
    interfaceName: iface.name,
    timestamp: new Date().toISOString(),
    direction: iface.direction,
    statusCode,
    status: statusCode >= 200 && statusCode < 300 ? 'SUCCESS' : 'FAILED',
    latencyMs: Date.now() - startTime + latencyMs,
    payloadSizeKb: Number(((requestBody.length + JSON.stringify(responseData).length) / 1024).toFixed(2)),
    requestPayload: requestBody,
    responsePayload: JSON.stringify(responseData, null, 2),
    errorMessage: statusCode >= 400 ? statusText : undefined,
  };

  addTransaction(txRecord);

  return NextResponse.json({
    statusCode,
    statusText,
    latencyMs: txRecord.latencyMs,
    response: responseData,
    transaction: txRecord,
  });
}

function tryParseJson(str: string) {
  try {
    return JSON.parse(str);
  } catch {
    return null;
  }
}

