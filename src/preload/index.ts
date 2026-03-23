import { contextBridge, ipcRenderer } from 'electron'

import type { SelectionSubmission } from '../shared/selection'

const api = {
  submitSelection: (payload: SelectionSubmission) => ipcRenderer.send('submit-selection', payload),
  cancelSelection: () => ipcRenderer.send('cancel-selection'),
  getShortcut: () => ipcRenderer.invoke('get-shortcut'),
  setShortcut: (shortcut: string) => ipcRenderer.invoke('set-shortcut', shortcut),
  openSettings: () => ipcRenderer.send('open-settings')
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
