import type { Meta, StoryObj } from '@storybook/react';
import { UserAvatar } from './UserAvatar';

const meta: Meta<typeof UserAvatar> = {
  title: 'Demos/UserAvatar',
  component: UserAvatar,
  args: {
    name: 'Ada Lovelace',
    email: 'ada@example.org',
    avatarUrl: 'https://i.pravatar.cc/96?u=ada',
  },
};

export default meta;
type Story = StoryObj<typeof UserAvatar>;

/**
 * `parameters.lostPixel.mask` blanks out specific elements before diffing —
 * useful for content that legitimately varies per render (user-uploaded
 * avatars, randomised IDs, "last seen" timestamps).
 *
 * Selectors are CSS selectors evaluated on the rendered story.
 */
export const WithMaskedAvatar: Story = {
  parameters: {
    lostPixel: {
      mask: [{ selector: '[data-testid="user-avatar"]' }],
    },
  },
};
