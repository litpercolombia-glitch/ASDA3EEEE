/**
 * Auth Pages Index - LITPER PRO
 *
 * Exporta todas las páginas de autenticación
 */

// Login
export { LoginPage } from './LoginPage';
export type { default as LoginPageType } from './LoginPage';

// Register
export { RegisterPage } from './RegisterPage';
export type { default as RegisterPageType } from './RegisterPage';

// Forgot Password
export { ForgotPasswordPage } from './ForgotPasswordPage';
export type { default as ForgotPasswordPageType } from './ForgotPasswordPage';

// Reset Password
export { ResetPasswordPage } from './ResetPasswordPage';
export type { default as ResetPasswordPageType } from './ResetPasswordPage';

// Two Factor
export { TwoFactorPage } from './TwoFactorPage';
export type { default as TwoFactorPageType } from './TwoFactorPage';

// Onboarding
export { OnboardingPage } from './OnboardingPage';
export type { default as OnboardingPageType } from './OnboardingPage';

// Re-export components for convenience
export * from '../../components/auth';
