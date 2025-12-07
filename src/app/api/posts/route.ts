import { NextResponse } from 'next/server';
import { postController } from '@/controllers/postController';
import { authController } from '@/controllers/authController';
import jwt from 'jsonwebtoken';
import { supabase } from '@/lib/supabase';

export async function POST(request: Request) {
  try {
    const token = request.headers.get('Authorization')?.split(' ')[1];
    if (!token) {
      return NextResponse.json({ error: 'No token provided' }, { status: 401 });
    }

    try {
      const user = authController.verifyToken(token) as { userID: string };
      console.log('User from token:', user);
      
      if (!user.userID) {
        return NextResponse.json({ error: 'Invalid token: missing userID' }, { status: 401 });
      }

      const body = await request.json();
      
      if (!body || typeof body !== 'object') {
        return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
      }

      const { text } = body;
      if (!text || typeof text !== 'string') {
        return NextResponse.json({ error: 'Post text is required and must be a string' }, { status: 400 });
      }

      const post = await postController.createPost(text, user.userID);
      return NextResponse.json(post);
    } catch (error) {
      if (error instanceof jwt.JsonWebTokenError) {
        return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
      }
      console.error('Error in POST /api/posts:', error);
      return NextResponse.json({ 
        error: error instanceof Error ? error.message : 'Failed to create post',
        details: error instanceof Error ? error.stack : undefined
      }, { status: 500 });
    }
  } catch (error) {
    console.error('Error in POST /api/posts:', error);
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : 'Failed to create post',
      details: error instanceof Error ? error.stack : undefined
    }, { status: 500 });
  }
}

export async function GET(request: Request) {
  try {
    console.log('GET /api/posts called');
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '5');
    const offset = (page - 1) * limit;

    const { data: posts, error: postsError } = await supabase
      .from('posts')
      .select(`
        *,
        users:ownerid (name, imageurl),
        activities (
          activityid,
          type,
          userid,
          message,
          created_at,
          users:userid (name, imageurl)
        )
      `)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (postsError) throw postsError;

    console.log('Posts fetched successfully:', posts);
    return NextResponse.json(posts);
  } catch (error) {
    console.error('Error in GET /api/posts:', error);
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : 'Failed to fetch posts',
      details: error instanceof Error ? error.stack : undefined
    }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const token = request.headers.get('Authorization')?.split(' ')[1];
    if (!token) {
      return NextResponse.json({ error: 'No token provided' }, { status: 401 });
    }

    const user = authController.verifyToken(token) as { userID: string };
    const { postID } = await request.json();

    const { data: post, error: fetchError } = await supabase
      .from('posts')
      .select('ownerid')
      .eq('postid', postID)
      .single();

    if (fetchError) {
      console.error('Error fetching post:', fetchError);
      return NextResponse.json({ error: 'Post not found' }, { status: 404 });
    }

    if (post.ownerid !== user.userID) {
      return NextResponse.json({ error: 'You are not authorized to delete this post' }, { status: 403 });
    }

    await postController.deletePost(postID, user.userID);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error in DELETE /api/posts:', error);
    if (error instanceof jwt.JsonWebTokenError) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }
    return NextResponse.json({ error: 'Failed to delete post' }, { status: 400 });
  }
} 