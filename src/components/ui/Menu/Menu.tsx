'use client';

import { ReactNode, useMemo, useState } from 'react';
import {
  DndContext,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
  type CollisionDetection,
  type DragCancelEvent,
  type DragEndEvent,
  type DragStartEvent,
} from '@dnd-kit/core';
import { SortableContext, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import cn from 'classnames';
import styles from './Menu.module.css';

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
  canDragItem?: (item: MenuItem, context: CanDragItemContext) => boolean;
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
  canDragItem,
}: MenuNodeProps) {
  const isSelected = selectedKey === item.key;
  const hasChildren = Boolean(item.children?.length);
  const isGroup = item.type === 'group';
  const isOpen = openKeySet.has(item.key);
  const isGroupSelected = Boolean(item.children?.some((child) => child.key === selectedKey));
  const dragEnabled =
    sortable &&
    !item.disabled &&
    (canDragItem ? canDragItem(item, { level, containerId }) : true);

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
          {item.children?.length ? (
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
          <span className={cn(styles.arrow, { [styles.arrowOpen]: isOpen })}>▶</span>
        )}
      </div>
      {hasChildren && (
        <div className={cn(styles.subMenu, { [styles.subMenuOpen]: isOpen })}>
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
  const effectiveOpenKeys = controlledOpenKeys ?? uncontrolledOpenKeys;
  const openKeySet = useMemo(() => new Set(effectiveOpenKeys), [effectiveOpenKeys]);
  const selectedKey = selectedKeys?.[0];
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
  };

  const handleDragCancel = (_event: DragCancelEvent) => {
    setActiveDragId(null);
  };

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

    return closestCenter({
      ...args,
      droppableContainers: sameContainer,
    });
  };

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={collisionDetection}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onDragCancel={handleDragCancel}
    >
      <nav className={cn(styles.menu, className)}>
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
          canDragItem={canDragItem}
        />
      </nav>
    </DndContext>
  );
};
