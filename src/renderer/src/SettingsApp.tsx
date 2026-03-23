import React, { useState } from 'react'
import { useMount } from 'ahooks'

const formatKey = (event: React.KeyboardEvent): string => {
  const keys: string[] = []
  if (event.metaKey) keys.push('Cmd')
  if (event.ctrlKey) keys.push('Ctrl')
  if (event.altKey) keys.push(navigator.platform.includes('Mac') ? 'Option' : 'Alt')
  if (event.shiftKey) keys.push('Shift')

  const rawKey = event.key
  // 过滤掉单独按下的修饰键
  if (!['Meta', 'Control', 'Alt', 'Shift'].includes(rawKey)) {
    const key = rawKey.length === 1 ? rawKey.toUpperCase() : rawKey
    keys.push(key)
  }

  return keys.join('+')
}

export default function SettingsApp(): React.JSX.Element {
  const [shortcut, setShortcut] = useState<string>('')
  const [recording, setRecording] = useState<boolean>(false)
  const [saved, setSaved] = useState<boolean>(false)

  useMount(() => {
    // 页面加载时请求最新快捷键
    window.api?.getShortcut().then((current) => {
      setShortcut(current)
    })
  })

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>): void => {
    e.preventDefault()

    // 按下 Esc 退出录制并不保存
    if (e.key === 'Escape') {
      setRecording(false)
      return
    }

    const newShortcut = formatKey(e)
    if (newShortcut) {
      setShortcut(newShortcut)
    }
  }

  const handleSave = async (): Promise<void> => {
    if (!shortcut) return
    const success = await window.api?.setShortcut(shortcut)
    if (success) {
      setRecording(false)
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
    }
  }

  return (
    <div style={{ padding: '24px', maxWidth: '500px', margin: '0 auto' }}>
      <h2>截图设置</h2>

      <div
        style={{
          marginTop: '24px',
          background: 'var(--bg-color, rgba(0,0,0,0.05))',
          padding: '20px',
          borderRadius: '8px'
        }}
      >
        <h3 style={{ margin: '0 0 16px', fontSize: '16px' }}>全局快捷键配置</h3>
        <p style={{ fontSize: '14px', color: '#666', marginBottom: '16px' }}>
          在此设置呼出截图的按键组合（支持修饰键如 Cmd/Ctrl/Option/Shift + 字母）。
        </p>

        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <input
            type="text"
            readOnly
            value={recording ? shortcut || '请按需组合键...' : shortcut}
            onKeyDown={handleKeyDown}
            onClick={() => setRecording(true)}
            onBlur={() => setRecording(false)}
            placeholder="点击此处录制快捷键"
            style={{
              flex: 1,
              padding: '10px 12px',
              fontSize: '16px',
              borderRadius: '6px',
              border: `2px solid ${recording ? '#007aff' : '#ccc'}`,
              outline: 'none',
              cursor: recording ? 'text' : 'pointer',
              background: recording ? '#fff' : '#fafafa',
              transition: 'all 0.2s'
            }}
          />
          <button
            onClick={handleSave}
            disabled={recording || !shortcut}
            style={{
              padding: '10px 20px',
              fontSize: '15px',
              borderRadius: '6px',
              border: 'none',
              background: saved ? '#34c759' : '#007aff',
              color: '#fff',
              cursor: recording || !shortcut ? 'not-allowed' : 'pointer',
              opacity: recording || !shortcut ? 0.6 : 1,
              transition: 'background 0.2s'
            }}
          >
            {saved ? '已保存 ✅' : '应用生效'}
          </button>
        </div>
      </div>
    </div>
  )
}
