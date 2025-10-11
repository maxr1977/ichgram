export const validateEmailOrUsername = (value = '') => {
  if (!value.trim()) {
    return 'This field is required';
  }
  return '';
};

export const validateEmail = (value = '') => {
  if (!value.trim()) {
    return 'Email is required';
  }
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(value)) {
    return 'Please enter a valid email';
  }
  return '';
};

export const validatePassword = (value = '') => {
  if (!value.trim()) {
    return 'Password is required';
  }
  if (value.trim().length < 6) {
    return 'Password must be at least 6 characters';
  }
  return '';
};

export const validateConfirmPassword = (password = '', confirm = '') => {
  if (!confirm.trim()) {
    return 'Please confirm your password';
  }
  if (password !== confirm) {
    return 'Passwords do not match';
  }
  return '';
};

export const validateRequired = (value = '', field = 'This field') => {
  if (!value.trim()) {
    return `${field} is required`;
  }
  return '';
};
