import PropTypes from 'prop-types';
import { createPortal } from 'react-dom';
import classNames from 'classnames';
import styles from './Modal.module.css';

const Modal = ({ isOpen, onClose, children, size = 'md', className }) => {
  if (!isOpen) {
    return null;
  }

  return createPortal(
    <div className={styles.overlay} role="dialog" aria-modal="true">
      <div className={styles.backdrop} onClick={onClose} aria-hidden="true" />
      <div className={classNames(styles.modal, styles[size], className)}>
        {children}
      </div>
    </div>,
    document.body,
  );
};

Modal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func,
  children: PropTypes.node.isRequired,
  size: PropTypes.oneOf(['sm', 'md', 'lg', 'xl']),
  className: PropTypes.string,
};

Modal.defaultProps = {
  onClose: () => {},
};

export default Modal;