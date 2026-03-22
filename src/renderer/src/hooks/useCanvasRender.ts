import React, { useEffect } from 'react'
import type { SelectionBounds } from '../../../shared/selection'

export function useCanvasRender(
  canvasRef: React.RefObject<HTMLCanvasElement | null>,
  viewport: { width: number; height: number },
  selection: SelectionBounds | null
): void {
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) {
      return
    }

    const devicePixelRatio = window.devicePixelRatio || 1
    canvas.width = Math.round(viewport.width * devicePixelRatio)
    canvas.height = Math.round(viewport.height * devicePixelRatio)
    canvas.style.width = `${viewport.width}px`
    canvas.style.height = `${viewport.height}px`

    const context = canvas.getContext('2d')
    if (!context) {
      return
    }

    context.setTransform(devicePixelRatio, 0, 0, devicePixelRatio, 0, 0)
    context.clearRect(0, 0, viewport.width, viewport.height)
    context.fillStyle = 'rgba(12, 16, 23, 0.38)'
    context.fillRect(0, 0, viewport.width, viewport.height)

    if (!selection) {
      return
    }

    context.clearRect(selection.x, selection.y, selection.width, selection.height)
    context.strokeStyle = '#ffffff'
    context.lineWidth = 2
    context.strokeRect(selection.x, selection.y, selection.width, selection.height)

    context.fillStyle = 'rgba(255, 255, 255, 0.16)'
    context.fillRect(selection.x, selection.y, selection.width, selection.height)
  }, [selection, viewport, canvasRef])
}
