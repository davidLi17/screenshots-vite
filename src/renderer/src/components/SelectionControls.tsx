import { MdCheck, MdClose, MdDownload } from 'react-icons/md'
import type { ScreenshotAction } from '../../../shared/selection'
import type { Point } from '../utils/position'

interface Props {
  position: Point
  onSubmit: (action: ScreenshotAction) => void
  onCancel: () => void
}

export function SelectionControls({ position, onSubmit, onCancel }: Props): React.JSX.Element {
  return (
    <div
      className="selection-controls"
      style={{ left: `${position.x}px`, top: `${position.y}px` }}
      onMouseDown={(event) => event.stopPropagation()}
      onMouseUp={(event) => event.stopPropagation()}
    >
      <button type="button" className="control-button control-button-secondary" onClick={onCancel}>
        <MdClose size={18} />
      </button>
      <button
        type="button"
        className="control-button control-button-secondary"
        onClick={() => onSubmit('download')}
      >
        <MdDownload size={18} />
        下载
      </button>
      <button
        type="button"
        className="control-button control-button-primary"
        onClick={() => onSubmit('complete')}
      >
        <MdCheck size={18} />
        完成
      </button>
    </div>
  )
}
