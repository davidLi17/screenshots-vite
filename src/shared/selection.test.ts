import test from 'node:test'
import assert from 'node:assert/strict'

import {
  getCaptureShortcut,
  getSelectionControlsState,
  isScreenshotAction,
  normalizeSelectionBounds,
  parseSelectionSubmission,
  toScaledBounds
} from './selection'
import { ALT, CTRL, OPTION } from './types'

test('normalizeSelectionBounds converts reverse drags into positive bounds', () => {
  const normalized = normalizeSelectionBounds({
    startX: 240,
    startY: 160,
    currentX: 120,
    currentY: 60
  })

  assert.deepEqual(normalized, {
    x: 120,
    y: 60,
    width: 120,
    height: 100
  })
})

test('normalizeSelectionBounds returns null for zero-sized selections', () => {
  const normalized = normalizeSelectionBounds({
    startX: 100,
    startY: 100,
    currentX: 100,
    currentY: 100
  })

  assert.equal(normalized, null)
})

test(`getCaptureShortcut uses ${CTRL}+${OPTION}+D on macOS`, () => {
  assert.equal(getCaptureShortcut('darwin'), `${CTRL}+${OPTION}+D`)
})

test(`getCaptureShortcut uses ${CTRL}+${ALT}+D on non-macOS platforms`, () => {
  assert.equal(getCaptureShortcut('win32'), `${CTRL}+${ALT}+D`)
  assert.equal(getCaptureShortcut('linux'), `${CTRL}+${ALT}+D`)
})

test('isScreenshotAction only accepts supported actions', () => {
  assert.equal(isScreenshotAction('complete'), true)
  assert.equal(isScreenshotAction('download'), true)
  assert.equal(isScreenshotAction('cancel'), false)
})

test('selection controls only show for a valid finished selection', () => {
  assert.equal(getSelectionControlsState({ isDrawing: true, selection: null }), false)
  assert.equal(
    getSelectionControlsState({
      isDrawing: false,
      selection: { x: 10, y: 10, width: 50, height: 40 }
    }),
    true
  )
})

test('toScaledBounds converts CSS bounds to device-pixel bounds', () => {
  const scaled = toScaledBounds({ x: 10.4, y: 20.2, width: 100.3, height: 50.6 }, 2)

  assert.deepEqual(scaled, {
    x: 21,
    y: 40,
    width: 201,
    height: 101
  })
})

test('parseSelectionSubmission accepts supported screenshot payloads', () => {
  const payload = parseSelectionSubmission({
    action: 'download',
    bounds: { x: 10, y: 20, width: 200, height: 120 }
  })

  assert.deepEqual(payload, {
    action: 'download',
    bounds: { x: 10, y: 20, width: 200, height: 120 }
  })
})

test('parseSelectionSubmission rejects unsupported screenshot payloads', () => {
  assert.equal(
    parseSelectionSubmission({
      action: 'cancel',
      bounds: { x: 10, y: 20, width: 200, height: 120 }
    }),
    null
  )
  assert.equal(
    parseSelectionSubmission({
      action: 'complete',
      bounds: { x: 10, y: 20, width: 0, height: 120 }
    }),
    null
  )
})
