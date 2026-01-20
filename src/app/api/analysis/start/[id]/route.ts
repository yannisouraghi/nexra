import { NextRequest, NextResponse } from 'next/server';
import { NEXRA_API_URL } from '@/config/api';

// POST: Start analysis processing
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  try {
    const response = await fetch(`${NEXRA_API_URL}/analysis/${id}/start`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    const data = await response.json();
    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error('Failed to start analysis:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to start analysis' },
      { status: 500 }
    );
  }
}
