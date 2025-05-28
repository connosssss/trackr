import { supabase } from './supabase';
import { User } from '@supabase/supabase-js';

export interface TimeSession {
  id: string;
  user_id: string;
  start_time: Date;
  end_time: Date | null;
  duration: number | null;
  group: string | null;
}

export async function fetchTimeSessions(user: User): Promise<TimeSession[]> {
  const { data, error } = await supabase
    .from('time_sessions')
    .select('*')
    .eq('user_id', user.id)
    .order('start_time', { ascending: false });
  
  if (error) {
    console.error('Error fetching time sessions:', error);
    throw error;
  }

  return data.map(session => ({
    ...session,
    start_time: new Date(session.start_time),
    end_time: session.end_time ? new Date(session.end_time) : null
  }));
}


export async function createTimeSession(session: Omit<TimeSession, 'id'>): Promise<TimeSession> {
  const { data, error } = await supabase
    .from('time_sessions')
    .insert([session])
    .select()
    .single();
  
  if (error) {
    console.error('Error creating time session:', error);
    console.error('Error details:', JSON.stringify(error));
    console.error('Session data:', JSON.stringify(session));
    throw error;
  }
  
  return {
    ...data,
    start_time: new Date(data.start_time),
    end_time: data.end_time ? new Date(data.end_time) : null
  };
}

export async function updateTimeSession(session: TimeSession): Promise<TimeSession> {
  const { data, error } = await supabase
    .from('time_sessions')
    .update({end_time: session.end_time, duration: session.duration})
    .eq('id', session.id)
    .select()
    .single();
  
  if (error) {
    console.error('Error updating time session:', error);
    throw error;
  }
  
  return {

    ...data,
    start_time: new Date(data.start_time),
    end_time: data.end_time ? new Date(data.end_time) : null

  };
}

export async function deleteTimeSession(sessionId: string): Promise<void> {
  const { data, error } = await supabase.from('time_sessions').delete().eq('id', sessionId).select();
  
  if (error) {
    console.error('Error deleting time session:', error);
    throw error;
  }

  if (!data || data.length === 0) {
    console.error('No session found with ID:', sessionId);
    throw new Error(`No session found with ID: ${sessionId}`);
  }
}