import { Link } from 'react-router-dom';
import previewImg from '@/assets/images/login-page-image.png';
import styles from './NotFoundPage.module.css';

const NotFoundPage = () => (
  <main className={styles.page}>
    <div className={styles.content}>
      <div className={styles.imageWrapper}>
        <img src={previewImg} alt="App preview" />
      </div>
      <div className={styles.textBlock}>
        <h1>Oops! Page Not Found (404 Error)</h1>
        <p>
          We're sorry, but the page you're looking for doesn't seem to exist. If you typed the URL manually,
          please double-check the spelling. If you clicked on a link, it may be outdated or broken.
        </p>
        <Link to="/" className={styles.backLink}>
          Go back home
        </Link>
      </div>
    </div>
  </main>
);

export default NotFoundPage;
