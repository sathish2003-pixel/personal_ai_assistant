import { useState, forwardRef } from 'react';

const baseInputStyle = {
  width: '100%',
  background: 'transparent',
  border: 'none',
  borderBottom: '1px solid var(--border-hud)',
  padding: '8px 4px',
  color: 'var(--hud-white)',
  fontFamily: 'var(--font-body)',
  fontSize: '14px',
  outline: 'none',
  transition: 'border-color 0.3s, box-shadow 0.3s',
};

const focusedBorder = {
  borderBottomColor: 'var(--arc-blue)',
  boxShadow: '0 1px 0 0 var(--arc-blue), 0 2px 8px -2px rgba(79, 195, 247, 0.3)',
};

const labelBaseStyle = {
  position: 'absolute',
  left: '4px',
  fontFamily: 'var(--font-body)',
  fontSize: '14px',
  color: 'var(--hud-white-dim)',
  pointerEvents: 'none',
  transition: 'all 0.25s ease',
};

const labelFloatedStyle = {
  top: '-6px',
  fontSize: '10px',
  color: 'var(--arc-blue)',
  letterSpacing: '0.05em',
};

const labelRestStyle = {
  top: '8px',
};

// --- HudInput ---
const HudInput = forwardRef(function HudInput(
  { label, icon: Icon, className = '', style: overrideStyle = {}, onFocus, onBlur, value, ...rest },
  ref
) {
  const [focused, setFocused] = useState(false);
  const hasValue = value !== undefined && value !== null && value !== '';
  const isFloated = focused || hasValue;

  return (
    <div
      className={className}
      style={{
        position: 'relative',
        display: 'flex',
        alignItems: 'flex-end',
        gap: '8px',
        ...overrideStyle,
      }}
    >
      {Icon && (
        <span
          style={{
            color: focused ? 'var(--arc-blue)' : 'var(--hud-white-dim)',
            display: 'flex',
            alignItems: 'center',
            paddingBottom: '8px',
            transition: 'color 0.3s',
          }}
        >
          {typeof Icon === 'function' ? <Icon size={16} /> : Icon}
        </span>
      )}
      <div style={{ position: 'relative', flex: 1 }}>
        {label && (
          <span style={{ ...labelBaseStyle, ...(isFloated ? labelFloatedStyle : labelRestStyle) }}>
            {label}
          </span>
        )}
        <input
          ref={ref}
          value={value}
          onFocus={(e) => {
            setFocused(true);
            onFocus?.(e);
          }}
          onBlur={(e) => {
            setFocused(false);
            onBlur?.(e);
          }}
          style={{
            ...baseInputStyle,
            ...(focused ? focusedBorder : {}),
            paddingTop: label ? '14px' : '8px',
          }}
          {...rest}
        />
      </div>
    </div>
  );
});

// --- HudSelect ---
const HudSelect = forwardRef(function HudSelect(
  { label, icon: Icon, className = '', style: overrideStyle = {}, children, onFocus, onBlur, value, ...rest },
  ref
) {
  const [focused, setFocused] = useState(false);
  const hasValue = value !== undefined && value !== null && value !== '';
  const isFloated = focused || hasValue;

  return (
    <div
      className={className}
      style={{
        position: 'relative',
        display: 'flex',
        alignItems: 'flex-end',
        gap: '8px',
        ...overrideStyle,
      }}
    >
      {Icon && (
        <span
          style={{
            color: focused ? 'var(--arc-blue)' : 'var(--hud-white-dim)',
            display: 'flex',
            alignItems: 'center',
            paddingBottom: '8px',
            transition: 'color 0.3s',
          }}
        >
          {typeof Icon === 'function' ? <Icon size={16} /> : Icon}
        </span>
      )}
      <div style={{ position: 'relative', flex: 1 }}>
        {label && (
          <span style={{ ...labelBaseStyle, ...(isFloated ? labelFloatedStyle : labelRestStyle) }}>
            {label}
          </span>
        )}
        <select
          ref={ref}
          value={value}
          onFocus={(e) => {
            setFocused(true);
            onFocus?.(e);
          }}
          onBlur={(e) => {
            setFocused(false);
            onBlur?.(e);
          }}
          style={{
            ...baseInputStyle,
            ...(focused ? focusedBorder : {}),
            paddingTop: label ? '14px' : '8px',
            appearance: 'none',
            backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='6' viewBox='0 0 10 6'%3E%3Cpath d='M0 0l5 6 5-6z' fill='%234FC3F7'/%3E%3C/svg%3E")`,
            backgroundRepeat: 'no-repeat',
            backgroundPosition: 'right 4px center',
            paddingRight: '20px',
            cursor: 'pointer',
          }}
          {...rest}
        >
          {children}
        </select>
      </div>
    </div>
  );
});

// --- HudTextarea ---
const HudTextarea = forwardRef(function HudTextarea(
  { label, icon: Icon, className = '', style: overrideStyle = {}, onFocus, onBlur, value, rows = 3, ...rest },
  ref
) {
  const [focused, setFocused] = useState(false);
  const hasValue = value !== undefined && value !== null && value !== '';
  const isFloated = focused || hasValue;

  return (
    <div
      className={className}
      style={{
        position: 'relative',
        display: 'flex',
        alignItems: 'flex-start',
        gap: '8px',
        ...overrideStyle,
      }}
    >
      {Icon && (
        <span
          style={{
            color: focused ? 'var(--arc-blue)' : 'var(--hud-white-dim)',
            display: 'flex',
            alignItems: 'center',
            paddingTop: label ? '20px' : '8px',
            transition: 'color 0.3s',
          }}
        >
          {typeof Icon === 'function' ? <Icon size={16} /> : Icon}
        </span>
      )}
      <div style={{ position: 'relative', flex: 1 }}>
        {label && (
          <span style={{ ...labelBaseStyle, ...(isFloated ? labelFloatedStyle : labelRestStyle) }}>
            {label}
          </span>
        )}
        <textarea
          ref={ref}
          value={value}
          rows={rows}
          onFocus={(e) => {
            setFocused(true);
            onFocus?.(e);
          }}
          onBlur={(e) => {
            setFocused(false);
            onBlur?.(e);
          }}
          style={{
            ...baseInputStyle,
            ...(focused ? focusedBorder : {}),
            paddingTop: label ? '14px' : '8px',
            resize: 'vertical',
            minHeight: '60px',
            borderBottom: 'none',
            border: '1px solid var(--border-hud)',
            borderRadius: '3px',
            ...(focused
              ? {
                  borderColor: 'var(--arc-blue)',
                  boxShadow: '0 0 8px rgba(79, 195, 247, 0.2)',
                }
              : {}),
          }}
          {...rest}
        />
      </div>
    </div>
  );
});

export default HudInput;
export { HudInput, HudSelect, HudTextarea };
