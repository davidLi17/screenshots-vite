import {
  app,
  BrowserWindow,
  globalShortcut,
  ipcMain,
  screen,
  shell,
  systemPreferences
} from 'electron'
import { join } from 'node:path'

import { is } from '@electron-toolkit/utils'

import { Screenshots } from './screenshots'
import { parseSelectionSubmission } from '../shared/selection'
import { settings } from './settings'

let backgroundWindow: BrowserWindow | null = null
let overlayWindow: BrowserWindow | null = null

const screenshots = new Screenshots()

function createBackgroundWindow(): void {
  if (backgroundWindow) {
    return
  }

  backgroundWindow = new BrowserWindow({
    width: 1,
    height: 1,
    x: 0,
    y: 0,
    show: false,
    frame: false,
    transparent: true,
    skipTaskbar: true,
    resizable: false,
    movable: false
  })

  backgroundWindow.loadURL('about:blank')
  backgroundWindow.on('closed', () => {
    backgroundWindow = null
  })
}

let settingsWindow: BrowserWindow | null = null

function createSettingsWindow(): void {
  if (settingsWindow) {
    settingsWindow.focus()
    return
  }

  settingsWindow = new BrowserWindow({
    width: 600,
    height: 440,
    show: false,
    resizable: false,
    title: '截图设置',
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false,
      contextIsolation: true,
      nodeIntegration: false
    }
  })

  // 隐藏菜单栏
  settingsWindow.setMenuBarVisibility(false)

  if (is.dev && process.env.ELECTRON_RENDERER_URL) {
    void settingsWindow.loadURL(`${process.env.ELECTRON_RENDERER_URL}/settings.html`)
  } else {
    void settingsWindow.loadFile(join(__dirname, '../renderer/settings.html'))
  }

  settingsWindow.once('ready-to-show', () => {
    settingsWindow?.show()
  })

  settingsWindow.on('closed', () => {
    settingsWindow = null
  })
}

function createOverlayWindow(): BrowserWindow {
  const display = screen.getPrimaryDisplay()

  const window = new BrowserWindow({
    x: display.bounds.x,
    y: display.bounds.y,
    width: display.bounds.width,
    height: display.bounds.height,
    show: false,
    frame: false,
    transparent: true,
    fullscreen: true,
    alwaysOnTop: true,
    skipTaskbar: true,
    movable: false,
    resizable: false,
    enableLargerThanScreen: true,
    autoHideMenuBar: true,
    backgroundColor: '#00000000',
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false,
      contextIsolation: true,
      nodeIntegration: false
    }
  })

  window.setVisibleOnAllWorkspaces(true, { visibleOnFullScreen: true })

  if (is.dev && process.env.ELECTRON_RENDERER_URL) {
    void window.loadURL(process.env.ELECTRON_RENDERER_URL)
  } else {
    void window.loadFile(join(__dirname, '../renderer/index.html'))
  }

  window.once('ready-to-show', () => {
    window.show()
    window.focus()
  })

  window.on('closed', () => {
    if (overlayWindow === window) {
      overlayWindow = null
    }
  })

  return window
}

async function ensureScreenPermission(): Promise<boolean> {
  if (process.platform !== 'darwin') {
    return true
  }

  const status = systemPreferences.getMediaAccessStatus('screen')
  if (status === 'granted') {
    return true
  }

  await shell.openExternal(
    'x-apple.systempreferences:com.apple.preference.security?Privacy_ScreenRecording'
  )
  return false
}

async function openSelectionOverlay(): Promise<void> {
  const hasPermission = await ensureScreenPermission()
  if (!hasPermission) {
    return
  }

  if (overlayWindow && !overlayWindow.isDestroyed()) {
    overlayWindow.focus()
    return
  }

  overlayWindow = createOverlayWindow()
}

async function closeOverlayWindow(): Promise<void> {
  if (!overlayWindow || overlayWindow.isDestroyed()) {
    overlayWindow = null
    return
  }

  const window = overlayWindow
  overlayWindow = null

  await new Promise<void>((resolve) => {
    window.once('closed', () => resolve())
    window.close()
  })
}

async function handleSelectionSubmission(payload: unknown): Promise<void> {
  const submission = parseSelectionSubmission(payload)
  if (!submission) {
    return
  }

  try {
    await closeOverlayWindow()
    await screenshots.handleSelection(submission)
  } catch (error) {
    console.error('Failed to capture screenshot selection.', error)
  }
}

function registerShortcuts(): void {
  globalShortcut.unregisterAll()

  const currentShortcut = settings.getShortcut()
  const registered = globalShortcut.register(currentShortcut, () => {
    void openSelectionOverlay()
  })

  if (!registered) {
    console.error(`Failed to register screenshot shortcut: ${currentShortcut}`)
  }
}

app.whenReady().then(() => {
  createBackgroundWindow()
  registerShortcuts()

  ipcMain.on('submit-selection', (_, payload) => {
    void handleSelectionSubmission(payload)
  })

  ipcMain.on('cancel-selection', () => {
    void closeOverlayWindow()
  })

  ipcMain.on('open-settings', () => {
    createSettingsWindow()
  })

  ipcMain.handle('get-shortcut', () => {
    return settings.getShortcut()
  })

  ipcMain.handle('set-shortcut', (_, shortcut: string) => {
    settings.setShortcut(shortcut)
    registerShortcuts() // 重新注册快捷键
    return true
  })

  app.on('activate', () => {
    createBackgroundWindow()
  })
})

app.on('will-quit', () => {
  globalShortcut.unregisterAll()
})

app.on('window-all-closed', () => {
  // Keep the app resident so the global shortcut continues to work.
})
