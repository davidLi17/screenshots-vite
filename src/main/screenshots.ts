import { clipboard, desktopCapturer, dialog, nativeImage, screen } from 'electron'
import type { NativeImage } from 'electron'
import { promises as fs } from 'node:fs'

import type { SelectionBounds, SelectionSubmission } from '../shared/selection'
import { toScaledBounds } from '../shared/selection'

export class Screenshots {
  async handleSelection(submission: SelectionSubmission): Promise<void> {
    const image = await this.captureSelection(submission.bounds)

    if (submission.action === 'complete') {
      clipboard.writeImage(image)
      return
    }

    const savePath = await this.promptSavePath()
    if (!savePath) {
      return
    }

    await fs.writeFile(savePath, image.toPNG())
  }

  private async captureSelection(bounds: SelectionBounds): Promise<NativeImage> {
    const display = screen.getPrimaryDisplay()
    const { width, height } = display.bounds
    const scaleFactor = display.scaleFactor
    const thumbnailSize = {
      width: Math.round(width * scaleFactor),
      height: Math.round(height * scaleFactor)
    }

    const sources = await desktopCapturer.getSources({
      types: ['screen'],
      thumbnailSize
    })

    const source = sources.find((item) => item.display_id === String(display.id)) ?? sources[0]

    if (!source) {
      throw new Error('Unable to capture the primary display.')
    }

    return nativeImage
      .createFromBuffer(source.thumbnail.toPNG())
      .crop(toScaledBounds(bounds, scaleFactor))
  }

  private async promptSavePath(): Promise<string | undefined> {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
    const result = await dialog.showSaveDialog({
      defaultPath: `screenshot-${timestamp}.png`,
      filters: [{ name: 'PNG Image', extensions: ['png'] }]
    })

    if (result.canceled) {
      return undefined
    }

    return result.filePath
  }
}
