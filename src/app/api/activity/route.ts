import { NextResponse } from 'next/server';
import { activityController } from '@/controllers/activityController';
import { authController } from '@/controllers/authController';
import { supabase } from '@/lib/supabase';

export async function POST(request: Request) {
  try {
    const token = request.headers.get('Authorization')?.split(' ')[1];
    if (!token) {
      return NextResponse.json({ error: 'No token provided' }, { status: 401 });
    }

    const user = authController.verifyToken(token) as { userID: string };
    console.log('Verified user:', user);

    const body = await request.json();
    console.log('Request body:', body);
    
    const { type, postid, message } = body;

    if (!type || !postid) {
      console.log('Missing required fields:', { type, postid });
      return NextResponse.json(
        { error: 'Type and postid are required' },
        { status: 400 }
      );
    }

    console.log('Creating activity with:', { type, postid, userid: user.userID, message });
    const activity = await activityController.createActivity(type, postid, user.userID, message);
    console.log('Created activity:', activity);
    
    return NextResponse.json(activity);
  } catch (error) {
    console.error('Error in POST /api/activity:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to create activity' },
      { status: 400 }
    );
  }
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const postID = searchParams.get('postID');

    if (!postID) {
      return NextResponse.json({ error: 'Post ID is required' }, { status: 400 });
    }

    const { data, error } = await supabase
      .from('activities')
      .select(`
        activityid,
        type,
        postid,
        userid,
        message,
        created_at,
        users:userid (name, imageurl)
      `)
      .eq('postid', postID)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching activities:', error);
      return NextResponse.json({ error: 'Failed to fetch activities' }, { status: 400 });
    }

    return NextResponse.json(data || [], { status: 200 });
  } catch (error) {
    console.error('Error in GET /api/activity:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const token = request.headers.get('Authorization')?.split(' ')[1];
    if (!token) {
      return NextResponse.json({ error: 'No token provided' }, { status: 401 });
    }

    const user = authController.verifyToken(token) as { userID: string };
    const { activityID } = await request.json();
    await activityController.deleteActivity(activityID, user.userID);
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to delete activity' }, { status: 400 });
  }
} 