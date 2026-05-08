'use client';

import { DndContext, DragOverlay } from '@dnd-kit/core';
import cn from 'classnames';
import { useMenu } from './hooks/useMenu';
import { MenuLevel } from './MenuLevel';
import styles from './Menu.module.css';
import type { MenuProps } from './types';

export type { MenuItem, MenuProps, MenuReorderEvent } from './types';

export const Menu: React.FC<MenuProps> = ({
  mode = 'inline',
  items = [],
  selectedKeys,
  onClick,
  openKeys,
  defaultOpenKeys = [],
  onOpenChange,
  className,
  sortable = false,
  onReorder,
  canDragItem,
}) => {
  if (mode !== 'inline') {
    throw new Error('Menu поддерживает только mode="inline"');
  }

  const {
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
  } = useMenu({
    items,
    selectedKeys,
    openKeys,
    defaultOpenKeys,
    onOpenChange,
    sortable,
    onReorder,
  });

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
