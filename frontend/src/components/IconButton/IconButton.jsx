import PropTypes from 'prop-types';
import classNames from 'classnames';
import styles from './IconButton.module.css';

const IconButton = ({ label, variant = 'ghost', size = 'md', className, children, ...props }) => (
  <button
    type="button"
    aria-label={label}
    className={classNames(styles.button, styles[variant], styles[size], className)}
    {...props}
  >
    {children}
  </button>
);

IconButton.propTypes = {
  label: PropTypes.string,
  variant: PropTypes.oneOf(['ghost', 'primary']),
  size: PropTypes.oneOf(['sm', 'md', 'lg']),
  className: PropTypes.string,
  children: PropTypes.node.isRequired,
};

export default IconButton;