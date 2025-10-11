import PropTypes from 'prop-types';
import classNames from 'classnames';
import styles from './Input.module.css';

const Input = ({
  label,
  name,
  type = 'text',
  placeholder,
  value,
  onChange,
  onBlur,
  error,
  helperText,
  fullWidth = true,
  className,
  ...props
}) => {
  const inputClasses = classNames(
    styles.input,
    { [styles.fullWidth]: fullWidth, [styles.error]: Boolean(error) },
    className,
  );

  return (
    <label className={styles.wrapper}>
      {label && <span className={styles.label}>{label}</span>}
      <input
        className={inputClasses}
        type={type}
        name={name}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        onBlur={onBlur}
        aria-invalid={Boolean(error)}
        {...props}
      />
      {(helperText || error) && (
        <span className={classNames(styles.helperText, { [styles.helperError]: Boolean(error) })}>
          {error ?? helperText}
        </span>
      )}
    </label>
  );
};

Input.propTypes = {
  label: PropTypes.string,
  name: PropTypes.string,
  type: PropTypes.string,
  placeholder: PropTypes.string,
  value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  onChange: PropTypes.func,
  onBlur: PropTypes.func,
  error: PropTypes.string,
  helperText: PropTypes.string,
  fullWidth: PropTypes.bool,
  className: PropTypes.string,
};

export default Input;
