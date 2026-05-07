import type { Meta, StoryObj } from '@storybook/react';
import { Card } from './Card';

const meta: Meta<typeof Card> = {
  title: 'Components/Card',
  component: Card,
  args: {
    title: 'Welcome',
    body: 'This card is rendered deterministically — same fonts, same colours, same layout every run.',
    footer: 'looksee.dev',
  },
};

export default meta;
type Story = StoryObj<typeof Card>;

export const Default: Story = {};

export const NoFooter: Story = {
  args: { footer: undefined },
};
