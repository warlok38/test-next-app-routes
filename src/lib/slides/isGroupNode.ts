import type { Slide } from '@/lib/api/types';

export function isGroupNode(slide: Slide): boolean {
  return Boolean(slide.isGroup || slide.children?.length);
}
