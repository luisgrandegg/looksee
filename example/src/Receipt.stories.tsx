import type { Meta, StoryObj } from '@storybook/react';
import { Receipt } from './Receipt';

const meta: Meta<typeof Receipt> = {
  title: 'Demos/Receipt',
  component: Receipt,
  args: { total: 19.99, currency: '€' },
};

export default meta;
type Story = StoryObj<typeof Receipt>;

/**
 * The Receipt component reads `new Date()` by default. That kills determinism —
 * the diff would change every minute. Mock the time by passing a fixed Date in.
 *
 * Lesson: components that need to display time should accept a Date as a prop,
 * not call `Date.now()` internally. Stories pass a fixed Date; production callers
 * pass `new Date()` at the right level.
 */
export const Deterministic: Story = {
  args: {
    issuedAt: new Date('2026-05-01T12:00:00Z'),
  },
};
