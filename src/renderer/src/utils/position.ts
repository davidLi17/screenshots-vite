import { clamp } from 'lodash-es'
import type { SelectionBounds } from '../../../shared/selection'

export interface Point {
  x: number
  y: number
}

export function getControlsPosition(
  selection: SelectionBounds | null,
  viewport: { width: number; height: number }
): Point {
  if (!selection) {
    return { x: 16, y: 16 }
  }

  const controlsWidth = 284
  const controlsHeight = 52
  const gap = 12

  const desiredX = selection.x + selection.width - controlsWidth
  const desiredY = selection.y + selection.height + gap

  return {
    x: clamp(desiredX, gap, viewport.width - controlsWidth - gap),
    y: clamp(desiredY, gap, viewport.height - controlsHeight - gap)
  }
}
