'use client';

import { ReactNode, useCallback, useMemo, useRef, useState } from 'react';
import {
  DndContext,
  DragOverlay,
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
import { SortableContext, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import cn from 'classnames';
import styles from './Menu.module.css';

const AUTO_SCROLL_EDGE_PX = 36;
const MIN_SCROLL_STEP_PX = 2;
const MAX_SCROLL_STEP_PX = 14;

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

function getAutoScrollStep(distanceToEdge: number) {
  const intensity = clamp((AUTO_SCROLL_EDGE_PX - distanceToEdge) / AUTO_SCROLL_EDGE_PX, 0, 1);
  return Math.round(MIN_SCROLL_STEP_PX + intensity * (MAX_SCROLL_STEP_PX - MIN_SCROLL_STEP_PX));
}

export interface MenuItem {
  key: string;
  label: ReactNode;
  icon?: ReactNode;
  children?: MenuItem[];
  disabled?: boolean;
  type?: 'group';
}

export type MenuReorderEvent = {
  activeKey: string;
  overKey: string;
  containerId: string;
};

type CanDragItemContext = {
  level: number;
  containerId: string;
};

interface MenuProps {
  mode?: 'inline';
  items?: MenuItem[];
  selectedKeys?: string[];
  onClick?: (item: { key: string }) => void;
  openKeys?: string[];
  defaultOpenKeys?: string[];
  onOpenChange?: (keys: string[]) => void;
  className?: string;
  sortable?: boolean;
  onReorder?: (event: MenuReorderEvent) => void;
  canDragItem?: (item: MenuItem, context: CanDragItemContext) => boolean;
}

type MenuNodeProps = {
  item: MenuItem;
  level: number;
  containerId: string;
  selectedKey?: string;
  openKeySet: ReadonlySet<string>;
  onItemClick?: (item: { key: string }) => void;
  toggleOpen: (key: string) => void;
  sortable: boolean;
  isDragInProgress: boolean;
  activeDragId: string | null;
  canDragItem?: (item: MenuItem, context: CanDragItemContext) => boolean;
};

type MenuLevelProps = {
  items: MenuItem[];
  level: number;
  containerId: string;
  selectedKey?: string;
  openKeySet: ReadonlySet<string>;
  onItemClick?: (item: { key: string }) => void;
  toggleOpen: (key: string) => void;
  sortable: boolean;
  isDragInProgress: boolean;
  activeDragId: string | null;
  canDragItem?: (item: MenuItem, context: CanDragItemContext) => boolean;
};

type DragSnapshot = {
  width: number;
  height: number;
};

function MenuNode({
  item,
  level,
  containerId,
  selectedKey,
  openKeySet,
  onItemClick,
  toggleOpen,
  sortable,
  isDragInProgress,
  activeDragId,
  canDragItem,
}: MenuNodeProps) {
  const isSelected = selectedKey === item.key;
  const hasChildren = Boolean(item.children?.length);
  const isGroup = item.type === 'group';
  const isOpen = openKeySet.has(item.key);
  const isActiveDragItem = activeDragId === item.key;
  const shouldShowChildren = hasChildren && isOpen && !isActiveDragItem;
  const isGroupSelected = Boolean(item.children?.some((child) => child.key === selectedKey));
  const dragEnabled =
    sortable && !item.disabled && (canDragItem ? canDragItem(item, { level, containerId }) : true);

  const { setNodeRef, attributes, listeners, transform, transition, isDragging } = useSortable({
    id: item.key,
    data: {
      containerId,
    },
    disabled: !dragEnabled,
  });

  const dragStyle = dragEnabled
    ? {
        transform: CSS.Transform.toString(transform),
        transition,
        willChange: isDragging ? 'transform' : undefined,
      }
    : undefined;

  const handleClick = () => {
    if (isDragInProgress) {
      return;
    }
    if (item.disabled) return;
    if (hasChildren) {
      toggleOpen(item.key);
      return;
    }
    onItemClick?.({ key: item.key });
  };

  const dragProps = dragEnabled ? { ...attributes, ...listeners } : {};

  if (isGroup) {
    return (
      <div
        ref={setNodeRef}
        style={dragStyle}
        key={item.key}
        className={cn(styles.menuGroup, {
          [styles.dragging]: isDragging,
          [styles.sortableItem]: dragEnabled,
        })}
      >
        <div
          className={cn(styles.groupLabel, {
            [styles.groupLabelSelected]: isGroupSelected,
          })}
        >
          {dragEnabled ? (
            <button
              type="button"
              className={styles.dragHandle}
              aria-label="Перетащить элемент"
              onClick={(event) => event.stopPropagation()}
              {...dragProps}
            >
              <span className={styles.dragHandleIcon}>⋮⋮</span>
            </button>
          ) : null}
          {item.icon && <span className={styles.icon}>{item.icon}</span>}
          <span>{item.label}</span>
        </div>
        <div className={styles.groupChildren}>
          {item.children?.length && !isActiveDragItem ? (
            <MenuLevel
              items={item.children}
              level={level + 1}
              containerId={item.key}
              selectedKey={selectedKey}
              openKeySet={openKeySet}
              onItemClick={onItemClick}
              toggleOpen={toggleOpen}
              sortable={sortable}
              isDragInProgress={isDragInProgress}
              activeDragId={activeDragId}
              canDragItem={canDragItem}
            />
          ) : null}
        </div>
      </div>
    );
  }

  return (
    <div
      ref={setNodeRef}
      style={dragStyle}
      key={item.key}
      className={cn(styles.menuItemWrapper, {
        [styles.dragging]: isDragging,
      })}
    >
      <div
        className={cn(styles.menuItem, {
          [styles.selected]: isSelected,
          [styles.group]: hasChildren,
          [styles.groupSelected]: hasChildren && isGroupSelected,
          [styles.disabled]: item.disabled,
          [styles.sortableItem]: dragEnabled,
        })}
        onClick={handleClick}
        style={{ paddingLeft: `${16 + level * 16}px` }}
      >
        {dragEnabled ? (
          <button
            type="button"
            className={styles.dragHandle}
            aria-label="Перетащить элемент"
            onClick={(event) => event.stopPropagation()}
            {...dragProps}
          >
            <span className={styles.dragHandleIcon}>⋮⋮</span>
          </button>
        ) : null}
        {item.icon && <span className={styles.icon}>{item.icon}</span>}
        <span className={styles.label}>{item.label}</span>
        {hasChildren && (
          <span className={cn(styles.arrow, { [styles.arrowOpen]: shouldShowChildren })}>▶</span>
        )}
      </div>
      {hasChildren && (
        <div className={cn(styles.subMenu, { [styles.subMenuOpen]: shouldShowChildren })}>
          <MenuLevel
            items={item.children ?? []}
            level={level + 1}
            containerId={item.key}
            selectedKey={selectedKey}
            openKeySet={openKeySet}
            onItemClick={onItemClick}
            toggleOpen={toggleOpen}
            sortable={sortable}
            isDragInProgress={isDragInProgress}
            activeDragId={activeDragId}
            canDragItem={canDragItem}
          />
        </div>
      )}
    </div>
  );
}

function MenuLevel({
  items,
  level,
  containerId,
  selectedKey,
  openKeySet,
  onItemClick,
  toggleOpen,
  sortable,
  isDragInProgress,
  activeDragId,
  canDragItem,
}: MenuLevelProps) {
  if (!items.length) {
    return null;
  }

  const nodes = items.map((item) => (
    <MenuNode
      key={item.key}
      item={item}
      level={level}
      containerId={containerId}
      selectedKey={selectedKey}
      openKeySet={openKeySet}
      onItemClick={onItemClick}
      toggleOpen={toggleOpen}
      sortable={sortable}
      isDragInProgress={isDragInProgress}
      activeDragId={activeDragId}
      canDragItem={canDragItem}
    />
  ));

  return (
    <SortableContext
      id={containerId}
      items={items.map((item) => item.key)}
      strategy={verticalListSortingStrategy}
    >
      {nodes}
    </SortableContext>
  );
}

export const Menu: React.FC<MenuProps> = ({
  mode = 'inline',
  items = [],
  selectedKeys,
  onClick,
  openKeys: controlledOpenKeys,
  defaultOpenKeys = [],
  onOpenChange,
  className,
  sortable = false,
  onReorder,
  canDragItem,
}) => {
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

  if (mode !== 'inline') {
    throw new Error('Menu поддерживает только mode="inline"');
  }

  const toggleOpen = (key: string) => {
    const isOpen = openKeySet.has(key);
    const nextKeys = isOpen
      ? effectiveOpenKeys.filter((openKey) => openKey !== key)
      : [...effectiveOpenKeys, key];

    if (controlledOpenKeys === undefined) {
      setUncontrolledOpenKeys(nextKeys);
    }
    onOpenChange?.(nextKeys);
  };

  const handleDragEnd = (event: DragEndEvent) => {
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
  };

  const handleDragStart = (event: DragStartEvent) => {
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
  };

  const handleDragCancel = (_event: DragCancelEvent) => {
    setActiveDragId(null);
    setDragSnapshot(null);
  };

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
    const pointerEvent = event.activatorEvent;
    const pointerX =
      pointerEvent instanceof PointerEvent
        ? pointerEvent.clientX
        : translatedRect.left + translatedRect.width / 2;
    const pointerY =
      pointerEvent instanceof PointerEvent
        ? pointerEvent.clientY
        : translatedRect.top + translatedRect.height / 2;

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

    const activeContainerId = event.active.data.current?.containerId;
    const isNestedContainer = Boolean(activeContainerId && activeContainerId !== '__root__');
    const topDistance = pointerY - menuRect.top;
    const bottomDistance = menuRect.bottom - pointerY;
    let scrollDelta = 0;

    if (!isNestedContainer && topDistance < AUTO_SCROLL_EDGE_PX && menuElement.scrollTop > 0) {
      scrollDelta = -getAutoScrollStep(topDistance);
    } else if (bottomDistance < AUTO_SCROLL_EDGE_PX && menuElement.scrollTop < maxScrollTop) {
      scrollDelta = getAutoScrollStep(bottomDistance);
    }

    if (!scrollDelta) {
      return;
    }

    menuElement.scrollTop = clamp(menuElement.scrollTop + scrollDelta, 0, maxScrollTop);
  }, []);

  const collisionDetection: CollisionDetection = (args) => {
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
  };

  const activeDragEntry = activeDragId ? menuItemMap.get(activeDragId) : undefined;
  const overlayStyle =
    dragSnapshot && dragSnapshot.width > 0 && dragSnapshot.height > 0
      ? { width: dragSnapshot.width, minHeight: dragSnapshot.height }
      : undefined;

  return (
    <DndContext
      sensors={sensors}
      autoScroll={false}
      collisionDetection={collisionDetection}
      onDragStart={handleDragStart}
      onDragMove={handleDragMove}
      onDragEnd={handleDragEnd}
      onDragCancel={handleDragCancel}
    >
      <nav
        ref={menuRef}
        className={cn(styles.menu, { [styles.menuDragging]: Boolean(activeDragId) }, className)}
      >
        <MenuLevel
          items={items}
          level={0}
          containerId="__root__"
          selectedKey={selectedKey}
          openKeySet={openKeySet}
          onItemClick={onClick}
          toggleOpen={toggleOpen}
          sortable={sortable}
          isDragInProgress={Boolean(activeDragId)}
          activeDragId={activeDragId}
          canDragItem={canDragItem}
        />
      </nav>
      <DragOverlay>
        {activeDragEntry ? (
          <div className={styles.dragOverlayItem} style={overlayStyle}>
            <div
              className={cn(styles.menuItem, styles.dragOverlayRow, {
                [styles.group]: Boolean(activeDragEntry.item.children?.length),
              })}
              style={{ paddingLeft: `${16 + activeDragEntry.level * 16}px` }}
            >
              <span className={styles.dragHandleIcon}>⋮⋮</span>
              {activeDragEntry.item.icon && (
                <span className={styles.icon}>{activeDragEntry.item.icon}</span>
              )}
              <span className={styles.label}>{activeDragEntry.item.label}</span>
              {activeDragEntry.item.children?.length ? (
                <span className={styles.arrow}>▶</span>
              ) : null}
            </div>
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
};
