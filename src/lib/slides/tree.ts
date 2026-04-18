import type { Slide } from "@/lib/api/types";

export function flattenSlides(slides: Slide[]): Slide[] {
  const result: Slide[] = [];

  const walk = (items: Slide[]) => {
    for (const item of items) {
      result.push(item);
      if (item.children?.length) {
        walk(item.children);
      }
    }
  };

  walk(slides);
  return result;
}

export function findSlideById(slides: Slide[], slideId?: string): Slide | undefined {
  if (!slideId) {
    return undefined;
  }

  return flattenSlides(slides).find((slide) => slide.id === slideId);
}
