'use client';

import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import cn from 'classnames';
import { MenuLevel } from '../MenuLevel';
import styles from '../Menu.module.css';
import type { MenuNodeProps } from '../types';

export function MenuNode({
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
