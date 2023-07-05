import useAuthModal from './useAuthModal';
import usePlayer from './usePlayer';
import useSubscribeModal from './useSubscribeModal';
import { useUser } from './useUser';

import { Song } from '@/types';

const useOnPlay = (songs: Song[]) => {
  const subscribeModal = useSubscribeModal();
  const player = usePlayer();
  const authModal = useAuthModal();
  const { user, subscription } = useUser();

  const onPlay = (id: string) => {
    //for auth users
    if (!user) {
      return authModal.onOpen();
    }

    if (!subscription) {
      return subscribeModal.onOpen();
    }

    player.setId(id);
    player.setIds(songs.map((song) => song.id));
  };

  return onPlay;
};

export default useOnPlay;
