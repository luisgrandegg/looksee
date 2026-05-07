import type { CustomProjectConfig } from 'lost-pixel';

export const config: CustomProjectConfig = {
  storybookShots: { storybookUrl: './storybook-static' },
  imagePathBaseline: './.lost-pixel/baseline',
  imagePathCurrent: './.lost-pixel/current',
  imagePathDifference: './.lost-pixel/difference',
  threshold: 0.01,
  failOnDifference: true,
  shotConcurrency: 4,
  breakpoints: [375, 1280],
  timeouts: {
    fetchStories: 60_000,
    loadState: 30_000,
    networkRequests: 30_000,
  },
};
