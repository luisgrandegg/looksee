import type { Preview } from '@storybook/react';

const preview: Preview = {
  parameters: {
    // Disable Storybook's controls table from showing in the snapshot canvas.
    layout: 'centered',
    backgrounds: {
      default: 'light',
      values: [
        { name: 'light', value: '#ffffff' },
        { name: 'dark', value: '#0d0d0d' },
      ],
    },
  },
};

export default preview;
