import styles from './AuthDivider.module.css';

const AuthDivider = ({ label = 'OR' }) => (
  <div className={styles.divider}>
    <span className={styles.line} />
    <span className={styles.label}>{label}</span>
    <span className={styles.line} />
  </div>
);

export default AuthDivider;
