import PropTypes from 'prop-types';
import { Link as RouterLink } from 'react-router-dom';
import classNames from 'classnames';
import styles from './AppLink.module.css';

const AppLink = ({ to, variant = 'primary', children, className, ...props }) => {
  const linkClassName = classNames(
    styles.link,
    styles[variant] ?? styles.primary,
    className,
  );

  return (
    <RouterLink to={to} className={linkClassName} {...props}>
      {children}
    </RouterLink>
  );
};

AppLink.propTypes = {
  to: PropTypes.oneOfType([PropTypes.string, PropTypes.object]).isRequired,
  variant: PropTypes.oneOf(['primary', 'dark', 'text', 'muted']),
  children: PropTypes.node.isRequired,
  className: PropTypes.string,
};

export default AppLink;