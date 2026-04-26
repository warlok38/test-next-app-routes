type PlaceholderSlideProps = {
  slideId?: string;
};

export function PlaceholderSlide({ slideId }: PlaceholderSlideProps) {
  return (
    <div className="rounded-lg border border-dashed border-amber-300 bg-amber-50 p-4">
      <h3 className="text-base font-semibold text-amber-900">Slide not implemented</h3>
      <p className="mt-2 text-sm text-amber-800">
        {slideId
          ? `No component was found for slide "${slideId}".`
          : "No component was found for this slide."}
      </p>
    </div>
  );
}
