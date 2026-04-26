type AnalyticsSlideTemplateProps = {
  slideId: string;
};

function AnalyticsSlideTemplate({ slideId }: AnalyticsSlideTemplateProps) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-4">
      <h3 className="text-base font-semibold text-slate-900">Analytics Slide {slideId}</h3>
      <p className="mt-2 text-sm text-slate-600">
        Client component for slide {slideId}. Replace with real content when needed.
      </p>
    </div>
  );
}

const createAnalyticsSlideComponent = (slideId: string) => {
  return function AnalyticsSlideComponent() {
    return <AnalyticsSlideTemplate slideId={slideId} />;
  };
};

export const AnalyticsA1Slide = createAnalyticsSlideComponent("a-1");

export const AnalyticsA2Slide = createAnalyticsSlideComponent("a-2");
export const AnalyticsA2_1Slide = createAnalyticsSlideComponent("a-2-1");
export const AnalyticsA2_2Slide = createAnalyticsSlideComponent("a-2-2");
export const AnalyticsA2_3Slide = createAnalyticsSlideComponent("a-2-3");
export const AnalyticsA2_4Slide = createAnalyticsSlideComponent("a-2-4");
export const AnalyticsA2_5Slide = createAnalyticsSlideComponent("a-2-5");

export const AnalyticsA3Slide = createAnalyticsSlideComponent("a-3");
export const AnalyticsA3_1Slide = createAnalyticsSlideComponent("a-3-1");
export const AnalyticsA3_2Slide = createAnalyticsSlideComponent("a-3-2");
export const AnalyticsA3_3Slide = createAnalyticsSlideComponent("a-3-3");
export const AnalyticsA3_4Slide = createAnalyticsSlideComponent("a-3-4");
export const AnalyticsA3_5Slide = createAnalyticsSlideComponent("a-3-5");
export const AnalyticsA3_6Slide = createAnalyticsSlideComponent("a-3-6");

export const AnalyticsA4Slide = createAnalyticsSlideComponent("a-4");
export const AnalyticsA4_1Slide = createAnalyticsSlideComponent("a-4-1");
export const AnalyticsA4_2Slide = createAnalyticsSlideComponent("a-4-2");
export const AnalyticsA4_3Slide = createAnalyticsSlideComponent("a-4-3");
export const AnalyticsA4_4Slide = createAnalyticsSlideComponent("a-4-4");
export const AnalyticsA4_5Slide = createAnalyticsSlideComponent("a-4-5");
export const AnalyticsA4_6Slide = createAnalyticsSlideComponent("a-4-6");
export const AnalyticsA4_7Slide = createAnalyticsSlideComponent("a-4-7");

export const AnalyticsA5Slide = createAnalyticsSlideComponent("a-5");
export const AnalyticsA5_1Slide = createAnalyticsSlideComponent("a-5-1");
export const AnalyticsA5_2Slide = createAnalyticsSlideComponent("a-5-2");
export const AnalyticsA5_3Slide = createAnalyticsSlideComponent("a-5-3");
export const AnalyticsA5_4Slide = createAnalyticsSlideComponent("a-5-4");
export const AnalyticsA5_5Slide = createAnalyticsSlideComponent("a-5-5");
export const AnalyticsA5_6Slide = createAnalyticsSlideComponent("a-5-6");
export const AnalyticsA5_7Slide = createAnalyticsSlideComponent("a-5-7");
export const AnalyticsA5_8Slide = createAnalyticsSlideComponent("a-5-8");

export const AnalyticsA6Slide = createAnalyticsSlideComponent("a-6");
export const AnalyticsA6_1Slide = createAnalyticsSlideComponent("a-6-1");
export const AnalyticsA6_2Slide = createAnalyticsSlideComponent("a-6-2");
export const AnalyticsA6_3Slide = createAnalyticsSlideComponent("a-6-3");
export const AnalyticsA6_4Slide = createAnalyticsSlideComponent("a-6-4");
export const AnalyticsA6_5Slide = createAnalyticsSlideComponent("a-6-5");
export const AnalyticsA6_6Slide = createAnalyticsSlideComponent("a-6-6");
export const AnalyticsA6_7Slide = createAnalyticsSlideComponent("a-6-7");
export const AnalyticsA6_8Slide = createAnalyticsSlideComponent("a-6-8");
export const AnalyticsA6_9Slide = createAnalyticsSlideComponent("a-6-9");
export const AnalyticsA6_10Slide = createAnalyticsSlideComponent("a-6-10");
