import { supabase } from '@/lib/supabase';
import { Activity } from '@/types/database';

export const activityController = {
  async createActivity(type: 'like' | 'comment', postid: string, userid: string, message?: string) {
    try {
      console.log('Creating activity with params:', { type, postid, userid, message });

      if (type === 'like') {
        console.log('Checking for existing like...');
        const { data: existingActivity, error: checkError } = await supabase
          .from('activities')
          .select('*')
          .match({ type, postid, userid })
          .single();

        console.log('Existing activity check result:', { existingActivity, checkError });

        if (checkError && checkError.code !== 'PGRST116') {
          throw checkError;
        }

        if (existingActivity) {
          console.log('Activity exists, removing like...');
          const { error: deleteError } = await supabase
            .from('activities')
            .delete()
            .match({ activityid: existingActivity.activityid });

          if (deleteError) throw deleteError;
          console.log('Like removed successfully');
          return { type: 'unlike', postid, userid };
        }
      }

      console.log('Creating new activity...');
      const { data: activity, error: activityError } = await supabase
        .from('activities')
        .insert([{
          type,
          postid,
          userid,
          message
        }])
        .select(`
          activityid,
          type,
          postid,
          userid,
          message,
          created_at,
          users:userid (name, imageurl)
        `)
        .single();

      console.log('Insert result:', { activity, activityError });

      if (activityError) throw activityError;

      return activity;
    } catch (error) {
      console.error('Error in createActivity:', error);
      throw error;
    }
  },

  async getPostActivities(postid: string) {
    try {
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
        .eq('postid', postid)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data;
    } catch (error) {
      throw error;
    }
  },

  async deleteActivity(activityid: string, userid: string) {
    try {
      const { error } = await supabase
        .from('activities')
        .delete()
        .match({ activityid, userid });

      if (error) throw error;
      return true;
    } catch (error) {
      throw error;
    }
  }
}; 