import type { CommonSlide, ResolvedSlide, ServiceSlideOverride, Slide } from '@/lib/api/types';

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

export function flattenCommonSlides(slides: CommonSlide[]): CommonSlide[] {
  const result: CommonSlide[] = [];

  const walk = (items: CommonSlide[]) => {
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

export function findCommonSlideById(
  slides: CommonSlide[],
  slideId?: string,
): CommonSlide | undefined {
  if (!slideId) {
    return undefined;
  }

  return flattenCommonSlides(slides).find((slide) => slide.id === slideId);
}

type OverrideMap = Record<string, ServiceSlideOverride>;

export function resolveSlidesForService(params: {
  serviceId: string;
  commonSlides: CommonSlide[];
  overridesBySlideId: OverrideMap;
}): ResolvedSlide[] {
  const { serviceId, commonSlides, overridesBySlideId } = params;

  const walk = (items: CommonSlide[]): ResolvedSlide[] =>
    items.map((item) => {
      const override = overridesBySlideId[item.id];
      return {
        ...item,
        serviceId,
        name: override?.name ?? item.name,
        order: override?.order ?? item.order,
        isVisible: override?.isVisible ?? item.isVisible,
        children: item.children?.length ? walk(item.children) : undefined,
      };
    });

  return walk(commonSlides);
}
