import { supabase } from '@/lib/supabase';
import { Post } from '@/types/database';

export const postController = {
  async inspectTable() {
    try {
      const { data: tableInfo, error: tableError } = await supabase
        .from('posts')
        .select('*')
        .limit(0);

      if (tableError) {
        console.error('Error getting table structure:', tableError);
        throw tableError;
      }

      console.log('Table structure:', tableInfo);

      const { data: sampleData, error: sampleError } = await supabase
        .from('posts')
        .select('*')
        .limit(1);

      if (sampleError) {
        console.error('Error getting sample data:', sampleError);
        throw sampleError;
      }

      console.log('Sample data:', sampleData);
      return sampleData;
    } catch (error) {
      console.error('Error in inspectTable:', error);
      throw error;
    }
  },

  async createPost(text: string, ownerID: string) {
    try {
      await this.inspectTable();
      
      console.log('Creating post with text:', text, 'for user:', ownerID);
      console.log('OwnerID type:', typeof ownerID);
      console.log('OwnerID value:', ownerID);
      
      const postData = {
        text,
        ownerid: ownerID
      };

      console.log('Post data to insert:', postData);

      const { data, error } = await supabase
        .from('posts')
        .insert([postData])
        .select()
        .single();

      if (error) {
        console.error('Supabase error in createPost:', error);
        throw new Error(`Failed to create post: ${error.message}`);
      }

      if (!data) {
        throw new Error('No data returned after creating post');
      }

      console.log('Successfully created post:', data);
      return data;
    } catch (error) {
      console.error('Error in createPost:', error);
      throw error;
    }
  },

  async getPosts() {
    try {
      console.log('Fetching posts from Supabase...');
      const { data: postsData, error: postsError } = await supabase
        .from('posts')
        .select('*')
        .order('created_at', { ascending: false });

      if (postsError) {
        console.error('Error fetching posts:', postsError);
        throw new Error(`Failed to fetch posts: ${postsError.message}`);
      }

      console.log('Successfully fetched posts:', postsData);

      const { data, error } = await supabase
        .from('posts')
        .select(`
          *,
          users (name, imageurl),
          activities (*)
        `)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Supabase error in getPosts:', error);
        throw new Error(`Failed to fetch posts: ${error.message}`);
      }

      if (!data) {
        console.log('No data returned from Supabase');
        return [];
      }

      console.log('Successfully fetched posts with relations:', data);
      return data;
    } catch (error) {
      console.error('Error in getPosts:', error);
      throw error;
    }
  },

  async deletePost(postID: string, ownerID: string) {
    try {
      const { error } = await supabase
        .from('posts')
        .delete()
        .match({ postid: postID, ownerid: ownerID });

      if (error) {
        console.error('Error deleting post:', error);
        throw error;
      }
      return true;
    } catch (error) {
      console.error('Error in deletePost:', error);
      throw error;
    }
  },

  async getUserPosts(userID: string) {
    try {
      const { data: postsData, error: postsError } = await supabase
        .from('posts')
        .select('*')
        .eq('ownerid', userID)
        .order('created_at', { ascending: false });

      if (postsError) {
        console.error('Error fetching user posts:', postsError);
        throw new Error(`Failed to fetch user posts: ${postsError.message}`);
      }

      console.log('Successfully fetched user posts:', postsData);

      const { data, error } = await supabase
        .from('posts')
        .select(`
          *,
          users (name, imageurl),
          activities (*)
        `)
        .eq('ownerid', userID)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error getting user posts:', error);
        throw error;
      }
      return data;
    } catch (error) {
      console.error('Error in getUserPosts:', error);
      throw error;
    }
  }
}; 