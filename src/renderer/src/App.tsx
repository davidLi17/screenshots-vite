import { useRef, useState } from 'react'
import { useEventListener } from 'ahooks'

import type { ScreenshotAction } from '../../shared/selection'
import { getSelectionControlsState } from '../../shared/selection'

import { useSelection } from './hooks/useSelection'
import { useCanvasRender } from './hooks/useCanvasRender'
import { SelectionControls } from './components/SelectionControls'
import { getControlsPosition } from './utils/position'

function App(): React.JSX.Element {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)

  // 1. 视口状态管理 (使用 ahooks 简化)
  const [viewport, setViewport] = useState(() => ({
    width: window.innerWidth,
    height: window.innerHeight
  }))

  useEventListener('resize', () => {
    setViewport({ width: window.innerWidth, height: window.innerHeight })
  })

  useEventListener('keydown', (event: KeyboardEvent) => {
    if (event.key === 'Escape') window.api.cancelSelection()
  })

  // 2. 截取逻辑 (鼠标拖拽计算)
  const { isDrawing, selection, dragPoint, handleMouseDown, handleMouseMove, handleMouseUp } =
    useSelection()

  // 3. 画布渲染副作用
  useCanvasRender(canvasRef, viewport, selection)

  // 4. UI 派生状态
  const controlsVisible = getSelectionControlsState({ isDrawing, selection })
  const controlsPosition = getControlsPosition(selection, viewport)

  const handleSubmit = (action: ScreenshotAction): void => {
    if (!selection) return
    window.api.submitSelection({ action, bounds: selection })
  }

  return (
    <div
      className="selection-shell"
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
    >
      <canvas ref={canvasRef} className="selection-canvas" />

      {controlsVisible && selection && (
        <SelectionControls
          position={controlsPosition}
          onSubmit={handleSubmit}
          onCancel={() => window.api.cancelSelection()}
        />
      )}

      {dragPoint ? (
        <div className="selection-hint">
          {selection ? `${selection.width} × ${selection.height}` : '拖拽以选择截图区域'}
        </div>
      ) : (
        <div className="selection-hint">拖拽以选择截图区域，按 Esc 取消</div>
      )}
    </div>
  )
}

export default App
