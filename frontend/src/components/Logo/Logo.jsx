import PropTypes from 'prop-types';
import classNames from 'classnames';
import logoImg from '@/assets/images/logo.png';
import logoSmImg from '@/assets/images/logo-sm.png';
import styles from './Logo.module.css';

const Logo = ({ size = 'md', isResponsive = false }) => (
  <div className={classNames(styles.logo, styles[size], { [styles.responsive]: isResponsive })}>
    {isResponsive ? (
      <picture>
        <source media="(max-width: 1024px)" srcSet={logoSmImg} />
        <img src={logoImg} alt="Ichgram logo" />
      </picture>
    ) : (
      <img src={logoImg} alt="Ichgram logo" />
    )}
  </div>
);

Logo.propTypes = {
  size: PropTypes.oneOf(['sm', 'md', 'lg']),
  isResponsive: PropTypes.bool,
};

export default Logo;
