import type { ReactNode } from 'react';
import * as Slides from '@/components/slides';

export type SlideMapEntry = {
  slide: ReactNode;
};

export const SLIDES_FALLBACK: SlideMapEntry = {
  slide: <Slides.PlaceholderSlide />,
};

export const SLIDES_MAP: Record<string, SlideMapEntry> = {
  'a-1': { slide: <Slides.AnalyticsA1Slide /> },

  'a-2': { slide: <Slides.AnalyticsA2Slide /> },
  'a-2-2': { slide: <Slides.AnalyticsA2_2Slide /> },
  'a-2-3': { slide: <Slides.AnalyticsA2_3Slide /> },
  'a-2-4': { slide: <Slides.AnalyticsA2_4Slide /> },
  'a-2-5': { slide: <Slides.AnalyticsA2_5Slide /> },

  'a-3': { slide: <Slides.AnalyticsA3Slide /> },
  'a-3-1': { slide: <Slides.AnalyticsA3_1Slide /> },
  'a-3-2': { slide: <Slides.AnalyticsA3_2Slide /> },
  'a-3-3': { slide: <Slides.AnalyticsA3_3Slide /> },
  'a-3-4': { slide: <Slides.AnalyticsA3_4Slide /> },
  'a-3-5': { slide: <Slides.AnalyticsA3_5Slide /> },
  'a-3-6': { slide: <Slides.AnalyticsA3_6Slide /> },

  'a-4': { slide: <Slides.AnalyticsA4Slide /> },
  'a-4-1': { slide: <Slides.AnalyticsA4_1Slide /> },
  'a-4-2': { slide: <Slides.AnalyticsA4_2Slide /> },
  'a-4-3': { slide: <Slides.AnalyticsA4_3Slide /> },
  'a-4-4': { slide: <Slides.AnalyticsA4_4Slide /> },
  'a-4-5': { slide: <Slides.AnalyticsA4_5Slide /> },
  'a-4-6': { slide: <Slides.AnalyticsA4_6Slide /> },
  'a-4-7': { slide: <Slides.AnalyticsA4_7Slide /> },

  'a-5': { slide: <Slides.AnalyticsA5Slide /> },
  'a-5-1': { slide: <Slides.AnalyticsA5_1Slide /> },
  'a-5-2': { slide: <Slides.AnalyticsA5_2Slide /> },
  'a-5-3': { slide: <Slides.AnalyticsA5_3Slide /> },
  'a-5-4': { slide: <Slides.AnalyticsA5_4Slide /> },
  'a-5-5': { slide: <Slides.AnalyticsA5_5Slide /> },
  'a-5-6': { slide: <Slides.AnalyticsA5_6Slide /> },
  'a-5-7': { slide: <Slides.AnalyticsA5_7Slide /> },
  'a-5-8': { slide: <Slides.AnalyticsA5_8Slide /> },

  'a-6': { slide: <Slides.AnalyticsA6Slide /> },
  'a-6-1': { slide: <Slides.AnalyticsA6_1Slide /> },
  'a-6-2': { slide: <Slides.AnalyticsA6_2Slide /> },
  'a-6-3': { slide: <Slides.AnalyticsA6_3Slide /> },
  'a-6-4': { slide: <Slides.AnalyticsA6_4Slide /> },
  'a-6-5': { slide: <Slides.AnalyticsA6_5Slide /> },
  'a-6-6': { slide: <Slides.AnalyticsA6_6Slide /> },
  'a-6-7': { slide: <Slides.AnalyticsA6_7Slide /> },
  'a-6-8': { slide: <Slides.AnalyticsA6_8Slide /> },
  'a-6-9': { slide: <Slides.AnalyticsA6_9Slide /> },
  'a-6-10': { slide: <Slides.AnalyticsA6_10Slide /> },
};
