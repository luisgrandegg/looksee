import type { CustomProjectConfig } from 'lost-pixel';

// Note: this config is for the e2e fixture, not the consumer-facing reference.
// The source-of-truth template at src/templates/lostpixel.config.ts uses the
// conservative threshold (0.01) that real consumers should adopt. Here we set
// threshold to 0 so the e2e Red job catches small injected changes too —
// the test's value comes from "any deliberate change must be detected", not
// from realistic-noise tolerance.
export const config: CustomProjectConfig = {
  storybookShots: { storybookUrl: './storybook-static' },
  imagePathBaseline: './.lost-pixel/baseline',
  imagePathCurrent: './.lost-pixel/current',
  imagePathDifference: './.lost-pixel/difference',
  threshold: 0,
  // For the e2e fixture we fail on any kind of change — pixel difference,
  // a new screenshot showing up, or a baseline disappearing. Real consumers
  // typically want only failOnDifference: true; we're testing every angle.
  failOnDifference: true,
  failOnAddition: true,
  failOnDeletion: true,
  shotConcurrency: 4,
  breakpoints: [375, 1280],
  timeouts: {
    fetchStories: 60_000,
    loadState: 30_000,
    networkRequests: 30_000,
  },
};
