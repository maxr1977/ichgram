import PropTypes from 'prop-types';
import classNames from 'classnames';
import styles from './AuthCard.module.css';

const AuthCard = ({ children, className }) => (
  <section className={classNames(styles.card, className)}>
    {children}
  </section>
);

AuthCard.propTypes = {
  children: PropTypes.node.isRequired,
  className: PropTypes.string,
};

export default AuthCard;
