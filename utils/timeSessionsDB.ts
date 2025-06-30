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

export interface GroupStat {
  id: string;
  user_id: string;
  group_name: string;
  session_count: number;
  total_duration: number;
  last_updated: Date;
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
    .update({start_time: session.start_time, end_time: session.end_time, duration: session.duration, group: session.group})
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

export async function fetchGroupList(user: User): Promise<GroupStat[]> {
  if (!user?.id) {
    return [];
  }

  try {
    const { data, error } = await supabase
      .from('group_stats')
      .select('*')
      .eq('user_id', user.id)
      .order('total_duration', { ascending: false });
    
      
    if (error) {
      console.error('Error fetching group statistics:', error);
      throw error;
    }

    return data.map(stat => ({
      ...stat,
      start_time: new Date(stat.start_time),
      end_time: stat.end_time ? new Date(stat.end_time) : null
    }));
  } 
  catch (error) {
    console.error('Error in fetchGroupList:', error);
    return []; 
  }
}

export async function updateGroupList(user: User): Promise<void> {
  if (!user?.id) {
    throw new Error('User ID is required');
  }

  try {

    const { data: groupData, error: groupError } = await supabase
      .from('time_sessions')
      .select('group, duration')
      .eq('user_id', user.id)
      .not('group', 'is', null)
      .not('duration', 'is', null)
      .gt('duration', 0);

    if (groupError) {
      console.error('Error fetching sessions for group stats:', groupError);
      throw groupError;
    }

    if (!groupData || groupData.length === 0) {

      await supabase.from('group_stats').delete().eq('user_id', user.id);
      return;
    }


    const groupStats = groupData.reduce((acc, session) => {
      const group = session.group;
      if (!acc[group]) {
        acc[group] = { count: 0, totalDuration: 0 };
      }
      acc[group].count += 1;
      acc[group].totalDuration += session.duration;
      return acc;
    }, {} as { [key: string]: { count: number; totalDuration: number } });

    const { data: existingStats, error: fetchError } = await supabase
      .from('group_stats')
      .select('group_name, session_count, total_duration')
      .eq('user_id', user.id);

    if (fetchError) {
      console.error('Error fetching existing group stats:', fetchError);
      throw fetchError;
    }

    const existingStatsMap = (existingStats || []).reduce((acc, stat) => {
      acc[stat.group_name] = {
        count: stat.session_count,
        totalDuration: stat.total_duration
      };
      return acc;
    }, {} as { [key: string]: { count: number; totalDuration: number } });

    const currentTime = new Date().toISOString();
    const statsToUpsert: any[] = [];
    const groupsToDelete: string[] = [];

    Object.entries(groupStats).forEach(([groupName, stats]) => {
      const existing = existingStatsMap[groupName];
      if (!existing || 
          existing.count !== stats.count || 
          existing.totalDuration !== stats.totalDuration) {
        statsToUpsert.push({
          user_id: user.id,
          group_name: groupName,
          session_count: stats.count,
          total_duration: stats.totalDuration,
          last_updated: currentTime
        });
      }
    });

    Object.keys(existingStatsMap).forEach(groupName => {
      if (!groupStats[groupName]) {
        groupsToDelete.push(groupName);
      }
    });

    const operations = [];


    if (groupsToDelete.length > 0) {
      operations.push(
        supabase
          .from('group_stats')
          .delete()
          .eq('user_id', user.id)
          .in('group_name', groupsToDelete)
      );
    }
    if (statsToUpsert.length > 0) {
      operations.push(
        supabase
          .from('group_stats')
          .upsert(statsToUpsert, {
            onConflict: 'user_id,group_name'
          })
      );
    }


    if (operations.length > 0) {
      const results = await Promise.all(operations);

      results.forEach((result, index) => {
        if (result.error) {
          console.error(`Error in batch operation ${index}:`, result.error);
          throw result.error;
        }
      });
    }

  } catch (error) {
    console.error('Error in updateGroupList:', error);
    throw error;
  }
}
