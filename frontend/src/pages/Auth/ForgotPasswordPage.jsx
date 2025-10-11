import { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { AuthHeader } from '@/components';
import AuthLayout from '@/layouts/AuthLayout.jsx';
import { AuthCard, Input, Button, AuthDivider, AppLink } from '@/components';
import { forgotPassword } from '@/store/slices/authSlice.js';
import { validateEmailOrUsername } from '@/utils/validation.js';
import lockIcon from '@/assets/images/lockIcon.svg';
import styles from './ForgotPasswordPage.module.css';

const ForgotPasswordPage = () => {
  const dispatch = useDispatch();
  const { status } = useSelector((state) => state.auth);

  const [identifier, setIdentifier] = useState('');
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  const handleSubmit = async (event) => {
    event.preventDefault();
    const validationError = validateEmailOrUsername(identifier);
    if (validationError) {
      setError(validationError);
      return;
    }
    setError('');

    const resultAction = await dispatch(forgotPassword({ identifier }));

    if (forgotPassword.fulfilled.match(resultAction)) {
      setMessage('We have sent you an email with the instructions to reset your password.');
    } else if (forgotPassword.rejected.match(resultAction)) {
      setMessage('');
      setError(resultAction.payload ?? 'Unable to send reset link');
    }
  };

  return (
    <div className={styles.page}>
      <AuthHeader withDivider />
      <AuthLayout>
        <AuthCard className={styles.card}>
          <img src={lockIcon} alt="lock" className={styles.icon} />
          <h2 className={styles.title}>Trouble logging in?</h2>
          <p className={styles.subtitle}>
            Enter your email, phone, or username and we&apos;ll send you a link to get back into your account.
          </p>
          <form className={styles.form} onSubmit={handleSubmit}>
            <Input
              name="identifier"
              placeholder="Email or Username"
              value={identifier}
              onChange={(event) => setIdentifier(event.target.value)}
              error={error}
            />
            {message && <span className={styles.success}>{message}</span>}
            <Button type="submit" variant="primary" fullWidth disabled={status === 'loading'}>
              {status === 'loading' ? 'Sending...' : 'Reset your password'}
            </Button>
          </form>
          <AuthDivider />
          <div className={styles.createAccount}>
            <AppLink to="/register" variant="text">
              Create new account
            </AppLink>
          </div>
          <div className={styles.footer}>
            <AppLink to="/login" variant="text">
              Back to login
            </AppLink>
          </div>
        </AuthCard>
      </AuthLayout>
    </div>
  );
};

export default ForgotPasswordPage;
