import type { SelectionSubmission } from '../shared/selection'

export interface ScreenshotApi {
  submitSelection: (payload: SelectionSubmission) => void
  cancelSelection: () => void
}

declare global {
  interface Window {
    api: ScreenshotApi
  }
}
