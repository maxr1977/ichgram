import PropTypes from 'prop-types';
import classNames from 'classnames';
import styles from './TextArea.module.css';

const TextArea = ({
  label,
  name,
  placeholder,
  value,
  onChange,
  onBlur,
  rows = 4,
  error,
  helperText,
  className,
  ...props
}) => {
  const textAreaClasses = classNames(styles.textArea, { [styles.error]: Boolean(error) }, className);

  return (
    <label className={styles.wrapper}>
      {label && <span className={styles.label}>{label}</span>}
      <textarea
        className={textAreaClasses}
        name={name}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        onBlur={onBlur}
        rows={rows}
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

TextArea.propTypes = {
  label: PropTypes.string,
  name: PropTypes.string,
  placeholder: PropTypes.string,
  value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  onChange: PropTypes.func,
  onBlur: PropTypes.func,
  rows: PropTypes.number,
  error: PropTypes.string,
  helperText: PropTypes.string,
  className: PropTypes.string,
};

export default TextArea;