'use client';

import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { MenuNode } from '../MenuNode';
import type { MenuLevelProps } from '../types';

export function MenuLevel({
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
