import classNames from 'classnames';
import PropTypes from 'prop-types';
import styles from './Loader.module.css';

const Loader = ({ size = 'md', className }) => (
  <span className={classNames(styles.loader, styles[size], className)} aria-label="Loading" />
);

Loader.propTypes = {
  size: PropTypes.oneOf(['sm', 'md', 'lg']),
  className: PropTypes.string,
};

export default Loader;