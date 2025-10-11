import PropTypes from 'prop-types';
import styles from './InfoPage.module.css';

const InfoPage = ({ title, children }) => (
  <main className={styles.wrapper}>
    <section className={styles.card}>
      <h1>{title}</h1>
      <div className={styles.content}>{children}</div>
    </section>
  </main>
);

InfoPage.propTypes = {
  title: PropTypes.string.isRequired,
  children: PropTypes.node,
};

InfoPage.defaultProps = {
  children: null,
};

export default InfoPage;
