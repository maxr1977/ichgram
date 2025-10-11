import PropTypes from 'prop-types';
import AppLink from '@/components/Link/AppLink.jsx';
import styles from './AuthFooterLinks.module.css';

const AuthFooterLinks = ({ links }) => (
  <ul className={styles.footerLinks}>
    {links.map(({ label, to, variant }) => (
      <li key={label}>
        <AppLink to={to} variant={variant ?? 'muted'}>
          {label}
        </AppLink>
      </li>
    ))}
  </ul>
);

AuthFooterLinks.propTypes = {
  links: PropTypes.arrayOf(
    PropTypes.shape({
      label: PropTypes.string.isRequired,
      to: PropTypes.string.isRequired,
      variant: PropTypes.oneOf(['primary', 'dark', 'text', 'muted']),
    }),
  ).isRequired,
};

export default AuthFooterLinks;
