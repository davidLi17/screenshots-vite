import type { SelectionSubmission } from '../shared/selection'

export interface ScreenshotApi {
  submitSelection: (payload: SelectionSubmission) => void
  cancelSelection: () => void
  getShortcut: () => Promise<string>
  setShortcut: (shortcut: string) => Promise<boolean>
  openSettings: () => void
}

declare global {
  interface Window {
    api: ScreenshotApi
  }
}
