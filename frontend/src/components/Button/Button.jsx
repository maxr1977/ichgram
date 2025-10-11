import PropTypes from 'prop-types';
import classNames from 'classnames';
import styles from './Button.module.css';

const Button = ({
  type = 'button',
  variant = 'primary',
  fullWidth = false,
  disabled = false,
  children,
  className,
  ...props
}) => {
  const buttonClassName = classNames(
    styles.button,
    styles[variant] ?? styles.primary,
    {
      [styles.fullWidth]: fullWidth,
    },
    className,
  );

  return (
    <button
      type={type}
      className={buttonClassName}
      disabled={disabled}
      {...props}
    >
      {children}
    </button>
  );
};

Button.propTypes = {
  type: PropTypes.oneOf(['button', 'submit', 'reset']),
  variant: PropTypes.oneOf(['primary', 'secondary', 'ghost', 'link']),
  fullWidth: PropTypes.bool,
  disabled: PropTypes.bool,
  children: PropTypes.node.isRequired,
  className: PropTypes.string,
};

export default Button;
