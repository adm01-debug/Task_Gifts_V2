/**
 * Validators for the application
 */

/**
 * Basic email validator
 */
export const isValidEmail = (email: string): boolean => {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(email);
};

/**
 * Password strength validator
 * Min 8 chars, at least one letter and one number
 */
export const isStrongPassword = (password: string): boolean => {
  return password.length >= 8 && /[A-Za-z]/.test(password) && /[0-9]/.test(password);
};