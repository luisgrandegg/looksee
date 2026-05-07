import type { CSSProperties } from 'react';

export interface ReceiptProps {
  total: number;
  currency: string;
  /** Pass a fixed Date in stories to keep this story deterministic. */
  issuedAt?: Date;
}

const wrap: CSSProperties = {
  width: 280,
  padding: 16,
  fontFamily: 'monospace',
  fontSize: 14,
  background: '#fffdf6',
  border: '1px solid #f3e9c6',
  borderRadius: 6,
  color: '#1f2937',
};

export function Receipt({ total, currency, issuedAt = new Date() }: ReceiptProps): JSX.Element {
  return (
    <div style={wrap}>
      <header style={{ fontWeight: 700, marginBottom: 8 }}>RECEIPT</header>
      <div>Issued: {issuedAt.toISOString().replace('T', ' ').slice(0, 19)} UTC</div>
      <div style={{ marginTop: 12, fontSize: 18, fontWeight: 700 }}>
        {currency} {total.toFixed(2)}
      </div>
    </div>
  );
}
