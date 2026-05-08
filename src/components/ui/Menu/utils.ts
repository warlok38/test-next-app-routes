import {
  AUTO_SCROLL_EDGE_PX,
  MAX_SCROLL_STEP_PX,
  MIN_SCROLL_STEP_PX,
} from './consts';

export function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

export function getAutoScrollStep(distanceToEdge: number) {
  const intensity = clamp((AUTO_SCROLL_EDGE_PX - distanceToEdge) / AUTO_SCROLL_EDGE_PX, 0, 1);
  return Math.round(MIN_SCROLL_STEP_PX + intensity * (MAX_SCROLL_STEP_PX - MIN_SCROLL_STEP_PX));
}
