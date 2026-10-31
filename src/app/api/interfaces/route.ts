import { NextResponse } from 'next/server';
import { getInterfaces, setInterfaces } from '@/lib/store';
import { InterfaceItem } from '@/types/interface';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const q = searchParams.get('q')?.toLowerCase() || '';
  const type = searchParams.get('type') || '';
  const status = searchParams.get('status') || '';
  const environment = searchParams.get('environment') || '';

  let list = getInterfaces();

  if (q) {
    list = list.filter(
      (item) =>
        item.name.toLowerCase().includes(q) ||
        item.description.toLowerCase().includes(q) ||
        item.sourceSystem.toLowerCase().includes(q) ||
        item.targetSystem.toLowerCase().includes(q) ||
        item.tags.some((tag) => tag.toLowerCase().includes(q))
    );
  }

  if (type && type !== 'ALL') {
    list = list.filter((item) => item.type === type);
  }

  if (status && status !== 'ALL') {
    list = list.filter((item) => item.status === status);
  }

  if (environment && environment !== 'ALL') {
    list = list.filter((item) => item.environment === environment);
  }

  return NextResponse.json({ interfaces: list, count: list.length });
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const current = getInterfaces();

    const newInterface: InterfaceItem = {
      id: `int-${Date.now().toString(36)}`,
      name: body.name || '',
      description: body.description || '',
      sourceSystem: body.sourceSystem || '',
      targetSystem: body.targetSystem || '',
      type: body.type || 'REST_API',
      direction: body.direction || 'inbound',
      status: 'unknown',
      environment: body.environment || 'production',
      endpointUrl: body.endpointUrl || '',
      authType: body.authType || 'None',
      uptimePercent: 0,
      averageLatencyMs: 0,
      requestsPerMin: 0,
      lastSyncAt: 'Never',
      syncInterval: body.syncInterval || 'Real-time',
      retryAttempts: body.retryAttempts ? Number(body.retryAttempts) : 3,
      timeoutSeconds: body.timeoutSeconds ? Number(body.timeoutSeconds) : 30,
      alertOnFailure: Boolean(body.alertOnFailure),
      tags: Array.isArray(body.tags) ? body.tags : [],
    };

    setInterfaces([newInterface, ...current]);
    return NextResponse.json({ success: true, item: newInterface }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create interface: ' + String(error) }, { status: 400 });
  }
}
