import PropTypes from 'prop-types';
import classNames from 'classnames';
import styles from './Avatar.module.css';

const Avatar = ({ src, alt = 'User avatar', size = 'md', fallback, className, ...props }) => {
  const avatarClassName = classNames(styles.avatar, styles[size], className);
  const initials = fallback ?? alt?.charAt(0)?.toUpperCase() ?? 'U';

  return (
    <div className={avatarClassName} {...props}>
      {src ? (
        <img className={styles.image} src={src} alt={alt} />
      ) : (
        <span className={styles.initials}>{initials}</span>
      )}
    </div>
  );
};

Avatar.propTypes = {
  src: PropTypes.string,
  alt: PropTypes.string,
  size: PropTypes.oneOf(['sm', 'md', 'lg', 'xl']),
  fallback: PropTypes.string,
  className: PropTypes.string,
};

export default Avatar;
