import type { CSSProperties, ReactNode } from 'react';

export interface CardProps {
  title: string;
  body: ReactNode;
  footer?: ReactNode;
}

const cardStyle: CSSProperties = {
  fontFamily: 'system-ui, -apple-system, sans-serif',
  width: 320,
  border: '1px solid #e5e7eb',
  borderRadius: 12,
  padding: 20,
  background: '#ffffff',
  boxShadow: '0 1px 2px rgba(0,0,0,0.04)',
};

export function Card({ title, body, footer }: CardProps): JSX.Element {
  return (
    <article style={cardStyle}>
      <h2 style={{ margin: 0, marginBottom: 8, fontSize: 18, fontWeight: 600, color: '#111827' }}>
        {title}
      </h2>
      <div style={{ color: '#374151', lineHeight: 1.5 }}>{body}</div>
      {footer && (
        <footer style={{ marginTop: 16, paddingTop: 12, borderTop: '1px solid #f3f4f6', color: '#6b7280' }}>
          {footer}
        </footer>
      )}
    </article>
  );
}
