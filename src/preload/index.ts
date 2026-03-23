import { contextBridge, ipcRenderer } from 'electron'

import type { SelectionSubmission } from '../shared/selection'
import { IPC_EVENTS } from '../shared/ipc-events'

const api = {
  submitSelection: (payload: SelectionSubmission) => {
    ipcRenderer.send(IPC_EVENTS.SUBMIT_SELECTION, payload)
  },
  cancelSelection: () => {
    ipcRenderer.send(IPC_EVENTS.CANCEL_SELECTION)
  },
  getShortcut: () => {
    return ipcRenderer.invoke(IPC_EVENTS.GET_SHORTCUT)
  },
  setShortcut: (shortcut: string) => {
    return ipcRenderer.invoke(IPC_EVENTS.SET_SHORTCUT, shortcut)
  },
  openSettings: () => {
    ipcRenderer.send(IPC_EVENTS.OPEN_SETTINGS)
  },
  logToTerminal: (message: string) => {
    ipcRenderer.send(IPC_EVENTS.LOG_TO_TERMINAL, message)
  }
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
