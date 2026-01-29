/**
 * PasswordStrengthMeter - LITPER PRO
 *
 * Indicador visual de fortaleza de contraseña en tiempo real
 * Inspirado en 1Password, Stripe y Linear
 */

import React, { useMemo } from 'react';
import { Check, X, Shield, ShieldCheck, ShieldAlert } from 'lucide-react';

interface PasswordStrengthMeterProps {
  password: string;
  showRequirements?: boolean;
  showScore?: boolean;
  minLength?: number;
  className?: string;
}

interface PasswordAnalysis {
  score: number;
  label: string;
  color: string;
  bgColor: string;
  feedback: string[];
  requirements: {
    label: string;
    met: boolean;
  }[];
}

export const PasswordStrengthMeter: React.FC<PasswordStrengthMeterProps> = ({
  password,
  showRequirements = true,
  showScore = true,
  minLength = 8,
  className = '',
}) => {
  const analysis = useMemo((): PasswordAnalysis => {
    const requirements = [
      {
        label: `Mínimo ${minLength} caracteres`,
        met: password.length >= minLength,
      },
      {
        label: 'Al menos una mayúscula',
        met: /[A-Z]/.test(password),
      },
      {
        label: 'Al menos una minúscula',
        met: /[a-z]/.test(password),
      },
      {
        label: 'Al menos un número',
        met: /[0-9]/.test(password),
      },
      {
        label: 'Al menos un carácter especial',
        met: /[!@#$%^&*(),.?":{}|<>_\-+=\[\]\\\/`~]/.test(password),
      },
    ];

    const feedback: string[] = [];

    // Calculate base score from requirements
    let score = requirements.filter((r) => r.met).length;

    // Bonus points
    if (password.length >= 12) score += 0.5;
    if (password.length >= 16) score += 0.5;

    // Check for common patterns (reduces score)
    const commonPatterns = [
      'password',
      '123456',
      'qwerty',
      'abc123',
      'letmein',
      'welcome',
      'admin',
      'login',
    ];
    if (commonPatterns.some((p) => password.toLowerCase().includes(p))) {
      score = Math.max(0, score - 2);
      feedback.push('Evita patrones comunes');
    }

    // Check for sequential characters
    if (/(.)\1{2,}/.test(password)) {
      score = Math.max(0, score - 1);
      feedback.push('Evita caracteres repetidos');
    }

    // Normalize score to 0-5
    score = Math.min(5, Math.max(0, score));

    // Determine label and colors
    let label: string;
    let color: string;
    let bgColor: string;

    if (password.length === 0) {
      label = '';
      color = 'text-zinc-500';
      bgColor = 'bg-zinc-700';
    } else if (score <= 1) {
      label = 'Muy débil';
      color = 'text-red-400';
      bgColor = 'bg-red-500';
      feedback.push('Agrega más variedad de caracteres');
    } else if (score <= 2) {
      label = 'Débil';
      color = 'text-orange-400';
      bgColor = 'bg-orange-500';
      feedback.push('Considera agregar caracteres especiales');
    } else if (score <= 3) {
      label = 'Aceptable';
      color = 'text-amber-400';
      bgColor = 'bg-amber-500';
    } else if (score <= 4) {
      label = 'Fuerte';
      color = 'text-emerald-400';
      bgColor = 'bg-emerald-500';
    } else {
      label = 'Muy fuerte';
      color = 'text-emerald-400';
      bgColor = 'bg-emerald-500';
    }

    return { score, label, color, bgColor, feedback, requirements };
  }, [password, minLength]);

  if (password.length === 0) {
    return null;
  }

  const percentage = (analysis.score / 5) * 100;

  return (
    <div className={`space-y-3 ${className}`}>
      {/* Strength bar */}
      <div className="space-y-2">
        {showScore && (
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {analysis.score <= 2 ? (
                <ShieldAlert className={`w-4 h-4 ${analysis.color}`} />
              ) : analysis.score <= 3 ? (
                <Shield className={`w-4 h-4 ${analysis.color}`} />
              ) : (
                <ShieldCheck className={`w-4 h-4 ${analysis.color}`} />
              )}
              <span className={`text-sm font-medium ${analysis.color}`}>
                {analysis.label}
              </span>
            </div>
            <span className="text-xs text-zinc-500">
              {Math.round(percentage)}%
            </span>
          </div>
        )}

        {/* Progress bar */}
        <div className="h-1.5 bg-zinc-800 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-300 ease-out ${analysis.bgColor}`}
            style={{ width: `${percentage}%` }}
          />
        </div>

        {/* Segmented indicator */}
        <div className="flex gap-1">
          {[1, 2, 3, 4, 5].map((segment) => (
            <div
              key={segment}
              className={`h-1 flex-1 rounded-full transition-colors duration-300 ${
                analysis.score >= segment ? analysis.bgColor : 'bg-zinc-800'
              }`}
            />
          ))}
        </div>
      </div>

      {/* Requirements list */}
      {showRequirements && (
        <div className="space-y-1.5">
          {analysis.requirements.map((req, index) => (
            <div
              key={index}
              className={`flex items-center gap-2 text-xs transition-colors duration-200 ${
                req.met ? 'text-emerald-400' : 'text-zinc-500'
              }`}
            >
              <div
                className={`w-4 h-4 rounded-full flex items-center justify-center transition-colors duration-200 ${
                  req.met ? 'bg-emerald-500/20' : 'bg-zinc-800'
                }`}
              >
                {req.met ? (
                  <Check className="w-2.5 h-2.5" />
                ) : (
                  <X className="w-2.5 h-2.5" />
                )}
              </div>
              <span>{req.label}</span>
            </div>
          ))}
        </div>
      )}

      {/* Additional feedback */}
      {analysis.feedback.length > 0 && (
        <div className="pt-2 border-t border-zinc-800">
          {analysis.feedback.map((tip, index) => (
            <p key={index} className="text-xs text-amber-400/80 flex items-center gap-1.5">
              <span className="w-1 h-1 rounded-full bg-amber-400/80" />
              {tip}
            </p>
          ))}
        </div>
      )}
    </div>
  );
};

// Compact version for inline use
export const PasswordStrengthIndicator: React.FC<{
  password: string;
  className?: string;
}> = ({ password, className = '' }) => {
  const strength = useMemo(() => {
    if (password.length === 0) return { score: 0, color: 'bg-zinc-700' };

    let score = 0;
    if (password.length >= 8) score++;
    if (/[A-Z]/.test(password)) score++;
    if (/[a-z]/.test(password)) score++;
    if (/[0-9]/.test(password)) score++;
    if (/[^A-Za-z0-9]/.test(password)) score++;

    const colors = [
      'bg-zinc-700',
      'bg-red-500',
      'bg-orange-500',
      'bg-amber-500',
      'bg-emerald-500',
      'bg-emerald-400',
    ];

    return { score, color: colors[score] };
  }, [password]);

  return (
    <div className={`flex gap-0.5 ${className}`}>
      {[1, 2, 3, 4, 5].map((segment) => (
        <div
          key={segment}
          className={`h-1 flex-1 rounded-full transition-colors duration-200 ${
            strength.score >= segment ? strength.color : 'bg-zinc-800'
          }`}
        />
      ))}
    </div>
  );
};

export default PasswordStrengthMeter;
