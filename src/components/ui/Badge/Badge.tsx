import type { CSSProperties } from 'react';
import styles from './Badge.module.css';

type BadgeProps = {
  mode: 'dot' | 'count';
  count?: number;
  color?: string;
};

export function Badge({ mode, count = 0, color = '#faad14' }: BadgeProps) {
  const cssVars = { '--badge-color': color } as CSSProperties;

  if (mode === 'dot') {
    return <span className={`${styles.badge} ${styles.dot}`} style={cssVars} />;
  }

  return (
    <span className={`${styles.badge} ${styles.count}`} style={cssVars}>
      {count}
    </span>
  );
}
