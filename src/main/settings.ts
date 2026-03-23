import { app } from 'electron'
import { join } from 'node:path'
import { readFileSync, writeFileSync, existsSync } from 'node:fs'

import { getCaptureShortcut } from '../shared/selection'

interface Config {
  shortcut?: string
}

class SettingsManager {
  private configPath: string
  private config: Config

  constructor() {
    this.configPath = join(app.getPath('userData'), 'screenshots-vite-config.json')
    this.config = this.loadConfig()
  }

  private loadConfig(): Config {
    try {
      if (existsSync(this.configPath)) {
        const data = readFileSync(this.configPath, 'utf-8')
        return JSON.parse(data) as Config
      }
    } catch (err) {
      console.error('Failed to load settings:', err)
    }
    return {}
  }

  private saveConfig(): void {
    try {
      writeFileSync(this.configPath, JSON.stringify(this.config, null, 2), 'utf-8')
    } catch (err) {
      console.error('Failed to save settings:', err)
    }
  }

  public getShortcut(): string {
    return this.config.shortcut || getCaptureShortcut(process.platform)
  }

  public setShortcut(shortcut: string): void {
    this.config.shortcut = shortcut
    this.saveConfig()
  }
}

export const settings = new SettingsManager()
