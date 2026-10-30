import { NextResponse } from 'next/server';
import { getInterfaces, setInterfaces } from '@/lib/store';

export async function GET(
  _request: Request,
  props: { params: Promise<{ id: string }> }
) {
  const { id } = await props.params;
  const list = getInterfaces();
  const found = list.find((i) => i.id === id);

  if (!found) {
    return NextResponse.json({ error: 'Interface not found' }, { status: 404 });
  }

  return NextResponse.json(found);
}

export async function PATCH(
  request: Request,
  props: { params: Promise<{ id: string }> }
) {
  const { id } = await props.params;
  try {
    const updates = await request.json();
    const list = getInterfaces();
    const idx = list.findIndex((i) => i.id === id);

    if (idx === -1) {
      return NextResponse.json({ error: 'Interface not found' }, { status: 404 });
    }

    const updated = { ...list[idx], ...updates };
    list[idx] = updated;
    setInterfaces([...list]);

    return NextResponse.json({ success: true, item: updated });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update: ' + String(error) }, { status: 400 });
  }
}

export async function DELETE(
  _request: Request,
  props: { params: Promise<{ id: string }> }
) {
  const { id } = await props.params;
  const list = getInterfaces();
  const filtered = list.filter((i) => i.id !== id);

  if (filtered.length === list.length) {
    return NextResponse.json({ error: 'Interface not found' }, { status: 404 });
  }

  setInterfaces(filtered);
  return NextResponse.json({ success: true, message: 'Interface deleted' });
}

