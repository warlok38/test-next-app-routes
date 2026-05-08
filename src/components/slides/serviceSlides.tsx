type ServiceSlideTemplateProps = {
  slideId: string;
  serviceName: string;
};

function ServiceSlideTemplate({ slideId, serviceName }: ServiceSlideTemplateProps) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-4">
      <h3 className="text-base font-semibold text-slate-900">
        {serviceName} Slide {slideId}
      </h3>
      <p className="mt-2 text-sm text-slate-600">
        Client component for slide {slideId}. Replace with real content when needed.
      </p>
    </div>
  );
}

const createServiceSlideComponent = (serviceName: string, slideId: string) => {
  return function ServiceSlideComponent() {
    return <ServiceSlideTemplate serviceName={serviceName} slideId={slideId} />;
  };
};

export const BillingB1Slide = createServiceSlideComponent("Billing", "b-1");
export const BillingB2Slide = createServiceSlideComponent("Billing", "b-2");

export const SupportS1Slide = createServiceSlideComponent("Support", "s-1");
export const SupportS2Slide = createServiceSlideComponent("Support", "s-2");
