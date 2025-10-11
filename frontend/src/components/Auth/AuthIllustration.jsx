import PropTypes from 'prop-types';
import styles from './AuthIllustration.module.css';
import illustration from '@/assets/images/login-page-image.png';

const AuthIllustration = ({ hideOnMobile = true }) => (
  <aside className={hideOnMobile ? styles.illustrationHidden : styles.illustration}>
    <img src={illustration} alt="App preview" className={styles.image} />
  </aside>
);

AuthIllustration.propTypes = {
  hideOnMobile: PropTypes.bool,
};

export default AuthIllustration;
