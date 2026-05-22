import React, { ReactNode } from 'react';
import { motion } from 'motion/react';

interface AuthShellProps {
  title: string;
  subtitle?: string;
  children: ReactNode;
  footer?: ReactNode;
}

/**
 * AuthShell — единая премиум-оболочка для всех публичных страниц
 * (login, register, forgot, reset, unauthorized).
 *
 * Чёрный фон + радиальный gold-glow + золотой логотип сверху + карточка.
 */
export const AuthShell: React.FC<AuthShellProps> = ({ title, subtitle, children, footer }) => {
  return (
    <div className="min-h-dvh w-full bg-bg relative flex items-center justify-center p-4 overflow-hidden">
      {/* Ambient gold glow */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            'radial-gradient(circle at 50% 30%, rgba(212, 175, 55, 0.18) 0%, rgba(212, 175, 55, 0.04) 30%, transparent 60%)',
        }}
      />
      {/* Bull silhouette — very subtle, blend mode */}
      <div
        className="absolute inset-0 pointer-events-none opacity-[0.08] mix-blend-luminosity"
        style={{
          backgroundImage: "url('/images/golden_bull_bg.png')",
          backgroundSize: 'contain',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat',
        }}
      />
      {/* Vignette */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            'radial-gradient(ellipse at center, transparent 40%, rgba(0,0,0,0.6) 100%)',
        }}
      />

      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        className="relative z-10 w-full max-w-[440px]"
      >
        {/* Brand */}
        <div className="mb-8 text-center">
          <h1 className="font-serif text-4xl sm:text-5xl font-bold tracking-[0.18em]">
            <span className="gold-gradient-text">BULLEN</span>
            <span className="text-text">HAUS</span>
          </h1>
          <p className="text-[10px] font-bold text-gold/80 tracking-[0.4em] mt-3 uppercase">
            Trade · Invest · Grow
          </p>
        </div>

        {/* Card */}
        <div className="glass-card p-8 relative overflow-hidden">
          {/* Subtle top gold hairline */}
          <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-gold/60 to-transparent" />

          <div className="mb-7">
            <h2 className="font-serif text-2xl font-semibold text-text tracking-tight">{title}</h2>
            {subtitle && <p className="text-sm text-text-muted mt-1.5">{subtitle}</p>}
          </div>

          {children}

          {footer && (
            <div className="mt-7 pt-6 border-t border-border text-center text-sm text-text-muted">
              {footer}
            </div>
          )}
        </div>

        <p className="text-center text-[10px] text-text-dim tracking-[0.3em] uppercase mt-6">
          Secured · Encrypted · Audited
        </p>
      </motion.div>
    </div>
  );
};
