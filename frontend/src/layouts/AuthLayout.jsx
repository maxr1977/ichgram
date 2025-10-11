import PropTypes from 'prop-types';
import classNames from 'classnames';
import styles from './AuthLayout.module.css';

const AuthLayout = ({ children, className }) => (
  <div className={classNames(styles.wrapper, className)}>
    <div className={styles.container}>
      {children}
    </div>
  </div>
);

AuthLayout.propTypes = {
  children: PropTypes.node.isRequired,
  className: PropTypes.string,
};

export default AuthLayout;
