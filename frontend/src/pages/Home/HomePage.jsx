import { useCallback, useEffect, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Loader } from '@/components';
import PostCard from '@/components/Post/PostCard.jsx';
import useInfiniteScroll from '@/hooks/useInfiniteScroll.js';
import { useLayout } from '@/context/LayoutContext.js';
import {
  fetchFeed,
  togglePostLike,
  followAuthor,
  applyPostLikeUpdate,
  applyPostCommentUpdate,
  fetchPostById,
} from '@/store/slices/postSlice.js';
import { getSocket } from '@/services/socketClient.js';
import styles from './HomePage.module.css';

const FEED_LIMIT = 10;

const HomePage = () => {
  const dispatch = useDispatch();
  const { openPostModal } = useLayout();
  const feed = useSelector((state) => state.posts.feed);
  const viewerId = useSelector((state) => state.auth.user?.id ?? null);
  const followStatuses = useSelector((state) => state.profile.followStatusById);
  const posts = useMemo(
    () => feed.ids.map((id) => feed.entities[id]).filter(Boolean),
    [feed.entities, feed.ids],
  );

  useEffect(() => {
    if (feed.status === 'idle') {
      dispatch(fetchFeed({ page: 1, limit: FEED_LIMIT }));
    }
  }, [dispatch, feed.status]);

  useEffect(() => {
    const socket = getSocket();
    if (!socket) return undefined;

    const handleLike = (payload) => dispatch(applyPostLikeUpdate({ ...payload, viewerId }));
    const handleComment = (payload) => dispatch(applyPostCommentUpdate(payload));
    const handlePostNew = (payload) => {
      if (payload?.id) dispatch(fetchPostById({ postId: payload.id }));
    };

    socket.on('post:like', handleLike);
    socket.on('post:comment', handleComment);
    socket.on('post:new', handlePostNew);

    return () => {
      socket.off('post:like', handleLike);
      socket.off('post:comment', handleComment);
      socket.off('post:new', handlePostNew);
    };
  }, [dispatch, viewerId]);

  const loadMore = useCallback(() => {
    if (!feed.hasMore || feed.isLoadingMore || feed.status === 'loading') return;
    dispatch(fetchFeed({ page: feed.nextPage, limit: FEED_LIMIT }));
  }, [dispatch, feed.hasMore, feed.isLoadingMore, feed.nextPage, feed.status]);

  const sentinelRef = useInfiniteScroll({
    disabled: !feed.hasMore || feed.isLoadingMore || feed.status === 'loading' || posts.length === 0,
    onIntersect: loadMore,
  });

  const handleToggleLike = (postId) => dispatch(togglePostLike({ postId }));
  const handleOpenPost = (postId) => openPostModal(postId);
  const handleFollow = (userId) => dispatch(followAuthor({ userId }));

  return (
    <main className={styles.page}>
      <section className={styles.feed}>
        {posts.map((post) => (
          <PostCard
            key={post.id}
            post={post}
            onToggleLike={handleToggleLike}
            onOpenPost={handleOpenPost}
            onFollow={handleFollow}
            isFollowPending={followStatuses[post.author?.id] === 'loading'}
          />
        ))}
        {feed.status === 'loading' && ( <div className={styles.loader}><Loader /></div> )}
        {feed.isLoadingMore && feed.status === 'succeeded' && ( <div className={styles.loader}><Loader /></div> )}
        {feed.error && feed.status === 'failed' && ( <div className={styles.error}>{feed.error}</div> )}
        {feed.hasMore && feed.status === 'succeeded' && ( <div ref={sentinelRef} className={styles.sentinel} aria-hidden="true" /> )}
        {!feed.hasMore && feed.status === 'succeeded' && (
          <div className={styles.endMarker}>
            <span className={styles.endIcon}>✓</span>
            <h2>You've seen all the updates</h2>
            <p>You have viewed all new publications</p>
          </div>
        )}
      </section>
    </main>
  );
};

export default HomePage;