import PropTypes from 'prop-types';
import classNames from 'classnames';
import { FiLogOut } from 'react-icons/fi';
import Avatar from '@/components/Avatar/Avatar.jsx';
import styles from './ProfileHeader.module.css';

const formatNumber = (value) =>
  new Intl.NumberFormat('en-US').format(Math.max(0, value ?? 0));

const ProfileHeader = ({
  profile,
  isCurrentUser,
  onEdit,
  onLogout,
  onFollowToggle,
  onMessage,
  followPending,
  onOpenFollowers,
  onOpenFollowing,
}) => {
  if (!profile) {
    return null;
  }

  const initials = (profile.fullName || profile.username || 'IG')
    .slice(0, 2)
    .toUpperCase();

  return (
    <header className={styles.header}>
      <div className={styles.avatarColumn}>
        <div className={styles.avatarWrapper}>
          <Avatar
            src={profile.avatarUrl || null}
            fallback={initials}
            alt={`${profile.username} avatar`}
            size="xl"
            className={classNames(styles.avatar, styles.largeAvatar)}
          />
        </div>
      </div>
      <div className={styles.contentColumn}>
        <div className={styles.topRow}>
          <div className={styles.identity}>
            <h1 className={styles.username}>{profile.username}</h1>
            {isCurrentUser ? (
              <button
                type="button"
                className={classNames(styles.actionButton, styles.editButton)}
                onClick={onEdit}
              >
                Edit profile
              </button>
            ) : (
              <>
                <button
                  type="button"
                  className={classNames(styles.actionButton, styles.followButton, {
                    [styles.following]: profile.isFollowed,
                  })}
                  onClick={onFollowToggle}
                  disabled={followPending}
                >
                  {profile.isFollowed ? 'Following' : 'Follow'}
                </button>
                <button
                  type="button"
                  className={classNames(styles.actionButton, styles.messageButton)}
                  onClick={onMessage}
                >
                  Message
                </button>
              </>
            )}
          </div>
          {isCurrentUser && (
            <button
              type="button"
              className={styles.logoutButton}
              onClick={onLogout}
              aria-label="Logout"
            >
              <FiLogOut />
            </button>
          )}
        </div>

        {profile.fullName && <div className={styles.fullName}>{profile.fullName}</div>}

        <ul className={styles.stats}>
          <li>
            <span className={styles.statValue}>{formatNumber(profile.postsCount)}</span>
            <span className={styles.statLabel}>posts</span>
          </li>
          <li>
            <button type="button" className={styles.statButton} onClick={onOpenFollowers}>
              <span className={styles.statValue}>{formatNumber(profile.followersCount)}</span>
              <span className={styles.statLabel}>followers</span>
            </button>
          </li>
          <li>
            <button type="button" className={styles.statButton} onClick={onOpenFollowing}>
              <span className={styles.statValue}>{formatNumber(profile.followingCount)}</span>
              <span className={styles.statLabel}>following</span>
            </button>
          </li>
        </ul>

        <div className={styles.bioBlock}>
          {profile.bio && (
            <p className={styles.bio} aria-label="Profile bio">
              {profile.bio}
            </p>
          )}
          {profile.website && (
            <a
              href={profile.website.startsWith('http') ? profile.website : `https://${profile.website}`}
              target="_blank"
              rel="noopener noreferrer"
              className={styles.website}
            >
              {profile.website}
            </a>
          )}
        </div>
      </div>
    </header>
  );
};

ProfileHeader.propTypes = {
  profile: PropTypes.shape({
    id: PropTypes.string,
    username: PropTypes.string,
    fullName: PropTypes.string,
    bio: PropTypes.string,
    website: PropTypes.string,
    avatarUrl: PropTypes.string,
    postsCount: PropTypes.number,
    followersCount: PropTypes.number,
    followingCount: PropTypes.number,
    isFollowed: PropTypes.bool,
  }),
  isCurrentUser: PropTypes.bool,
  onEdit: PropTypes.func,
  onLogout: PropTypes.func,
  onFollowToggle: PropTypes.func,
  onMessage: PropTypes.func,
  followPending: PropTypes.bool,
  onOpenFollowers: PropTypes.func,
  onOpenFollowing: PropTypes.func,
};

ProfileHeader.defaultProps = {
  profile: null,
  isCurrentUser: false,
  onEdit: undefined,
  onLogout: undefined,
  onFollowToggle: undefined,
  onMessage: undefined,
  followPending: false,
  onOpenFollowers: undefined,
  onOpenFollowing: undefined,
};

export default ProfileHeader;
