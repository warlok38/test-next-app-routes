import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  PointerSensor,
  closestCenter,
  pointerWithin,
  useSensor,
  useSensors,
  type CollisionDetection,
  type DragCancelEvent,
  type DragEndEvent,
  type DragMoveEvent,
  type DragStartEvent,
} from '@dnd-kit/core';
import { AUTO_SCROLL_EDGE_PX } from '../consts';
import { clamp, getAutoScrollStep } from '../utils';
import type { DragSnapshot, MenuItem, MenuProps } from '../types';

type UseMenuOptions = Pick<
  MenuProps,
  'selectedKeys' | 'openKeys' | 'defaultOpenKeys' | 'onOpenChange' | 'sortable' | 'onReorder'
> & {
  items: MenuItem[];
};

export function useMenu({
  items,
  selectedKeys,
  openKeys: controlledOpenKeys,
  defaultOpenKeys = [],
  onOpenChange,
  sortable = false,
  onReorder,
}: UseMenuOptions) {
  const [uncontrolledOpenKeys, setUncontrolledOpenKeys] = useState<string[]>(defaultOpenKeys);
  const [activeDragId, setActiveDragId] = useState<string | null>(null);
  const [dragSnapshot, setDragSnapshot] = useState<DragSnapshot | null>(null);
  const menuRef = useRef<HTMLElement | null>(null);

  const effectiveOpenKeys = controlledOpenKeys ?? uncontrolledOpenKeys;
  const openKeySet = useMemo(() => new Set(effectiveOpenKeys), [effectiveOpenKeys]);
  const selectedKey = selectedKeys?.[0];
  const menuItemMap = useMemo(() => {
    const map = new Map<string, { item: MenuItem; level: number }>();
    const walk = (list: MenuItem[], level: number) => {
      list.forEach((item) => {
        map.set(item.key, { item, level });
        if (item.children?.length) {
          walk(item.children, level + 1);
        }
      });
    };
    walk(items, 0);
    return map;
  }, [items]);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 8 },
    }),
  );

  const toggleOpen = useCallback(
    (key: string) => {
      const isOpen = openKeySet.has(key);
      const nextKeys = isOpen
        ? effectiveOpenKeys.filter((openKey) => openKey !== key)
        : [...effectiveOpenKeys, key];

      if (controlledOpenKeys === undefined) {
        setUncontrolledOpenKeys(nextKeys);
      }
      onOpenChange?.(nextKeys);
    },
    [controlledOpenKeys, effectiveOpenKeys, onOpenChange, openKeySet],
  );

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      setActiveDragId(null);
      setDragSnapshot(null);
      if (!sortable || !onReorder) {
        return;
      }

      const { active, over } = event;
      if (!over || active.id === over.id) {
        return;
      }

      const activeContainerId = active.data.current?.containerId;
      const overContainerId = over.data.current?.containerId;
      if (!activeContainerId || !overContainerId || activeContainerId !== overContainerId) {
        return;
      }

      onReorder({
        activeKey: String(active.id),
        overKey: String(over.id),
        containerId: String(activeContainerId),
      });
    },
    [onReorder, sortable],
  );

  const handleDragStart = useCallback((event: DragStartEvent) => {
    setActiveDragId(String(event.active.id));
    const initialRect = event.active.rect.current.initial;
    if (initialRect) {
      setDragSnapshot({
        width: initialRect.width,
        height: initialRect.height,
      });
      return;
    }
    const translatedRect = event.active.rect.current.translated;
    if (translatedRect) {
      setDragSnapshot({
        width: translatedRect.width,
        height: translatedRect.height,
      });
      return;
    }
    setDragSnapshot(null);
  }, []);

  const handleDragCancel = useCallback((_event: DragCancelEvent) => {
    setActiveDragId(null);
    setDragSnapshot(null);
  }, []);

  const handleDragMove = useCallback((event: DragMoveEvent) => {
    const menuElement = menuRef.current;
    if (!menuElement) {
      return;
    }

    const translatedRect = event.active.rect.current.translated;
    if (!translatedRect) {
      return;
    }

    const menuRect = menuElement.getBoundingClientRect();
    const pointerX = translatedRect.left + translatedRect.width / 2;
    const pointerY = translatedRect.top + translatedRect.height / 2;

    if (
      pointerX < menuRect.left ||
      pointerX > menuRect.right ||
      pointerY < menuRect.top ||
      pointerY > menuRect.bottom
    ) {
      return;
    }

    const maxScrollTop = menuElement.scrollHeight - menuElement.clientHeight;
    if (maxScrollTop <= 0) {
      return;
    }

    const topDistance = pointerY - menuRect.top;
    const bottomDistance = menuRect.bottom - pointerY;
    let scrollDelta = 0;

    if (topDistance < AUTO_SCROLL_EDGE_PX && menuElement.scrollTop > 0) {
      scrollDelta = -getAutoScrollStep(topDistance);
    } else if (bottomDistance < AUTO_SCROLL_EDGE_PX && menuElement.scrollTop < maxScrollTop) {
      scrollDelta = getAutoScrollStep(bottomDistance);
    }

    if (!scrollDelta) {
      return;
    }

    menuElement.scrollTop = clamp(menuElement.scrollTop + scrollDelta, 0, maxScrollTop);
  }, []);

  useEffect(() => {
    if (!activeDragId) {
      return;
    }

    const handleWheel = (event: WheelEvent) => {
      const menuElement = menuRef.current;
      if (!menuElement || event.deltaY === 0) {
        return;
      }

      const menuRect = menuElement.getBoundingClientRect();
      const isInsideMenu =
        event.clientX >= menuRect.left &&
        event.clientX <= menuRect.right &&
        event.clientY >= menuRect.top &&
        event.clientY <= menuRect.bottom;

      if (!isInsideMenu) {
        return;
      }

      const maxScrollTop = menuElement.scrollHeight - menuElement.clientHeight;
      if (maxScrollTop <= 0) {
        return;
      }

      event.preventDefault();
      menuElement.scrollTop = clamp(menuElement.scrollTop + event.deltaY, 0, maxScrollTop);
    };

    window.addEventListener('wheel', handleWheel, { passive: false });
    return () => {
      window.removeEventListener('wheel', handleWheel);
    };
  }, [activeDragId]);

  const collisionDetection: CollisionDetection = useCallback((args) => {
    const activeContainerId = args.active.data.current?.containerId;
    if (!activeContainerId) {
      return closestCenter(args);
    }

    const sameContainer = args.droppableContainers.filter((container) => {
      const containerId = container.data.current?.containerId;
      const sortableContainerId = container.data.current?.sortable?.containerId;
      return containerId === activeContainerId || sortableContainerId === activeContainerId;
    });

    if (!sameContainer.length) {
      return closestCenter(args);
    }

    const pointerCollisions = pointerWithin({
      ...args,
      droppableContainers: sameContainer,
    });

    if (pointerCollisions.length > 0) {
      return pointerCollisions;
    }

    return closestCenter({
      ...args,
      droppableContainers: sameContainer,
    });
  }, []);

  const activeDragEntry = activeDragId ? menuItemMap.get(activeDragId) : undefined;
  const overlayStyle =
    dragSnapshot && dragSnapshot.width > 0 && dragSnapshot.height > 0
      ? { width: dragSnapshot.width, minHeight: dragSnapshot.height }
      : undefined;

  return {
    menuRef,
    sensors,
    selectedKey,
    openKeySet,
    toggleOpen,
    activeDragId,
    activeDragEntry,
    overlayStyle,
    collisionDetection,
    handleDragStart,
    handleDragMove,
    handleDragEnd,
    handleDragCancel,
  };
}
