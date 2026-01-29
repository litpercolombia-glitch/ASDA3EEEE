/**
 * Auth UI Types - LITPER PRO
 *
 * Tipos para el sistema de autenticación inspirado en Stripe/Linear/Vercel
 */

// ============================================
// FORM TYPES
// ============================================

export interface LoginFormData {
  email: string;
  password: string;
  rememberMe: boolean;
}

export interface RegisterFormData {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  confirmPassword: string;
  companyName?: string;
  acceptTerms: boolean;
  acceptMarketing?: boolean;
}

export interface ForgotPasswordFormData {
  email: string;
}

export interface ResetPasswordFormData {
  password: string;
  confirmPassword: string;
  token: string;
}

export interface TwoFactorFormData {
  code: string;
  trustDevice?: boolean;
}

// ============================================
// VALIDATION TYPES
// ============================================

export interface ValidationError {
  field: string;
  message: string;
  type: 'error' | 'warning' | 'info';
}

export interface FieldValidationState {
  isValid: boolean;
  isTouched: boolean;
  isDirty: boolean;
  isValidating: boolean;
  errors: string[];
  warnings: string[];
}

export interface FormValidationState {
  isValid: boolean;
  isSubmitting: boolean;
  isSubmitted: boolean;
  fields: Record<string, FieldValidationState>;
}

export interface PasswordStrength {
  score: number; // 0-4
  label: 'very-weak' | 'weak' | 'fair' | 'strong' | 'very-strong';
  feedback: string[];
  color: string;
  percentage: number;
}

// ============================================
// COMPONENT PROPS TYPES
// ============================================

export interface AuthInputProps {
  id: string;
  name: string;
  type: 'text' | 'email' | 'password' | 'tel';
  label: string;
  placeholder?: string;
  value: string;
  onChange: (value: string) => void;
  onBlur?: () => void;
  onFocus?: () => void;
  error?: string;
  warning?: string;
  success?: string;
  hint?: string;
  disabled?: boolean;
  required?: boolean;
  autoComplete?: string;
  autoFocus?: boolean;
  icon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  showPasswordToggle?: boolean;
  maxLength?: number;
  pattern?: string;
  className?: string;
}

export interface AuthButtonProps {
  type?: 'button' | 'submit' | 'reset';
  variant: 'primary' | 'secondary' | 'ghost' | 'danger' | 'success';
  size: 'sm' | 'md' | 'lg' | 'xl';
  children: React.ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  loading?: boolean;
  loadingText?: string;
  fullWidth?: boolean;
  icon?: React.ReactNode;
  iconPosition?: 'left' | 'right';
  className?: string;
}

export interface AuthCardProps {
  children: React.ReactNode;
  className?: string;
  variant?: 'default' | 'glass' | 'elevated' | 'bordered';
  padding?: 'none' | 'sm' | 'md' | 'lg' | 'xl';
  animate?: boolean;
}

export interface SocialLoginButtonProps {
  provider: SocialProvider;
  onClick: () => void;
  disabled?: boolean;
  loading?: boolean;
  variant?: 'default' | 'outline' | 'filled';
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
}

export interface AnimatedBackgroundProps {
  variant?: 'gradient' | 'mesh' | 'particles' | 'aurora' | 'waves';
  intensity?: 'subtle' | 'medium' | 'vibrant';
  colors?: string[];
  blur?: number;
  className?: string;
}

export interface TwoFactorInputProps {
  length: number;
  value: string;
  onChange: (value: string) => void;
  onComplete?: (value: string) => void;
  disabled?: boolean;
  error?: string;
  autoFocus?: boolean;
  type?: 'numeric' | 'alphanumeric';
}

// ============================================
// SOCIAL PROVIDERS
// ============================================

export type SocialProvider = 'google' | 'github' | 'microsoft' | 'apple' | 'linkedin';

export interface SocialProviderConfig {
  id: SocialProvider;
  name: string;
  icon: string;
  color: string;
  bgColor: string;
  hoverColor: string;
}

export const SOCIAL_PROVIDERS: Record<SocialProvider, SocialProviderConfig> = {
  google: {
    id: 'google',
    name: 'Google',
    icon: 'G',
    color: '#4285F4',
    bgColor: '#ffffff',
    hoverColor: '#f8f9fa',
  },
  github: {
    id: 'github',
    name: 'GitHub',
    icon: 'GH',
    color: '#ffffff',
    bgColor: '#24292e',
    hoverColor: '#2f363d',
  },
  microsoft: {
    id: 'microsoft',
    name: 'Microsoft',
    icon: 'M',
    color: '#ffffff',
    bgColor: '#2f2f2f',
    hoverColor: '#3b3b3b',
  },
  apple: {
    id: 'apple',
    name: 'Apple',
    icon: 'A',
    color: '#ffffff',
    bgColor: '#000000',
    hoverColor: '#1a1a1a',
  },
  linkedin: {
    id: 'linkedin',
    name: 'LinkedIn',
    icon: 'in',
    color: '#ffffff',
    bgColor: '#0077B5',
    hoverColor: '#005e93',
  },
};

// ============================================
// ONBOARDING TYPES
// ============================================

export interface OnboardingStep {
  id: string;
  title: string;
  subtitle?: string;
  description?: string;
  icon?: React.ReactNode;
  component?: React.ComponentType<OnboardingStepProps>;
  isOptional?: boolean;
  isCompleted?: boolean;
}

export interface OnboardingStepProps {
  onNext: () => void;
  onBack: () => void;
  onSkip?: () => void;
  isFirstStep: boolean;
  isLastStep: boolean;
  stepData: Record<string, unknown>;
  setStepData: (data: Record<string, unknown>) => void;
}

export interface OnboardingData {
  companyName?: string;
  companySize?: string;
  industry?: string;
  role?: string;
  goals?: string[];
  integrations?: string[];
  teamMembers?: { email: string; role: string }[];
  preferences?: {
    theme: 'light' | 'dark' | 'system';
    language: string;
    notifications: boolean;
  };
}

// ============================================
// AUTH STATE TYPES
// ============================================

export interface AuthUIState {
  currentStep: 'login' | 'register' | 'forgot-password' | 'reset-password' | '2fa' | 'onboarding';
  isLoading: boolean;
  error: string | null;
  successMessage: string | null;
  formData: Partial<LoginFormData & RegisterFormData>;
  validationState: FormValidationState;
  socialLoginPending: SocialProvider | null;
  rememberMe: boolean;
}

// ============================================
// ANIMATION TYPES
// ============================================

export interface AnimationConfig {
  duration: number;
  delay?: number;
  easing: string;
  direction?: 'normal' | 'reverse' | 'alternate';
  fillMode?: 'none' | 'forwards' | 'backwards' | 'both';
  iterationCount?: number | 'infinite';
}

export interface TransitionConfig {
  property: string;
  duration: number;
  easing: string;
  delay?: number;
}

// ============================================
// THEME TYPES
// ============================================

export interface AuthTheme {
  // Colors
  primary: string;
  primaryHover: string;
  primaryActive: string;
  secondary: string;
  background: string;
  surface: string;
  surfaceHover: string;
  text: string;
  textSecondary: string;
  textMuted: string;
  border: string;
  borderHover: string;
  error: string;
  errorLight: string;
  success: string;
  successLight: string;
  warning: string;
  warningLight: string;

  // Gradients
  gradientPrimary: string;
  gradientSecondary: string;
  gradientBackground: string;

  // Glassmorphism
  glassBackground: string;
  glassBorder: string;
  glassBlur: number;

  // Shadows
  shadowSm: string;
  shadowMd: string;
  shadowLg: string;
  shadowXl: string;
  shadowGlow: string;

  // Border Radius
  radiusSm: string;
  radiusMd: string;
  radiusLg: string;
  radiusXl: string;
  radiusFull: string;
}

export const DEFAULT_AUTH_THEME: AuthTheme = {
  // Colors - Inspired by Linear/Stripe
  primary: '#5E5ADB',
  primaryHover: '#4F4BC9',
  primaryActive: '#4340B7',
  secondary: '#6B7280',
  background: '#0A0A0B',
  surface: '#18181B',
  surfaceHover: '#27272A',
  text: '#FAFAFA',
  textSecondary: '#A1A1AA',
  textMuted: '#71717A',
  border: '#27272A',
  borderHover: '#3F3F46',
  error: '#EF4444',
  errorLight: '#FEE2E2',
  success: '#10B981',
  successLight: '#D1FAE5',
  warning: '#F59E0B',
  warningLight: '#FEF3C7',

  // Gradients
  gradientPrimary: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
  gradientSecondary: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
  gradientBackground: 'linear-gradient(135deg, #0c0c0c 0%, #1a1a2e 50%, #16213e 100%)',

  // Glassmorphism
  glassBackground: 'rgba(255, 255, 255, 0.05)',
  glassBorder: 'rgba(255, 255, 255, 0.1)',
  glassBlur: 20,

  // Shadows
  shadowSm: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
  shadowMd: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
  shadowLg: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
  shadowXl: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
  shadowGlow: '0 0 40px rgba(94, 90, 219, 0.3)',

  // Border Radius
  radiusSm: '0.375rem',
  radiusMd: '0.5rem',
  radiusLg: '0.75rem',
  radiusXl: '1rem',
  radiusFull: '9999px',
};
