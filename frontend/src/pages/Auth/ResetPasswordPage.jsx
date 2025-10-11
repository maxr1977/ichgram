import { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate, useSearchParams, Navigate } from 'react-router-dom';
import AuthLayout from '@/layouts/AuthLayout.jsx';
import { AuthHeader, AuthCard, Input, Button } from '@/components';
import { resetPassword } from '@/store/slices/authSlice.js';
import { validatePassword, validateConfirmPassword } from '@/utils/validation.js';
import styles from './ResetPasswordPage.module.css';

const ResetPasswordPage = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const { status } = useSelector((state) => state.auth);

  const [formState, setFormState] = useState({ password: '', confirm: '' });
  const [formErrors, setFormErrors] = useState({});
  const [serverError, setServerError] = useState('');

  if (!token) {
    return <Navigate to="/login" replace />;
  }

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormState((prev) => ({ ...prev, [name]: value }));
    setFormErrors((prev) => ({ ...prev, [name]: '' }));
    setServerError('');
  };

  const validateForm = () => {
    const errors = {};
    const passwordError = validatePassword(formState.password);
    const confirmError = validateConfirmPassword(formState.password, formState.confirm);

    if (passwordError) errors.password = passwordError;
    if (confirmError) errors.confirm = confirmError;

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!validateForm()) return;

    const resultAction = await dispatch(resetPassword({ token, password: formState.password }));
    if (resetPassword.fulfilled.match(resultAction)) {
      navigate('/login', { replace: true, state: { message: 'Password has been reset. Please log in.' } });
    } else if (resetPassword.rejected.match(resultAction)) {
      setServerError(resultAction.payload ?? 'Failed to reset password');
    }
  };

  return (
    <div className={styles.page}>
      <AuthHeader withDivider />
      <AuthLayout>
        <AuthCard className={styles.card}>
          <h2 className={styles.title}>Reset your password</h2>
          <p className={styles.subtitle}>
            Choose a new password that is at least 6 characters long. You&apos;ll use it to log in next time.
          </p>
          <form className={styles.form} onSubmit={handleSubmit}>
            <Input
              name="password"
              type="password"
              placeholder="New password"
              value={formState.password}
              onChange={handleChange}
              error={formErrors.password}
            />
            <Input
              name="confirm"
              type="password"
              placeholder="Confirm password"
              value={formState.confirm}
              onChange={handleChange}
              error={formErrors.confirm}
            />
            {serverError && <span className={styles.error}>{serverError}</span>}
            <Button type="submit" variant="primary" fullWidth disabled={status === 'loading'}>
              {status === 'loading' ? 'Saving...' : 'Save new password'}
            </Button>
          </form>
        </AuthCard>
      </AuthLayout>
    </div>
  );
};

export default ResetPasswordPage;
