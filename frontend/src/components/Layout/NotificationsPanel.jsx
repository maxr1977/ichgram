import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import classNames from 'classnames';
import { useNavigate } from 'react-router-dom';
import Avatar from '@/components/Avatar/Avatar.jsx';
import Loader from '@/components/Loader/Loader.jsx';
import { useLayout } from '@/context/LayoutContext.js'; 
import formatShortTimeAgo from '@/utils/time.js';
import {
  selectNotificationsState,
  fetchNotifications,
  markNotificationRead,
} from '@/store/slices/notificationsSlice.js';
import styles from './Panel.module.css';

const notificationTextMap = {
  follow: 'started following you',
  like_post: 'liked your photo',
  comment_post: 'commented on your photo',
  like_comment: 'liked your comment',
  new_post: 'published a new post',
  message: 'sent you a message',
};

const NotificationsPanel = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { closePanel, openPostModal } = useLayout(); 
  const {
    items,
    status,
    error,
    hasMore,
    nextPage,
  } = useSelector(selectNotificationsState);

  useEffect(() => {
    if (status === 'idle') {
      dispatch(fetchNotifications({ page: 1 }));
    }
  }, [status, dispatch]);

  const newNotifications = items.filter((item) => !item.isRead);
  const earlierNotifications = items.filter((item) => item.isRead);

  const navigateToProfile = (username) => {
    closePanel();
    if (username) {
      navigate(`/profile/${username}`);
    }
  };
  
  const markAsRead = (notification) => {
    if (!notification.isRead) {
      dispatch(markNotificationRead({ notificationId: notification.id }));
    }
  };

  const handleNotificationClick = (notification) => {
    markAsRead(notification);
    const { type, metadata, actor } = notification;
    const postId = metadata?.postId ?? metadata?.post ?? null;

    closePanel(); 

    if (postId) {
      openPostModal(postId); 
      return;
    }
    
    if (type === 'message') {
      navigate('/messenger');
      return;
    }
    
    navigateToProfile(actor?.username);
  };
  
  const handleLoadMore = () => {
    dispatch(fetchNotifications({ page: nextPage }));
  };

  const renderNotification = (notification) => {
    const { actor } = notification;
    const actorInitials = (actor?.fullName || actor?.username || 'IG').slice(0, 2).toUpperCase();
    const message = notificationTextMap[notification.type] ?? 'sent you an update';

    return (
      <li key={notification.id}>
        <button
          type="button"
          className={classNames(
            styles.notificationItem,
            { [styles.notificationNew]: !notification.isRead },
          )}
          onClick={() => handleNotificationClick(notification)}
        >
          <Avatar
            src={actor?.avatarUrl || null}
            fallback={actorInitials}
            alt={`${actor?.username ?? 'User'} avatar`}
            size="sm"
          />
          <div className={styles.notificationInfo}>
            <div className={styles.notificationMessage}>
              <span
                role="button"
                tabIndex={0}
                className={styles.resultUsername}
                onClick={(event) => {
                  event.stopPropagation();
                  markAsRead(notification);
                  navigateToProfile(actor?.username);
                }}
                onKeyDown={(event) => {
                  if (event.key === 'Enter' || event.key === ' ') {
                    event.preventDefault();
                    event.stopPropagation();
                    markAsRead(notification);
                    navigateToProfile(actor?.username);
                  }
                }}
              >
                {actor?.username ?? 'User'}
              </span>
              {' '}
              {message}
            </div>
            <span className={styles.notificationMeta}>
              {formatShortTimeAgo(notification.createdAt)}
            </span>
          </div>
          {notification.previewUrl && (
            <div
              className={styles.notificationPreview}
              onClick={(event) => {
                  event.stopPropagation();
                  handleNotificationClick(notification);
              }}
              onKeyDown={(event) => {
                if (event.key === 'Enter' || event.key === ' ') {
                  handleNotificationClick(notification);
                }
              }}
              role="button"
              tabIndex={0}
              aria-label="Open post"
            >
              <img src={notification.previewUrl} alt="Post preview" />
            </div>
          )}
        </button>
      </li>
    );
  };

  return (
    <div className={styles.panelContent}>
      <h2 className={styles.panelTitle}>Notifications</h2>
        
        {status === 'loading' && (
        <div className={styles.panelSection}>
          <Loader />
        </div>
      )}

      {status === 'failed' && (
        <div className={styles.panelSection}>
          <p className={styles.errorMessage}>{error}</p>
        </div>
      )}

      {status !== 'loading' && newNotifications.length > 0 && (
        <div className={styles.panelSection}>
          <span className={styles.sectionTitle}>New</span>
          <ul className={styles.notificationsList}>
            {newNotifications.map(renderNotification)}
          </ul>
        </div>
      )}

      {status !== 'loading' && earlierNotifications.length > 0 && (
        <div className={styles.panelSection}>
          <span className={styles.sectionTitle}>Earlier</span>
          <ul className={styles.notificationsList}>
            {earlierNotifications.map(renderNotification)}
          </ul>
        </div>
      )}

      {status === 'succeeded' && items.length === 0 && (
        <div className={styles.panelSection}>
          <p className={styles.previewPlaceholder}>You're all caught up!</p>
        </div>
      )}

      {hasMore && (
        <div className={styles.panelActions}>
          <button
            type="button"
            onClick={handleLoadMore}
            disabled={status === 'loading-more'}
          >
            {status === 'loading-more' ? 'Loading…' : 'Load older notifications'}
          </button>
        </div>
      )}
    </div>
  );
};

export default NotificationsPanel;