import { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate, Navigate } from 'react-router-dom';
import AuthLayout from '@/layouts/AuthLayout.jsx';
import {
  AuthCard,
  Logo,
  Input,
  Button,
  AppLink,
} from '@/components';
import { register } from '@/store/slices/authSlice.js';
import {
  validateEmail,
  validatePassword,
  validateRequired,
} from '@/utils/validation.js';
import styles from './RegisterPage.module.css';

const RegisterPage = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { user, status, error } = useSelector((state) => state.auth);

  const [formState, setFormState] = useState({
    email: '',
    fullName: '',
    username: '',
    password: '',
  });
  const [formErrors, setFormErrors] = useState({});

  if (user) {
    return <Navigate to="/" replace />;
  }

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormState((prev) => ({ ...prev, [name]: value }));
    setFormErrors((prev) => ({ ...prev, [name]: '' }));
  };

  const validateForm = () => {
    const errors = {};
    const emailError = validateEmail(formState.email);
    const fullNameError = validateRequired(formState.fullName, 'Full name');
    const usernameError = validateRequired(formState.username, 'Username');
    const passwordError = validatePassword(formState.password);

    if (emailError) errors.email = emailError;
    if (fullNameError) errors.fullName = fullNameError;
    if (usernameError) errors.username = usernameError;
    if (passwordError) errors.password = passwordError;

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!validateForm()) return;

    const resultAction = await dispatch(register(formState));
    if (register.fulfilled.match(resultAction)) {
      navigate('/', { replace: true });
    }
  };

  return (
    <AuthLayout>
      <div className={styles.stack}>
        <AuthCard>
          <div className={styles.logoWrap}>
            <Logo size="md" />
          </div>
          <p className={styles.lead}>Sign up to see photos and videos from your friends.</p>
          <form className={styles.form} onSubmit={handleSubmit}>
            <Input
              name="email"
              placeholder="Email"
              value={formState.email}
              onChange={handleChange}
              error={formErrors.email}
            />
            <Input
              name="fullName"
              placeholder="Full Name"
              value={formState.fullName}
              onChange={handleChange}
              error={formErrors.fullName}
            />
            <Input
              name="username"
              placeholder="Username"
              value={formState.username}
              onChange={handleChange}
              error={formErrors.username}
            />
            <Input
              name="password"
              type="password"
              placeholder="Password"
              value={formState.password}
              onChange={handleChange}
              error={formErrors.password}
            />
            <p className={styles.mutedText}>
              People who use our service may have uploaded your contact information to Instagram.
              {' '}
              <AppLink to="/learn-more" variant="dark">Learn More</AppLink>
            </p>
            <p className={styles.mutedText}>
              By signing up, you agree to our
              {' '}
              <AppLink to="/terms" variant="dark">Terms</AppLink>
              ,
              {' '}
              <AppLink to="/privacy" variant="dark">Privacy Policy</AppLink>
              {' '}
              and
              {' '}
              <AppLink to="/cookies" variant="dark">Cookies Policy</AppLink>
              .
            </p>
            {error && <span className={styles.error}>{error}</span>}
            <Button type="submit" variant="primary" fullWidth disabled={status === 'loading'}>
              {status === 'loading' ? 'Signing up...' : 'Sign up'}
            </Button>
          </form>
        </AuthCard>
        <section className={styles.switchCard}>
          <p>
            Have an account?
            {' '}
            <AppLink to="/login" variant="primary">Log in</AppLink>
          </p>
        </section>
      </div>
    </AuthLayout>
  );
};

export default RegisterPage;
