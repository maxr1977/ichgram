import PropTypes from 'prop-types';
import classNames from 'classnames';
import {
  HomeIcon,
  SearchIcon,
  ExploreIcon,
  MessageIcon,
  NotificationIcon,
  CreateIcon,
} from './SidebarIcons.jsx';
import Logo from '@/components/Logo/Logo.jsx';
import Avatar from '@/components/Avatar/Avatar.jsx';
import styles from './MainLayout.module.css';

const navItems = [
  { key: 'home', label: 'Home', icon: HomeIcon, path: '/' },
  { key: 'search', label: 'Search', icon: SearchIcon, panel: 'search' },
  { key: 'explore', label: 'Explore', icon: ExploreIcon, path: '/explore' },
  { key: 'messages', label: 'Messages', icon: MessageIcon, path: '/messenger' },
  { key: 'notifications', label: 'Notifications', icon: NotificationIcon, panel: 'notifications' },
  { key: 'create', label: 'Create', icon: CreateIcon, action: 'create' },
];

const footerItems = [
  { key: 'home', label: 'Home', path: '/' },
  { key: 'search', label: 'Search', panel: 'search' },
  { key: 'explore', label: 'Explore', path: '/explore' },
  { key: 'messages', label: 'Messages', path: '/messenger' },
  { key: 'notifications', label: 'Notifications', panel: 'notifications' },
  { key: 'create', label: 'Create', action: 'create' },
];

const getInitials = (user) => {
  const source = user?.fullName || user?.username || 'IG';
  return source.slice(0, 2).toUpperCase();
};

const MainLayout = ({
  children,
  activeKey,
  onNavigate,
  onOpenPanel,
  onClosePanel,
  onCreate,
  isOverlayActive,
  panel,
  renderPanel,
  user,
  notificationsUnread,
}) => {
  const mobileItems = [...navItems, { key: 'profile', label: 'Profile' }];
  const initials = getInitials(user);

  return (
    <div className={styles.layout}>
      <aside className={styles.sidebarDesktop}>
        <div className={styles.logo}>
          <Logo size="md" isResponsive={true} />
        </div>
        <nav className={styles.navList}>
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeKey === item.key;
            const hasBadge = item.key === 'notifications' && notificationsUnread > 0;
            return (
              <button
                key={item.key}
                type="button"
                className={classNames(styles.navItem, { [styles.navItemActive]: isActive })}
                onClick={() => {
                  if (item.path) {
                    onClosePanel();
                    onNavigate(item.path);
                  } else if (item.panel) {
                    onOpenPanel(item.panel);
                  } else if (item.action === 'create') {
                    onCreate();
                  }
                }}
              >
                <Icon active={isActive} className={styles.navIcon} />
                <span>{item.label}</span>
                {hasBadge && <span className={styles.navBadge} aria-hidden="true" />}
              </button>
            );
          })}
          <button
            type="button"
            className={classNames(styles.navItem, styles.profileNavItem)}
            onClick={() => {
              onClosePanel();
              onNavigate(`/profile/${user?.username ?? 'me'}`);
            }}
          >
            <Avatar
              src={user?.avatarUrl || null}
              alt={user?.fullName ?? user?.username ?? 'Profile'}
              size="sm"
              fallback={initials}
              className={styles.profileAvatar}
            />
            <span>Profile</span>
          </button>
        </nav>
      </aside>

      <nav className={styles.sidebarMobile}>
        {mobileItems.map((item) => {
          if (item.key === 'profile') {
            return (
              <button
                key="profile"
                type="button"
                className={styles.mobileNavItem}
                onClick={() => {
                  onClosePanel();
                  onNavigate(`/profile/${user?.username ?? 'me'}`);
                }}
              >
                <Avatar
                  src={user?.avatarUrl || null}
                  alt={user?.fullName ?? user?.username ?? 'Profile'}
                  size="sm"
                  fallback={initials}
                  className={styles.mobileAvatar}
                />
              </button>
            );
          }

          const Icon = item.icon;
          const isActive = activeKey === item.key;
          const hasBadge = item.key === 'notifications' && notificationsUnread > 0;
          return (
            <button
              key={item.key}
              type="button"
              className={classNames(styles.mobileNavItem, { [styles.mobileNavItemActive]: isActive })}
              onClick={() => {
                if (item.path) {
                  onClosePanel();
                  onNavigate(item.path);
                } else if (item.panel) {
                  onOpenPanel(item.panel);
                } else if (item.action === 'create') {
                  onCreate();
                }
              }}
            >
              <Icon active={isActive} className={styles.mobileIcon} />
              {hasBadge && <span className={styles.mobileBadge} aria-hidden="true" />}
            </button>
          );
        })}
      </nav>

      <main className={styles.mainArea}>{children}</main>

      {panel && (
        <aside className={styles.panel}>
          {renderPanel(panel)}
        </aside>
      )}

      <footer className={styles.footer}>
        {footerItems.map((item) => (
          <button
            key={item.key}
            type="button"
            className={styles.footerItem}
            onClick={() => {
              if (item.path) {
                onClosePanel();
                onNavigate(item.path);
              } else if (item.panel) {
                onOpenPanel(item.panel);
              } else if (item.action === 'create') {
                onCreate();
              }
            }}
          >
            {item.label}
          </button>
        ))}
      </footer>

      <div
        className={styles.overlay}
        data-open={isOverlayActive}
        onClick={onClosePanel}
        aria-hidden="true"
      />
    </div>
  );
};

MainLayout.propTypes = {
  children: PropTypes.node.isRequired,
  activeKey: PropTypes.string,
  onNavigate: PropTypes.func.isRequired,
  onOpenPanel: PropTypes.func.isRequired,
  onClosePanel: PropTypes.func.isRequired,
  onCreate: PropTypes.func.isRequired,
  isOverlayActive: PropTypes.bool,
  panel: PropTypes.string,
  renderPanel: PropTypes.func.isRequired,
  user: PropTypes.shape({
    username: PropTypes.string,
    avatarUrl: PropTypes.string,
    fullName: PropTypes.string,
  }),
  notificationsUnread: PropTypes.number,
};

MainLayout.defaultProps = {
  activeKey: 'home',
  isOverlayActive: false,
  panel: null,
  user: null,
  notificationsUnread: 0,
};

export default MainLayout;
