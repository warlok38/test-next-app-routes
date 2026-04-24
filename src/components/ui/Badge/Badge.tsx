import type { CSSProperties, ReactNode } from 'react';
import styles from './Badge.module.css';

type BadgeProps = {
  mode: 'dot' | 'count';
  count?: number;
  color?: string;
  size?: 'default' | 'small';
  show?: boolean;
  offset?: [number, number];
  children?: ReactNode;
};

export function Badge({
  mode,
  count = 0,
  color = '#faad14',
  size = 'default',
  show = true,
  offset = [6, -4],
  children,
}: BadgeProps) {
  const cssVars = {
    '--badge-color': color,
    '--badge-offset-x': `${offset[0]}px`,
    '--badge-offset-y': `${offset[1]}px`,
  } as CSSProperties;

  const shouldRender = show && (mode !== 'count' || count > 0);

  const marker =
    mode === 'dot' ? (
      <span
        className={`${styles.badge} ${styles.dot} ${size === 'small' ? styles.dotSmall : ''}`}
        style={{ '--badge-color': color } as CSSProperties}
      />
    ) : (
      <span
        className={`${styles.badge} ${styles.count} ${size === 'small' ? styles.countSmall : ''}`}
        style={{ '--badge-color': color } as CSSProperties}
      >
        {count}
      </span>
    );

  if (children) {
    return (
      <span className={styles.wrapper}>
        {children}
        {shouldRender ? (
          <span className={styles.marker} style={cssVars}>
            {marker}
          </span>
        ) : null}
      </span>
    );
  }

  if (!shouldRender) {
    return null;
  }

  return marker;
}
