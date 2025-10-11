import { useEffect, useState, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import classNames from 'classnames';
import { FiHeart, FiMessageCircle } from 'react-icons/fi';
import {
  ProfileHeader,
  UserListModal,
  Loader,
} from '@/components';
import { useLayout } from '@/context/LayoutContext.js';
import {
  fetchProfile,
  fetchProfilePosts,
  followProfile,
  unfollowProfile,
  fetchFollowers,
  fetchFollowing,
  clearFollowLists,
  selectProfilePosts,
} from '@/store/slices/profileSlice.js';
import { logout } from '@/store/slices/authSlice.js';
import styles from './ProfilePage.module.css';

const POSTS_LIMIT = 12;
const formatCounter = (value) => new Intl.NumberFormat('en-US').format(Math.max(0, value ?? 0));

const ProfilePage = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const params = useParams();
  const { openPostModal } = useLayout();
  const authUser = useSelector((state) => state.auth.user);

  const [followersOpen, setFollowersOpen] = useState(false);
  const [followingOpen, setFollowingOpen] = useState(false);

  const profileState = useSelector((state) => state.profile);
  const posts = useSelector(selectProfilePosts);
  const followStatuses = useSelector((state) => state.profile.followStatusById);

  const effectiveUsername = params.username === 'me' && authUser?.username ? authUser.username : params.username;

  useEffect(() => {
    if (params.username === 'me' && authUser?.username) {
      navigate(`/profile/${authUser.username}`, { replace: true });
    }
  }, [params.username, authUser?.username, navigate]);

  useEffect(() => {
    const highlightPostId = location.state?.highlightPostId;
    if (highlightPostId) {
        openPostModal(highlightPostId);
        navigate(location.pathname, { replace: true, state: {} });
    }
  }, [location, navigate, openPostModal]);

  useEffect(() => {
    if (!effectiveUsername || effectiveUsername === 'me') return;
    dispatch(fetchProfile({ username: effectiveUsername }));
    dispatch(fetchProfilePosts({ username: effectiveUsername, page: 1, limit: POSTS_LIMIT }));
    dispatch(clearFollowLists());
  }, [dispatch, effectiveUsername]);

  const followPending = profileState.profile ? followStatuses[profileState.profile.id] === 'loading' : false;

  const handleFollowToggle = () => {
    if (!profileState.profile) return;
    const action = profileState.profile.isFollowed ? unfollowProfile : followProfile;
    dispatch(action({ userId: profileState.profile.id }));
  };

  const handleOpenFollowers = () => {
    if (!profileState.profile) return;
    dispatch(clearFollowLists());
    setFollowersOpen(true);
    dispatch(fetchFollowers({ userId: profileState.profile.id, page: 1, limit: 20 }));
  };

  const handleOpenFollowing = () => {
    if (!profileState.profile) return;
    dispatch(clearFollowLists());
    setFollowingOpen(true);
    dispatch(fetchFollowing({ userId: profileState.profile.id, page: 1, limit: 20 }));
  };

  const handleLoadMoreFollowers = () => {
    if (!profileState.profile || !profileState.followers.hasMore || profileState.followers.status === 'loading') return;
    dispatch(fetchFollowers({ userId: profileState.profile.id, page: profileState.followers.page, limit: 20 }));
  };

  const handleLoadMoreFollowing = () => {
    if (!profileState.profile || !profileState.following.hasMore || profileState.following.status === 'loading') return;
    dispatch(fetchFollowing({ userId: profileState.profile.id, page: profileState.following.page, limit: 20 }));
  };

  const handleLogout = async () => {
    await dispatch(logout());
    navigate('/login');
  };

  const handleMessage = () => {
    if (!profileState.profile) return;
    navigate(`/messenger?user=${profileState.profile.username}`);
  };

  const handleEditProfile = () => {
    navigate('/profile/edit');
  };

  const handleOpenPost = (postId) => openPostModal(postId);

  const handleLoadMorePosts = () => {
    if (!effectiveUsername || effectiveUsername === 'me' || !profileState.posts.hasMore || profileState.posts.isLoadingMore) return;
    dispatch(fetchProfilePosts({
      username: effectiveUsername,
      page: profileState.posts.nextPage,
      limit: POSTS_LIMIT,
    }));
  };
  
  const handleSelectUser = (user) => {
    if (!user?.username) return;
    setFollowersOpen(false);
    setFollowingOpen(false);
    navigate(`/profile/${user.username}`);
  };

  const profileStatus = profileState.status;
  const postsStatus = profileState.posts.status;

  return (
    <main className={styles.page}>
      {(profileStatus === 'idle' || profileStatus === 'loading') && (
        <div className={styles.centered}><Loader /></div>
      )}

      {profileStatus === 'failed' && (
        <div className={styles.centered}>
          <p className={styles.error}>{profileState.error ?? 'Failed to load profile.'}</p>
        </div>
      )}

      {profileStatus === 'succeeded' && profileState.profile && (
        <div className={styles.content}>
          <ProfileHeader
            profile={profileState.profile}
            isCurrentUser={profileState.isCurrentUser}
            onEdit={handleEditProfile}
            onLogout={handleLogout}
            onFollowToggle={handleFollowToggle}
            onMessage={handleMessage}
            followPending={followPending}
            onOpenFollowers={handleOpenFollowers}
            onOpenFollowing={handleOpenFollowing}
          />

          <section className={styles.postsSection}>
            {postsStatus === 'loading' && <div className={styles.centered}><Loader /></div>}
            {postsStatus === 'failed' && <div className={styles.centered}><p className={styles.error}>{profileState.posts.error ?? 'Failed to load posts.'}</p></div>}
            {postsStatus === 'succeeded' && posts.length === 0 && <div className={styles.centered}><p className={styles.empty}>No posts yet.</p></div>}

            {posts.length > 0 && (
              <>
                <div className={styles.postsGrid}>
                  {posts.map((post) => (
                    <button key={post.id} type="button" className={styles.postTile} onClick={() => handleOpenPost(post.id)}>
                      <img src={post.media?.[0]?.url} alt={post.caption ?? 'Post preview'} />
                      <div className={styles.postOverlay}>
                        <span><FiHeart /> {formatCounter(post.likesCount)}</span>
                        <span><FiMessageCircle /> {formatCounter(post.commentsCount)}</span>
                      </div>
                    </button>
                  ))}
                </div>
                {profileState.posts.hasMore && (
                  <div className={styles.loadMoreWrapper}>
                    <button type="button" className={classNames(styles.loadMoreButton, { [styles.loading]: profileState.posts.isLoadingMore })} onClick={handleLoadMorePosts} disabled={profileState.posts.isLoadingMore}>
                      {profileState.posts.isLoadingMore ? 'Loading...' : 'Load more'}
                    </button>
                  </div>
                )}
              </>
            )}
          </section>
        </div>
      )}

      <UserListModal
        title="Followers"
        isOpen={followersOpen}
        onClose={() => setFollowersOpen(false)}
        items={profileState.followers.items}
        status={profileState.followers.status}
        hasMore={profileState.followers.hasMore}
        onLoadMore={handleLoadMoreFollowers}
        onSelectUser={handleSelectUser}
      />
      <UserListModal
        title="Following"
        isOpen={followingOpen}
        onClose={() => setFollowingOpen(false)}
        items={profileState.following.items}
        status={profileState.following.status}
        hasMore={profileState.following.hasMore}
        onLoadMore={handleLoadMoreFollowing}
        onSelectUser={handleSelectUser}
      />
    </main>
  );
};

export default ProfilePage;