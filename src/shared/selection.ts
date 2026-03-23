import { ALT, CTRL, OPTION } from './types'

/**
 * 截图区域的边界数据，基于逻辑像素
 */
export interface SelectionBounds {
  /** 选区左上角的 X 坐标 (逻辑像素) */
  x: number
  /** 选区左上角的 Y 坐标 (逻辑像素) */
  y: number
  /** 选区的宽度 (逻辑像素) */
  width: number
  /** 选区的高度 (逻辑像素) */
  height: number
}

/**
 * 用户鼠标拖拽截图操作时的原始坐标输入
 */
export interface DragSelectionInput {
  /** 鼠标按下时的初始 X 坐标 */
  startX: number
  /** 鼠标按下时的初始 Y 坐标 */
  startY: number
  /** 鼠标拖拽过程中的当前 X 坐标 */
  currentX: number
  /** 鼠标拖拽过程中的当前 Y 坐标 */
  currentY: number
}

/**
 * 用户选区确认后的行为指令类型
 */
export type ScreenshotAction = 'complete' | 'download'

/**
 * 包装用户指令和选区边界的数据结构
 * 用于从 Renderer 进程向 Main 进程发送最终确认的截图数据
 */
export interface SelectionSubmission {
  action: ScreenshotAction
  bounds: SelectionBounds
}

/**
 * 将用户鼠标拖拽的原始点位转换为合法的截图边界对象
 * - 自动处理反向拖拽（从右下到左上等任意方向的绘制）
 * - 如果选区宽度或高度为 0，视为无效操作
 * @param input 鼠标按下时的起始点和当前移动的点
 * @returns 标准化的 `SelectionBounds` 或 null
 */
export function normalizeSelectionBounds(input: DragSelectionInput): SelectionBounds | null {
  const x = Math.min(input.startX, input.currentX)
  const y = Math.min(input.startY, input.currentY)
  const width = Math.abs(input.currentX - input.startX)
  const height = Math.abs(input.currentY - input.startY)

  if (width === 0 || height === 0) {
    return null
  }

  return { x, y, width, height }
}

/**
 * 判断当前是否应该显示悬浮的截图控制条 (包含取消/保存/完成按钮)
 * - 只有在“当前未在拖拽画框”且“已有合法选区”双重前提下，才显示控件
 */
export function getSelectionControlsState(input: {
  isDrawing: boolean
  selection: SelectionBounds | null
}): boolean {
  return !input.isDrawing && input.selection !== null
}

/**
 * 获取适用于当前操作系统的全局快捷键
 * - macOS: Ctrl+Option+D
 * - Windows/Linux: Ctrl+Alt+D
 */
export function getCaptureShortcut(platform: NodeJS.Platform): string {
  return platform === 'darwin' ? `${CTRL}+${OPTION}+D` : `${CTRL}+${ALT}+D`
}

/**
 * 类型守卫: 校验传入的值是否为合法的 ScreenshotAction ('complete' 或 'download')
 */
export function isScreenshotAction(value: unknown): value is ScreenshotAction {
  return value === 'complete' || value === 'download'
}

/**
 * 根据屏幕缩放比例 (Device Pixel Ratio，如 Retina 屏中为 2) 重新计算缩放后的实际物理像素选区
 * - 截图引擎(Native Image / Desktop Capturer) 裁剪图像时需要的是物理像素
 * @param bounds 逻辑像素的截屏边界
 * @param scaleFactor 屏幕的缩放系数
 */
export function toScaledBounds(bounds: SelectionBounds, scaleFactor: number): SelectionBounds {
  return {
    x: Math.round(bounds.x * scaleFactor),
    y: Math.round(bounds.y * scaleFactor),
    width: Math.round(bounds.width * scaleFactor),
    height: Math.round(bounds.height * scaleFactor)
  }
}

/**
 * 安全解析 IPC 消息：验证 Renderer 进程提交上的数据是否符合要求
 * 拦截非法或恶意构造的 payload，这是 Electron 开发的主进程安全实践
 * @param value 主进程接收到的任意 IPC 消息
 * @returns 经过校验和类型断言后的标准数据
 */
export function parseSelectionSubmission(value: unknown): SelectionSubmission | null {
  if (typeof value !== 'object' || value === null) {
    return null
  }

  const candidate = value as Partial<SelectionSubmission>

  if (!isScreenshotAction(candidate.action)) {
    return null
  }

  if (!isSelectionBounds(candidate.bounds)) {
    return null
  }

  return {
    action: candidate.action,
    bounds: candidate.bounds
  }
}

/**
 * 类型守卫: 严格校验未知数据是否是一个合法的 SelectionBounds 对象。
 * 用于防范 IPC 通信中可能传入的畸形数据。
 * @param value 需要校验的任意数据
 * @returns 如果数据结构完全符合截屏边界要求，返回 true
 */
function isSelectionBounds(value: unknown): value is SelectionBounds {
  if (typeof value !== 'object' || value === null) {
    return false
  }

  const candidate = value as Partial<SelectionBounds>

  return (
    isPositiveNumber(candidate.x, false) &&
    isPositiveNumber(candidate.y, false) &&
    isPositiveNumber(candidate.width, true) &&
    isPositiveNumber(candidate.height, true)
  )
}

/**
 * 类型守卫: 校验任意值是否为有效的正数（排除了 NaN 和 Infinity）
 * @param value 需要校验的任意数据
 * @param strict 是否严格大于 0（即不允许为 0）。
 *        - `true`: 适用于 `width` 和 `height` (宽高不能为 0 且必须是正数)
 *        - `false`: 适用于 `x` 和 `y` (坐标允许等于 0)
 */
function isPositiveNumber(value: unknown, strict: boolean): value is number {
  if (typeof value !== 'number' || Number.isNaN(value) || !Number.isFinite(value)) {
    return false
  }

  return strict ? value > 0 : value >= 0
}
