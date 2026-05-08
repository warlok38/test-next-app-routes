import type { ReactNode } from 'react';

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

export type CanDragItemContext = {
  level: number;
  containerId: string;
};

export type MenuItemClickHandler = (item: { key: string }) => void;

export type CanDragItemHandler = (item: MenuItem, context: CanDragItemContext) => boolean;

export interface MenuProps {
  mode?: 'inline';
  items?: MenuItem[];
  selectedKeys?: string[];
  onClick?: MenuItemClickHandler;
  openKeys?: string[];
  defaultOpenKeys?: string[];
  onOpenChange?: (keys: string[]) => void;
  className?: string;
  sortable?: boolean;
  onReorder?: (event: MenuReorderEvent) => void;
  canDragItem?: CanDragItemHandler;
}

type MenuTreeCommonProps = {
  level: number;
  containerId: string;
  selectedKey?: string;
  openKeySet: ReadonlySet<string>;
  onItemClick?: MenuItemClickHandler;
  toggleOpen: (key: string) => void;
  sortable: boolean;
  isDragInProgress: boolean;
  activeDragId: string | null;
  canDragItem?: CanDragItemHandler;
};

export type MenuNodeProps = MenuTreeCommonProps & {
  item: MenuItem;
};

export type MenuLevelProps = MenuTreeCommonProps & {
  items: MenuItem[];
};

export type DragSnapshot = {
  width: number;
  height: number;
};
