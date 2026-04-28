'use client';

import { useEffect, useMemo } from 'react';
import type { ReactNode } from 'react';
import { PlusOutlined } from '@ant-design/icons';
import { Button, Spin, Tooltip, Typography } from 'antd';
import type { Slide } from '@/lib/api/types';
import { Badge } from '@/components/ui/Badge';
import { Menu, type MenuItem, type MenuReorderEvent } from '@/components/ui/Menu';
import { useServiceContext } from '@/lib/state/slideDraftsContext';

type SlidesMenuProps = {
  slides: Slide[];
  orderDrafts?: Record<string, number>;
  /** Смена сервиса сбрасывает раскрытие под другое дерево слайдов */
  activeServiceId?: string;
  activeSlideId?: string;
  changedSlideIds?: string[];
  loading?: boolean;
  onReorderLevel?: (updates: Array<{ id: string; order: number }>) => void;
  onSelect: (slideId: string) => void;
  onCreate?: () => void;
};

const INDICATOR_COLOR = '#faad14';

export function SlidesMenu({
  slides,
  orderDrafts = {},
  activeServiceId,
  activeSlideId,
  changedSlideIds = [],
  loading,
  onReorderLevel,
  onSelect,
  onCreate,
}: SlidesMenuProps) {
  const { slidesMenuOpenKeys, setSlidesMenuOpenKeys, lastServiceIdForSlidesMenuRef } =
    useServiceContext();
  const changedSet = useMemo(() => new Set(changedSlideIds), [changedSlideIds]);
  const effectiveSlides = useMemo(() => applyOrderDrafts(slides, orderDrafts), [slides, orderDrafts]);

  const menuItems = useMemo(
    () => mapToMenuItems(effectiveSlides, changedSet),
    [effectiveSlides, changedSet],
  );

  const parentKeys = useMemo(
    () => findParentKeys(effectiveSlides, activeSlideId),
    [effectiveSlides, activeSlideId],
  );

  const handleReorder = (event: MenuReorderEvent) => {
    const levelItems = getLevelItems(effectiveSlides, event.containerId);
    if (!levelItems.length) {
      return;
    }

    const activeIndex = levelItems.findIndex((item) => item.id === event.activeKey);
    const overIndex = levelItems.findIndex((item) => item.id === event.overKey);
    if (activeIndex === -1 || overIndex === -1 || activeIndex === overIndex) {
      return;
    }

    const reordered = move(levelItems, activeIndex, overIndex);
    onReorderLevel?.(
      reordered.map((slide, index) => ({
        id: slide.id,
        order: index + 1,
      })),
    );
  };

  useEffect(() => {
    if (lastServiceIdForSlidesMenuRef.current !== activeServiceId) {
      lastServiceIdForSlidesMenuRef.current = activeServiceId;
      setSlidesMenuOpenKeys(parentKeys);
      return;
    }
    setSlidesMenuOpenKeys((prev) => (sameKeyPaths(prev, parentKeys) ? prev : parentKeys));
  }, [activeServiceId, parentKeys, setSlidesMenuOpenKeys, lastServiceIdForSlidesMenuRef]);

  return (
    <Spin spinning={Boolean(loading)}>
      <div>
        <div
          style={{
            margin: 16,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 8,
          }}
        >
          <Typography.Title level={5} style={{ margin: 0, whiteSpace: 'nowrap' }}>
            Слайды
          </Typography.Title>
          <span style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
            <Tooltip title="Создать группу или слайд">
              <Button type="primary" size="small" icon={<PlusOutlined />} onClick={onCreate} disabled={!activeServiceId}>
                Добавить
              </Button>
            </Tooltip>
          </span>
        </div>
        <Menu
          mode="inline"
          selectedKeys={activeSlideId ? [activeSlideId] : []}
          openKeys={slidesMenuOpenKeys}
          onOpenChange={(keys) => setSlidesMenuOpenKeys(keys as string[])}
          items={menuItems}
          sortable
          onReorder={handleReorder}
          onClick={(item) => onSelect(item.key)}
        />
      </div>
    </Spin>
  );
}

function sameKeyPaths(a: string[], b: string[]): boolean {
  if (a.length !== b.length) {
    return false;
  }
  return a.every((key, i) => key === b[i]);
}

function mapToMenuItems(
  items: Slide[],
  changedSet: ReadonlySet<string>,
): MenuItem[] {
  return items.map((slide) => {
    const changedCount = countChangedInTree(slide, changedSet);
    const hasChildren = Boolean(slide.children?.length);
    const hasSelfChanges = changedSet.has(slide.id);

    let indicator: ReactNode = null;
    if (hasChildren && changedCount > 0) {
      indicator = <Badge mode="count" count={changedCount} color={INDICATOR_COLOR} />;
    } else if (!hasChildren && hasSelfChanges) {
      indicator = <Badge mode="dot" color={INDICATOR_COLOR} />;
    }

    return {
      key: slide.id,
      label: (
        <span
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 8,
          }}
        >
          <span>{slide.name}</span>
          {indicator}
        </span>
      ),
      children: slide.children?.length ? mapToMenuItems(slide.children, changedSet) : undefined,
    };
  });
}

function findParentKeys(slides: Slide[], targetId?: string): string[] {
  if (!targetId) {
    return [];
  }

  const dfs = (items: Slide[], parents: string[]): string[] | null => {
    for (const item of items) {
      if (item.id === targetId) {
        return parents;
      }
      if (item.children?.length) {
        const result = dfs(item.children, [...parents, item.id]);
        if (result) {
          return result;
        }
      }
    }
    return null;
  };

  return dfs(slides, []) ?? [];
}

function countChangedInTree(slide: Slide, changedSet: ReadonlySet<string>): number {
  const self = changedSet.has(slide.id) ? 1 : 0;
  const children =
    slide.children?.reduce((acc, child) => acc + countChangedInTree(child, changedSet), 0) ?? 0;

  return self + children;
}

function applyOrderDrafts(items: Slide[], orderDrafts: Record<string, number>): Slide[] {
  return [...items]
    .map((item) => ({
      ...item,
      order: typeof orderDrafts[item.id] === 'number' ? orderDrafts[item.id] : item.order,
      children: item.children?.length ? applyOrderDrafts(item.children, orderDrafts) : undefined,
    }))
    .sort(compareByOrder);
}

function compareByOrder(left: Slide, right: Slide): number {
  if (left.order === right.order) {
    return left.name.localeCompare(right.name, 'ru');
  }
  return left.order - right.order;
}

function move<T>(items: T[], from: number, to: number): T[] {
  const next = [...items];
  const [item] = next.splice(from, 1);
  next.splice(to, 0, item);
  return next;
}

function getLevelItems(items: Slide[], containerId: string): Slide[] {
  if (containerId === '__root__') {
    return [...items].sort(compareByOrder);
  }

  const parent = findSlideById(items, containerId);
  return [...(parent?.children ?? [])].sort(compareByOrder);
}

function findSlideById(items: Slide[], targetId: string): Slide | undefined {
  for (const item of items) {
    if (item.id === targetId) {
      return item;
    }
    if (item.children?.length) {
      const nested = findSlideById(item.children, targetId);
      if (nested) {
        return nested;
      }
    }
  }
  return undefined;
}
