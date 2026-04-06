import { NextResponse } from 'next/server';
import { updateAdminUserStatus } from '../../../../../lib/api';

async function updateStatus(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const url = new URL(request.url);
    const json = request.headers.get('content-type')?.includes('application/json')
      ? ((await request.json()) as { status?: 'ACTIVE' | 'SUSPENDED' })
      : null;
    const status = (json?.status ?? url.searchParams.get('status')) as 'ACTIVE' | 'SUSPENDED';
    const result = await updateAdminUserStatus(id, status);
    return NextResponse.json(result);
  } catch {
    return NextResponse.json({ error: 'Unable to update user status' }, { status: 400 });
  }
}

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  return updateStatus(request, context);
}

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  return updateStatus(request, context);
}
