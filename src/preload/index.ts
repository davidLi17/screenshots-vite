import { contextBridge, ipcRenderer } from 'electron'

import type { SelectionSubmission } from '../shared/selection'

const api = {
  submitSelection: (payload: SelectionSubmission) => ipcRenderer.send('submit-selection', payload),
  cancelSelection: () => ipcRenderer.send('cancel-selection')
}

if (process.contextIsolated) {
  try {
    contextBridge.exposeInMainWorld('api', api)
  } catch (error) {
    console.error(error)
  }
} else {
  ;(window as typeof window & { api: typeof api }).api = api
}
