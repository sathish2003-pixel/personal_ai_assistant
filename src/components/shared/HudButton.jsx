import { motion } from 'framer-motion';

const sizeMap = {
  sm: {
    padding: '4px 12px',
    fontSize: '10px',
    minHeight: '28px',
  },
  md: {
    padding: '8px 20px',
    fontSize: '11px',
    minHeight: '36px',
  },
  lg: {
    padding: '10px 28px',
    fontSize: '12px',
    minHeight: '44px',
  },
};

const variantStyles = {
  primary: {
    base: {
      background: 'rgba(79, 195, 247, 0.08)',
      border: '1px solid var(--arc-blue)',
      color: 'var(--arc-blue)',
    },
    hover: {
      background: 'rgba(79, 195, 247, 0.15)',
      boxShadow: '0 0 16px rgba(79, 195, 247, 0.3), inset 0 0 8px rgba(79, 195, 247, 0.1)',
      borderColor: 'var(--arc-blue-bright)',
    },
  },
  danger: {
    base: {
      background: 'rgba(255, 82, 82, 0.08)',
      border: '1px solid var(--priority-high)',
      color: 'var(--priority-high)',
    },
    hover: {
      background: 'rgba(255, 82, 82, 0.15)',
      boxShadow: '0 0 16px rgba(255, 82, 82, 0.3), inset 0 0 8px rgba(255, 82, 82, 0.1)',
    },
  },
  ghost: {
    base: {
      background: 'transparent',
      border: '1px solid transparent',
      color: 'var(--hud-white-dim)',
    },
    hover: {
      background: 'rgba(79, 195, 247, 0.06)',
      borderColor: 'var(--border-hud)',
      color: 'var(--hud-white)',
    },
  },
};

export default function HudButton({
  children,
  onClick,
  variant = 'primary',
  size = 'md',
  icon: Icon,
  disabled = false,
  className = '',
  style: overrideStyle = {},
  type = 'button',
}) {
  const sizeStyle = sizeMap[size] || sizeMap.md;
  const vStyle = variantStyles[variant] || variantStyles.primary;

  return (
    <motion.button
      type={type}
      onClick={onClick}
      disabled={disabled}
      whileHover={disabled ? {} : { scale: 1.02, ...vStyle.hover }}
      whileTap={disabled ? {} : { scale: 0.98 }}
      transition={{ type: 'spring', stiffness: 400, damping: 25 }}
      className={className}
      style={{
        ...vStyle.base,
        ...sizeStyle,
        fontFamily: 'var(--font-display)',
        textTransform: 'uppercase',
        letterSpacing: '0.1em',
        cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.4 : 1,
        borderRadius: '3px',
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '8px',
        outline: 'none',
        whiteSpace: 'nowrap',
        transition: 'background 0.2s, border-color 0.2s, color 0.2s, box-shadow 0.2s',
        ...overrideStyle,
      }}
    >
      {Icon && (
        <span style={{ display: 'flex', alignItems: 'center', fontSize: '1.15em' }}>
          {typeof Icon === 'function' ? <Icon size={sizeStyle.fontSize === '10px' ? 12 : 14} /> : Icon}
        </span>
      )}
      {children}
    </motion.button>
  );
}
