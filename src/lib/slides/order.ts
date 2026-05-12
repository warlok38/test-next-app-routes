import type { Slide } from '@/lib/api/types';

type SlideWithOrder = Pick<Slide, 'id' | 'name' | 'order'>;

export function compareByOrder(left: SlideWithOrder, right: SlideWithOrder): number {
  if (left.order === right.order) {
    return left.name.localeCompare(right.name, 'ru');
  }
  return left.order - right.order;
}

export function findLevelBySlideId(items: Slide[], slideId: string): Slide[] | null {
  if (items.some((item) => item.id === slideId)) {
    return items;
  }

  for (const item of items) {
    if (!item.children?.length) {
      continue;
    }

    const nestedLevel = findLevelBySlideId(item.children, slideId);
    if (nestedLevel) {
      return nestedLevel;
    }
  }

  return null;
}

export function collectConnectedOrderComponent(params: {
  selectedId: string;
  baseLevel: SlideWithOrder[];
  effectiveLevel: SlideWithOrder[];
}): Set<string> {
  const { selectedId, baseLevel, effectiveLevel } = params;
  const baseIdToOrder = new Map<string, number>();
  const effectiveIdToOrder = new Map<string, number>();
  const baseOrderToIds = new Map<number, Set<string>>();
  const effectiveOrderToIds = new Map<number, Set<string>>();

  baseLevel.forEach((slide) => {
    baseIdToOrder.set(slide.id, slide.order);
    addOrderLink(baseOrderToIds, slide.order, slide.id);
  });
  effectiveLevel.forEach((slide) => {
    effectiveIdToOrder.set(slide.id, slide.order);
    addOrderLink(effectiveOrderToIds, slide.order, slide.id);
  });

  const component = new Set<string>();
  const queue: string[] = [selectedId];
  component.add(selectedId);

  while (queue.length > 0) {
    const currentId = queue.shift();
    if (!currentId) {
      continue;
    }

    const baseOrder = baseIdToOrder.get(currentId);
    const effectiveOrder = effectiveIdToOrder.get(currentId);

    if (typeof baseOrder === 'number') {
      const idsAtBaseOrderInEffective = effectiveOrderToIds.get(baseOrder);
      idsAtBaseOrderInEffective?.forEach((id) => {
        if (!component.has(id)) {
          component.add(id);
          queue.push(id);
        }
      });
    }

    if (typeof effectiveOrder === 'number') {
      const idsAtEffectiveOrderInBase = baseOrderToIds.get(effectiveOrder);
      idsAtEffectiveOrderInBase?.forEach((id) => {
        if (!component.has(id)) {
          component.add(id);
          queue.push(id);
        }
      });
    }
  }

  return component;
}

function addOrderLink(index: Map<number, Set<string>>, order: number, id: string): void {
  const set = index.get(order);
  if (set) {
    set.add(id);
    return;
  }
  index.set(order, new Set([id]));
}
