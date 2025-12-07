import { NextResponse } from 'next/server';
import { authController } from '@/controllers/authController';
import { supabase } from '@/lib/supabase';

export async function GET(request: Request) {
  try {
    const token = request.headers.get('Authorization')?.split(' ')[1];
    if (!token) {
      return NextResponse.json({ error: 'No token provided' }, { status: 401 });
    }

    const user = authController.verifyToken(token) as { userID: string };

    const { data, error } = await supabase
      .from('users')
      .select('userid, name, imageurl')
      .neq('userid', user.userID)
      .order('name');

    if (error) throw error;

    const users = data.map(user => ({
      userID: user.userid,
      name: user.name,
      imageURL: user.imageurl
    }));

    return NextResponse.json(users);
  } catch (error) {
    console.error('Error fetching users:', error);
    return NextResponse.json({ error: 'Failed to fetch users' }, { status: 400 });
  }
} 