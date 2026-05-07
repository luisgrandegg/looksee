import type { CSSProperties, ReactNode } from 'react';

export interface ButtonProps {
  children: ReactNode;
  variant?: 'primary' | 'secondary';
  disabled?: boolean;
  onClick?: () => void;
}

const baseStyle: CSSProperties = {
  fontFamily: 'system-ui, -apple-system, sans-serif',
  fontSize: 16,
  fontWeight: 500,
  padding: '10px 20px',
  borderRadius: 8,
  border: '1px solid transparent',
  cursor: 'pointer',
};

const variantStyle: Record<NonNullable<ButtonProps['variant']>, CSSProperties> = {
  primary: { background: '#2563eb', color: '#ffffff' },
  secondary: { background: '#ffffff', color: '#111827', borderColor: '#d1d5db' },
};

export function Button({ children, variant = 'primary', disabled, onClick }: ButtonProps): JSX.Element {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      style={{
        ...baseStyle,
        ...variantStyle[variant],
        opacity: disabled ? 0.5 : 1,
        cursor: disabled ? 'not-allowed' : 'pointer',
      }}
    >
      {children}
    </button>
  );
}
