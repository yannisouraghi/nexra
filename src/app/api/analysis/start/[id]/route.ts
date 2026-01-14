import { NextRequest, NextResponse } from 'next/server';

const NEXRA_API_URL = process.env.NEXRA_API_URL || 'http://localhost:8787';

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
