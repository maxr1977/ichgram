import PropTypes from 'prop-types';
import classNames from 'classnames';
import Modal from '@/components/Modal/Modal.jsx';
import Avatar from '@/components/Avatar/Avatar.jsx';
import Loader from '@/components/Loader/Loader.jsx';
import styles from './UserListModal.module.css';

const UserListModal = ({
  title,
  isOpen,
  onClose,
  items,
  status,
  onLoadMore,
  hasMore,
  onSelectUser,
}) => (
  <Modal isOpen={isOpen} onClose={onClose} size="sm" className={styles.modal}>
    <div className={styles.container}>
      <header className={styles.header}>
        <h2>{title}</h2>
      </header>
      <div className={styles.list} role="list">
        {status === 'loading' && (
          <div className={styles.loader}>
            <Loader />
          </div>
        )}
        {status === 'succeeded' && items.length === 0 && (
          <div className={styles.empty}>No users yet.</div>
        )}
        {items.map((user) => {
          const initials = (user.fullName || user.username || 'IG').slice(0, 2).toUpperCase();
          return (
            <button
              key={user.id}
              type="button"
              className={styles.item}
              role="listitem"
              onClick={() => onSelectUser?.(user)}
            >
              <Avatar
                src={user.avatarUrl || null}
                fallback={initials}
                alt={`${user.username} avatar`}
                size="md"
                className={styles.avatar}
              />
              <div className={styles.meta}>
                <span className={styles.username}>{user.username}</span>
                {user.fullName && <span className={styles.fullName}>{user.fullName}</span>}
              </div>
            </button>
          );
        })}
        {status === 'failed' && (
          <div className={classNames(styles.empty, styles.error)}>
            Failed to load users. Please try again.
          </div>
        )}
      </div>
      {hasMore && status === 'succeeded' && (
        <button type="button" className={styles.loadMore} onClick={onLoadMore}>
          Load more
        </button>
      )}
    </div>
  </Modal>
);

UserListModal.propTypes = {
  title: PropTypes.string.isRequired,
  isOpen: PropTypes.bool,
  onClose: PropTypes.func.isRequired,
  items: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string,
      username: PropTypes.string,
      fullName: PropTypes.string,
      avatarUrl: PropTypes.string,
    }),
  ),
  status: PropTypes.oneOf(['idle', 'loading', 'succeeded', 'failed']),
  onLoadMore: PropTypes.func,
  hasMore: PropTypes.bool,
  onSelectUser: PropTypes.func,
};

UserListModal.defaultProps = {
  isOpen: false,
  items: [],
  status: 'idle',
  onLoadMore: undefined,
  hasMore: false,
  onSelectUser: undefined,
};

export default UserListModal;
