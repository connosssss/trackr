import { supabase } from './supabase';
import { User } from '@supabase/supabase-js';

export async function setUpSettings(user: User) {
    const { data, error } = await supabase
        .from('user_settings')
        .select('*')
        .eq('user_id', user.id)
        .single();

    if (error || !data) {
        await supabase.from('user_settings').insert({
            user_id: user.id,
            theme: 'default'
        });
    }
}

export async function fetchUserTheme(userId: string): Promise<string> {
    const { data, error } = await supabase
        .from('user_settings')
        .select('theme')
        .eq('user_id', userId)
        .single();

    if (error) {
        console.error('Error fetching theme:', error);
        return 'default';
    }

    return data.theme;
}

export async function updateUserTheme(userId: string, theme: string): Promise<boolean> {
    const { error } = await supabase
        .from('user_settings')
        .update({ theme })
        .eq('user_id', userId);

    if (error) {
        console.error('Error updating thme:', error);
        return false;
    }

    return true;
}