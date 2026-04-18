'use client';

import { ReactNode, useMemo, useState } from 'react';
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

interface MenuProps {
  mode?: 'inline';
  items?: MenuItem[];
  selectedKeys?: string[];
  onClick?: (item: { key: string }) => void;
  openKeys?: string[];
  defaultOpenKeys?: string[];
  onOpenChange?: (keys: string[]) => void;
  className?: string;
}

export const Menu: React.FC<MenuProps> = ({
  mode = 'inline',
  items,
  selectedKeys,
  onClick,
  openKeys: controlledOpenKeys,
  defaultOpenKeys = [],
  onOpenChange,
  className,
}) => {
  const [uncontrolledOpenKeys, setUncontrolledOpenKeys] = useState<string[]>(defaultOpenKeys);
  const effectiveOpenKeys = controlledOpenKeys ?? uncontrolledOpenKeys;
  const openKeySet = useMemo(() => new Set(effectiveOpenKeys), [effectiveOpenKeys]);
  const selectedKey = selectedKeys?.[0];

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

  const renderMenuItem = (item: MenuItem, level: number = 0) => {
    const isSelected = selectedKey === item.key;
    const hasChildren = item.children && item.children.length > 0;
    const isGroup = item.type === 'group';
    const isOpen = openKeySet.has(item.key);
    const isGroupSelected = item.children?.some((child) => child.key === selectedKey);

    const handleClick = () => {
      if (item.disabled) return;
      if (hasChildren) {
        toggleOpen(item.key);
      } else if (onClick) {
        onClick({ key: item.key });
      }
    };

    if (isGroup) {
      return (
        <div key={item.key} className={styles.menuGroup}>
          <div
            className={cn(styles.groupLabel, {
              [styles.groupLabelSelected]: isGroupSelected,
            })}
          >
            {item.icon && <span className={styles.icon}>{item.icon}</span>}
            <span>{item.label}</span>
          </div>
          <div className={styles.groupChildren}>
            {item.children?.map((child) => renderMenuItem(child, level + 1))}
          </div>
        </div>
      );
    }

    return (
      <div key={item.key} className={styles.menuItemWrapper}>
        <div
          className={cn(styles.menuItem, {
            [styles.selected]: isSelected,
            [styles.group]: hasChildren,
            [styles.groupSelected]: hasChildren && isGroupSelected,
            [styles.disabled]: item.disabled,
          })}
          onClick={handleClick}
          style={{ paddingLeft: `${16 + level * 16}px` }}
        >
          {item.icon && <span className={styles.icon}>{item.icon}</span>}
          <span className={styles.label}>{item.label}</span>
          {hasChildren && (
            <span className={cn(styles.arrow, { [styles.arrowOpen]: isOpen })}>▶</span>
          )}
        </div>
        {hasChildren && (
          <div className={cn(styles.subMenu, { [styles.subMenuOpen]: isOpen })}>
            {item.children?.map((child) => renderMenuItem(child, level + 1))}
          </div>
        )}
      </div>
    );
  };

  return (
    <nav className={cn(styles.menu, className)}>{items?.map((item) => renderMenuItem(item))}</nav>
  );
};
