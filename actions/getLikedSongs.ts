import { cookies } from 'next/headers';
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { Song } from '@/types';

const getLikedSongs = async (): Promise<Song[]> => {
  try {
    const supabase = createServerComponentClient({
      cookies: cookies,
    });

    const {
      data: { session },
    } = await supabase.auth.getSession();

    const { data, error } = await supabase
      .from('liked_songs')
      .select('*, songs(*)')
      .eq('user_id', session?.user?.id)
      .order('created_at', { ascending: false });

    if (error) {
      console.log(error);
      return [];
    }

    if (!data) {
      return [];
    }

    return data.map((item) => ({ ...item.songs }));
  } catch (error) {
    console.log(error);
    return [];
  }
};

export default getLikedSongs;
