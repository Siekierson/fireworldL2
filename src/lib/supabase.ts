import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

console.log('Initializing Supabase client with URL:', supabaseUrl);

export const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true
  },
  realtime: {
    params: {
      eventsPerSecond: 10
    }
  },
  db: {
    schema: 'public'
  },
  global: {
    headers: {
      'x-application-name': 'fireworld'
    }
  }
});

export async function setJWTContext(token: string) {
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    console.log('Setting JWT context with payload:', { userID: payload.userID, name: payload.name });
    
    const { error } = await supabase.rpc('set_jwt_context', {
      jwt_token: JSON.stringify(payload)
    });
    
    if (error) {
      console.error('Error setting JWT context:', error);
      throw error;
    }
    
    console.log('JWT context set successfully');
  } catch (error) {
    console.error('Error in setJWTContext:', error);
    throw error;
  }
}

export async function checkRealtimeConnection() {
  try {
    const channels = await supabase.realtime.getChannels();
    const status = channels.length > 0 ? 'connected' : 'disconnected';
    console.log('Realtime connection status:', status);
    return status;
  } catch (error) {
    console.error('Error checking realtime status:', error);
    throw error;
  }
} 