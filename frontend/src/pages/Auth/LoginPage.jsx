import { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate, useLocation, Navigate } from 'react-router-dom';
import AuthLayout from '@/layouts/AuthLayout.jsx';
import {
  AuthCard,
  AuthIllustration,
  Logo,
  Input,
  Button,
  AuthDivider,
  AppLink,
} from '@/components';
import { login } from '@/store/slices/authSlice.js';
import { validateEmailOrUsername, validatePassword } from '@/utils/validation.js';
import styles from './LoginPage.module.css';

const LoginPage = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const { user, status, error } = useSelector((state) => state.auth);

  const [formState, setFormState] = useState({ identifier: '', password: '' });
  const [formErrors, setFormErrors] = useState({});
  const successMessage = location.state?.message;

  if (user) {
    return <Navigate to="/" replace />;
  }

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormState((prev) => ({ ...prev, [name]: value }));
  };

  const validateForm = () => {
    const errors = {};
    const identifierError = validateEmailOrUsername(formState.identifier);
    const passwordError = validatePassword(formState.password);

    if (identifierError) errors.identifier = identifierError;
    if (passwordError) errors.password = passwordError;

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!validateForm()) return;

    const resultAction = await dispatch(login(formState));

    if (login.fulfilled.match(resultAction)) {
      const from = location.state?.from?.pathname || '/';
      navigate(from, { replace: true });
    }
  };

  return (
    <AuthLayout>
      <AuthIllustration />
      <div className={styles.stack}>
        <AuthCard className={styles.card}>
          <div className={styles.logoWrap}>
            <Logo size="md" />
          </div>
          <form className={styles.form} onSubmit={handleSubmit}>
            <Input
              name="identifier"
              placeholder="Username or email"
              value={formState.identifier}
              onChange={handleChange}
              fullWidth
              error={formErrors.identifier}
            />
            <Input
              name="password"
              type="password"
              placeholder="Password"
              value={formState.password}
              onChange={handleChange}
              fullWidth
              error={formErrors.password}
            />
            {successMessage && <span className={styles.success}>{successMessage}</span>}
            {error && <span className={styles.error}>{error}</span>}
            <Button type="submit" variant="primary" fullWidth disabled={status === 'loading'}>
              {status === 'loading' ? 'Logging in...' : 'Log in'}
            </Button>
          </form>
          <AuthDivider />
          <div className={styles.actions}>
            <AppLink to="/forgot-password" variant="dark">
              Forgot password?
            </AppLink>
          </div>
        </AuthCard>
        <section className={styles.switchCard}>
          <p>
            Don't have an account?
            {' '}
            <AppLink to="/register" variant="primary">
              Sign up
            </AppLink>
          </p>
        </section>
      </div>
    </AuthLayout>
  );
};

export default LoginPage;
