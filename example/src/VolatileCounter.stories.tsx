import type { Meta, StoryObj } from '@storybook/react';
import { VolatileCounter } from './VolatileCounter';

const meta: Meta<typeof VolatileCounter> = {
  title: 'Demos/VolatileCounter',
  component: VolatileCounter,
};

export default meta;
type Story = StoryObj<typeof VolatileCounter>;

/**
 * `parameters.lostPixel.disable` opts a story out of visual regression testing.
 * Use this for any story that is intrinsically non-deterministic — animations,
 * timers, randomised content. Prefer fixing determinism over disabling, but
 * the escape hatch is here when you need it.
 */
export const Disabled: Story = {
  parameters: {
    lostPixel: { disable: true },
  },
};
