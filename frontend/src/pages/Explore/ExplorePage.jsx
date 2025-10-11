import { useCallback, useEffect, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import PostMasonry from '@/components/Post/PostMasonry.jsx';
import { useLayout } from '@/context/LayoutContext.js';
import { getSocket } from '@/services/socketClient.js';
import {
  applyPostLikeUpdate,
  applyPostCommentUpdate,
  fetchExplore,
} from '@/store/slices/postSlice.js';
import styles from './ExplorePage.module.css';

const EXPLORE_LIMIT = 21;

const ExplorePage = () => {
  const dispatch = useDispatch();
  const { openPostModal } = useLayout();
  const viewerId = useSelector((state) => state.auth.user?.id ?? null);
  const explore = useSelector((state) => state.posts.explore);
  const posts = useMemo(
    () => explore.ids.map((id) => explore.entities[id]).filter(Boolean),
    [explore.entities, explore.ids],
  );
  
  useEffect(() => {
    if (explore.status === 'idle') {
      dispatch(fetchExplore({ limit: EXPLORE_LIMIT }));
    }
  }, [dispatch, explore.status]);

  useEffect(() => {
    const socket = getSocket();
    if (!socket) return undefined;

    const handleLike = (payload) => dispatch(applyPostLikeUpdate({ ...payload, viewerId }));
    const handleComment = (payload) => dispatch(applyPostCommentUpdate(payload));

    socket.on('post:like', handleLike);
    socket.on('post:comment', handleComment);

    return () => {
      socket.off('post:like', handleLike);
      socket.off('post:comment', handleComment);
    };
  }, [dispatch, viewerId]);

  const handleRefresh = useCallback(() => {
    dispatch(fetchExplore({ limit: EXPLORE_LIMIT }));
  }, [dispatch]);

  const handleOpenPost = useCallback((postId) => {
      openPostModal(postId);
    },[openPostModal]);

  return (
    <main className={styles.container}>
      {explore.status === 'loading' && (
        <div className={styles.status}>Loading...</div>
      )}
      {explore.status === 'failed' && (
        <div className={styles.status}>
          <p>{explore.error ?? 'Failed to load explore feed'}</p>
          <button
            type="button"
            className={styles.retryButton}
            onClick={handleRefresh}
          >
            Try again
          </button>
        </div>
      )}
      {explore.status === 'empty' && (
        <div className={styles.status}>No posts to explore yet.</div>
      )}
      {explore.status === 'succeeded' && posts.length > 0 && (
        <PostMasonry posts={posts} onSelect={handleOpenPost} />
      )}
    </main>
  );
};

export default ExplorePage;