import { NextResponse } from 'next/server';
import { authController } from '@/controllers/authController';

export async function POST(request: Request) {
  try {
    const { name, password } = await request.json();
    
    if (!name || !password) {
      return NextResponse.json(
        { error: 'Name and password are required' },
        { status: 400 }
      );
    }

    const result = await authController.register(name, password);
    return NextResponse.json(result);
  } catch (error: any) {
    console.error('Registration API error:', error);
    return NextResponse.json(
      { error: error.message || 'Registration failed' },
      { status: 400 }
    );
  }
}

export async function PUT(request: Request) {
  try {
    const { name, password } = await request.json();
    const result = await authController.login(name, password);
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json({ error: 'Login failed' }, { status: 401 });
  }
}

export async function GET(request: Request) {
  try {
    const token = request.headers.get('Authorization')?.split(' ')[1];
    if (!token) {
      return NextResponse.json({ error: 'No token provided' }, { status: 401 });
    }
    const user = authController.verifyToken(token);
    return NextResponse.json(user);
  } catch (error) {
    return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
  }
} 