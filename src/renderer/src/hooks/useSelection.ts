import React, { useState } from 'react'
import type { SelectionBounds } from '../../../shared/selection'
import { normalizeSelectionBounds } from '../../../shared/selection'
import type { Point } from '../utils/position'

export function useSelection(): {
  isDrawing: boolean
  dragPoint: Point | null
  selection: SelectionBounds | null
  handleMouseDown: (event: React.MouseEvent<HTMLDivElement>) => void
  handleMouseMove: (event: React.MouseEvent<HTMLDivElement>) => void
  handleMouseUp: (event: React.MouseEvent<HTMLDivElement>) => void
} {
  const [isDrawing, setIsDrawing] = useState(false)
  const [dragStart, setDragStart] = useState<Point | null>(null)
  const [dragPoint, setDragPoint] = useState<Point | null>(null)
  const [selection, setSelection] = useState<SelectionBounds | null>(null)

  const updateSelection = (point: Point, start = dragStart): void => {
    if (!start) {
      return
    }

    const nextSelection = normalizeSelectionBounds({
      startX: start.x,
      startY: start.y,
      currentX: point.x,
      currentY: point.y
    })

    setSelection(nextSelection)
  }

  const handleMouseDown = (event: React.MouseEvent<HTMLDivElement>): void => {
    const start = { x: event.clientX, y: event.clientY }
    setIsDrawing(true)
    setDragStart(start)
    setDragPoint(start)
    setSelection(null)
  }

  const handleMouseMove = (event: React.MouseEvent<HTMLDivElement>): void => {
    if (!isDrawing) {
      return
    }

    const point = { x: event.clientX, y: event.clientY }
    setDragPoint(point)
    updateSelection(point)
  }

  const handleMouseUp = (event: React.MouseEvent<HTMLDivElement>): void => {
    if (!isDrawing) {
      return
    }

    const point = { x: event.clientX, y: event.clientY }
    setIsDrawing(false)
    setDragPoint(point)
    updateSelection(point)
  }

  return {
    isDrawing,
    dragPoint,
    selection,
    handleMouseDown,
    handleMouseMove,
    handleMouseUp
  }
}
