/**
 * 中心化管理所有跨进程通信 (IPC) 的事件名称
 * 避免在 Main 和 Renderer 进程中因拼写错误导致通信失败
 */
export const IPC_EVENTS = {
  SUBMIT_SELECTION: 'submit-selection',
  CANCEL_SELECTION: 'cancel-selection',
  OPEN_SETTINGS: 'open-settings',
  LOG_TO_TERMINAL: 'log-to-terminal',
  GET_SHORTCUT: 'get-shortcut',
  SET_SHORTCUT: 'set-shortcut'
} as const
