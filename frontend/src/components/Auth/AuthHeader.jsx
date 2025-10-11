import PropTypes from 'prop-types';
import Logo from '@/components/Logo/Logo.jsx';
import styles from './AuthHeader.module.css';

const AuthHeader = ({ withDivider = false }) => (
  <header className={styles.header} data-divider={withDivider}>
    <Logo size="smx" />
  </header>
);

AuthHeader.propTypes = {
  withDivider: PropTypes.bool,
};

export default AuthHeader;
