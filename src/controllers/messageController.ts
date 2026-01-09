import { supabase, setJWTContext } from '@/lib/supabase';
import { Message } from '@/types/database';

interface MessagePayload {
  messageid: string;
  userid: string;
  message: string;
  towhoid: string;
  created_at: string;
}

interface BroadcastPayload {
  message: string;
  timestamp: string;
  channel: string;
  userID: string;
}

export const messageController = {
  async sendMessage(userID: string, message: string, toWhoID: string, token: string) {
    try {
      if (!message.trim()) {
        throw new Error('Message cannot be empty');
      }

      await setJWTContext(token);

      const { data: users, error: usersError } = await supabase
        .from('users')
        .select('userid, name, imageurl')
        .in('userid', [userID, toWhoID]);

      if (usersError) throw usersError;
      if (!users || users.length !== 2) {
        throw new Error('One or both users do not exist');
      }

      const sender = users.find(u => u.userid === userID);
      if (!sender) throw new Error('Sender not found');

      const { data, error } = await supabase
        .from('messages')
        .insert([{
          userid: userID,
          message: message.trim(),
          towhoid: toWhoID,
          created_at: new Date()
        }])
        .select()
        .single();

      if (error) throw error;

      return {
        messageID: data.messageid,
        userID: data.userid,
        message: data.message,
        toWhoID: data.towhoid,
        created_at: data.created_at,
        users: {
          name: sender.name,
          imageURL: sender.imageurl
        }
      };
    } catch (error) {
      console.error('Error in sendMessage:', error);
      throw error;
    }
  },

  async getMessages(userID: string, otherUserID: string, token: string) {
    try {
      await setJWTContext(token);

      const { data: users, error: usersError } = await supabase
        .from('users')
        .select('userid, name, imageurl')
        .in('userid', [userID, otherUserID]);

      if (usersError) throw usersError;
      if (!users || users.length !== 2) {
        throw new Error('One or both users do not exist');
      }

      const userMap = new Map(users.map(u => [u.userid, { name: u.name, imageURL: u.imageurl }]));

      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .or(`and(userid.eq.${userID},towhoid.eq.${otherUserID}),and(userid.eq.${otherUserID},towhoid.eq.${userID})`)
        .order('created_at', { ascending: true });

      if (error) throw error;

      return data.map(message => ({
        messageID: message.messageid,
        userID: message.userid,
        message: message.message,
        toWhoID: message.towhoid,
        created_at: message.created_at,
        users: userMap.get(message.userid)
      }));
    } catch (error) {
      console.error('Error in getMessages:', error);
      throw error;
    }
  },

  async subscribeToMessages(userID: string, callback: (message: Message) => void) {
    console.log('Setting up subscription for user:', userID);
    
    const channelName = `messages:${userID}`;
    console.log('Creating channel:', channelName);

    const channel = supabase.channel(channelName, {
      config: {
        broadcast: { self: true },
        presence: { key: userID }
      }
    });

    channel
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'messages'
        },
        async (payload: any) => {
          console.log('Received database change:', {
            eventType: payload.eventType,
            table: payload.table,
            schema: payload.schema,
            payload,
            channel: channelName,
            currentUser: userID,
            timestamp: new Date().toISOString()
          });

          if (payload.eventType !== 'INSERT') {
            console.log('Ignoring non-INSERT event:', payload.eventType);
            return;
          }

          try {
            const message = payload.new as MessagePayload;
            
            if (message.userid !== userID && message.towhoid !== userID) {
              console.log('Message is not for current user, skipping:', {
                messageID: message.messageid,
                from: message.userid,
                to: message.towhoid,
                currentUser: userID
              });
              return;
            }

            console.log('Processing new message:', {
              messageID: message.messageid,
              from: message.userid,
              to: message.towhoid,
              timestamp: message.created_at,
              channel: channelName
            });

            const { data: userData, error: userError } = await supabase
              .from('users')
              .select('name, imageurl')
              .eq('userid', message.userid)
              .single();

            if (userError || !userData) {
              console.error('Error fetching user data:', {
                error: userError,
                userID: message.userid,
                channel: channelName
              });
              return;
            }

            const user = userData as { name: string; imageurl?: string };

            const processedMessage: Message = {
              messageID: message.messageid,
              userID: message.userid,
              toWhoID: message.towhoid,
              message: message.message,
              created_at: message.created_at,
              users: {
                name: user.name,
                imageURL: user.imageurl || ''
              }
            };

            console.log('Sending processed message to callback:', {
              messageID: processedMessage.messageID,
              from: processedMessage.userID,
              to: processedMessage.toWhoID,
              channel: channelName,
              timestamp: new Date().toISOString()
            });

            callback(processedMessage);
          } catch (error) {
            console.error('Error processing message:', {
              error,
              payload,
              channel: channelName,
              timestamp: new Date().toISOString()
            });
          }
        }
      )
      .subscribe((status) => {
        console.log('Subscription status:', {
          status,
          channel: channelName,
          timestamp: new Date().toISOString()
        });

        if (status === 'SUBSCRIBED') {
          console.log('Successfully subscribed to messages channel:', channelName);
          
          setTimeout(() => {
            const testPayload = {
              channel: channelName,
              message: 'Test message from subscription',
              timestamp: new Date().toISOString(),
              userID: userID
            };
            console.log('Sending test message to channel:', channelName);
            channel.send({
              type: 'broadcast',
              event: 'test',
              payload: testPayload
            });
          }, 1000);
        }
      });

    channel.on('broadcast', { event: 'test' }, (payload: any) => {
      console.log('Received test message:', {
        payload,
        channel: channelName,
        currentUser: userID,
        timestamp: new Date().toISOString()
      });
    });

    return () => {
      console.log('Cleaning up subscription for channel:', channelName);
      channel.unsubscribe();
    };
  }
}; 