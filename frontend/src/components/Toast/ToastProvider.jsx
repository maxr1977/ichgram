import { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useDispatch, useSelector } from 'react-redux';
import classNames from 'classnames';
import { FiInfo, FiCheckCircle, FiAlertTriangle, FiX } from 'react-icons/fi';
import { dismissToast, selectToasts } from '@/store/slices/toastSlice.js';
import styles from './Toast.module.css';

const ICONS = {
  success: FiCheckCircle,
  error: FiAlertTriangle,
  info: FiInfo,
};

const Toast = ({ toast }) => {
  const dispatch = useDispatch();
  const Icon = ICONS[toast.type] ?? FiInfo;

  useEffect(() => {
    if (!toast.duration) return undefined;
    const timer = setTimeout(() => {
      dispatch(dismissToast(toast.id));
    }, toast.duration);
    return () => clearTimeout(timer);
  }, [dispatch, toast]);

  return (
    <div className={classNames(styles.toast, styles[toast.type])}>
      <Icon className={styles.icon} />
      <span className={styles.message}>{toast.message}</span>
      <button
        type="button"
        className={styles.closeButton}
        aria-label="Dismiss notification"
        onClick={() => dispatch(dismissToast(toast.id))}
      >
        <FiX />
      </button>
    </div>
  );
};

const ToastProvider = () => {
  const toasts = useSelector(selectToasts);

  if (typeof document === 'undefined') {
    return null;
  }

  return createPortal(
    <div className={styles.viewport}>
      {toasts.map((toast) => (
        <Toast key={toast.id} toast={toast} />
      ))}
    </div>,
    document.body,
  );
};

export default ToastProvider;
