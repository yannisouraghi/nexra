import { NextRequest, NextResponse } from 'next/server';
import { NEXRA_API_URL } from '@/config/api';

// Pre-check login to detect verification requirements before NextAuth
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password } = body;

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      );
    }

    const response = await fetch(`${NEXRA_API_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });

    const data = await response.json();

    // Check for verification requirement (403 with requiresVerification)
    if (response.status === 403 && data.requiresVerification) {
      return NextResponse.json({
        success: false,
        requiresVerification: true,
        email: data.email || email,
        error: data.error || 'Please verify your email',
      }, { status: 403 });
    }

    if (!response.ok) {
      return NextResponse.json(
        { success: false, error: data.error || 'Invalid credentials' },
        { status: response.status }
      );
    }

    // Login is valid, frontend should now call signIn
    return NextResponse.json({
      success: true,
      canProceed: true,
    });
  } catch (error) {
    console.error('Check login error:', error);
    return NextResponse.json(
      { error: 'Login check failed' },
      { status: 500 }
    );
  }
}
