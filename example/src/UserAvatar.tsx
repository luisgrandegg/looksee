import type { CSSProperties } from 'react';

export interface UserAvatarProps {
  name: string;
  email: string;
  /** A user-uploaded URL — naturally varies per user. Mask this in lost-pixel. */
  avatarUrl: string;
}

const wrap: CSSProperties = {
  display: 'flex',
  gap: 12,
  alignItems: 'center',
  fontFamily: 'system-ui, -apple-system, sans-serif',
};

const img: CSSProperties = {
  width: 48,
  height: 48,
  borderRadius: '50%',
  objectFit: 'cover',
  background: '#e5e7eb',
};

export function UserAvatar({ name, email, avatarUrl }: UserAvatarProps): JSX.Element {
  return (
    <div style={wrap} data-testid="user-avatar-row">
      <img src={avatarUrl} alt="" data-testid="user-avatar" style={img} />
      <div>
        <div style={{ fontWeight: 600, color: '#111827' }}>{name}</div>
        <div style={{ color: '#6b7280', fontSize: 14 }}>{email}</div>
      </div>
    </div>
  );
}
