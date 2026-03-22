# 截图工具迁移计划 (Native Electron -> electron-vite + React18 + TS)

## 🎯 迁移目标

将现有的原生 Electron 截图项目平滑迁移至 `electron-vite` 现代工程化架构，核心诉求是**模块解耦**、**类型安全 (TS)** 和**视图层现代化 (React)**，同时保持底层截图能力原封不动。

## 📦 架构映射关系

原架构是 `BrowserWindow (contextIsolation: false)` + 原生 HTML Canvas + `ipcRenderer` 直接通信。
新架构是 `BrowserWindow (contextIsolation: true)` + React 组件 + Preload 安全桥接。

| 领域           | 原文件 / 逻辑                                                                                                      | 新架构目标文件 (electron-vite) | 改造核心点                                                                                                                              |
| :------------- | :----------------------------------------------------------------------------------------------------------------- | :----------------------------- | :-------------------------------------------------------------------------------------------------------------------------------------- |
| **主进程**     | [main.js](file:///Users/davidli/Documents/WebDevelops/LearnElectron/electron-screenshot/main.js)                   | `src/main/index.ts`            | 添加 TypeScript 类型；移除 `disable-renderer-backgrounding` 强依赖；适配 electron-vite 窗口配置逻辑。                                   |
| **截图核心层** | [screenshots.js](file:///Users/davidli/Documents/WebDevelops/LearnElectron/electron-screenshot/screenshots.js)     | `src/main/screenshots.ts`      | Class 改写为 TS 版本，补充 `Bounds` 接口定义，保留所有底层截图和 `nativeImage.crop` 逻辑。                                              |
| **IPC 桥接**   | (无，直接由 HTML 引入)                                                                                             | `src/preload/index.ts`         | **(关键变更)** 根据安全规范，使用 `contextBridge.exposeInMainWorld` 暴露截图专用的 API 对象 (如 `window.api.captureArea`) 给 React 层。 |
| **视图层**     | [select_area.html](file:///Users/davidli/Documents/WebDevelops/LearnElectron/electron-screenshot/select_area.html) | `src/renderer/src/App.tsx`     | 将命令式 DOM 操作和 Canvas 画图逻辑，重构成 React 的 `useRef` + `useEffect` 挂载；事件监听改为 React 合成事件或 Hooks 管理。            |

## 🛠️ 分步执行计划 (按依赖顺序)

### 阶段一：基础架构搭建与依赖同步

1. 新建 `electron-vite` 项目（选择 React + TypeScript）。
2. 在新项目 [package.json](file:///Users/davidli/Documents/WebDevelops/LearnElectron/electron-screenshot/package.json) 中补齐原项目依赖：`node-screenshots`。
3. 拷贝核心逻辑文件：将 [screenshots.js](file:///Users/davidli/Documents/WebDevelops/LearnElectron/electron-screenshot/screenshots.js) 移至 `src/main` 目录下并重命名为 `screenshots.ts`，补充关键的类型定义 (如 `CaptureBounds`)。

### 阶段二：主进程 (Main Process) 改造

1. 在 `src/main/index.ts` 中引入 `Screenshots` 模块。
2. 移植 `app.on("ready")` 初始化逻辑和 `globalShortcut.register` 快捷键注册 (`Alt+Q`)。
3. 重构 `createOverlayWindow` 函数：
   - 移除不安全配置：`nodeIntegration: true`, `contextIsolation: false`。
   - 配置 preload 脚本路径：`preload: join(__dirname, '../preload/index.js')`。
   - 指向渲染层入口：区分开发环境 (`loadURL`) 和生产环境 (`loadFile`)，这是 electron-vite 标准做法。
4. 注册 `ipcMain.on` 监听器 (`area-selected`, `cancel-selection`)，连接到底层 `screenshots` 实例。

### 阶段三：安全桥接通道 (Preload) 建设

1. 在 `src/preload/index.ts` 编写暴露给 React 的 API 对象：

   ```typescript
   import { contextBridge, ipcRenderer } from 'electron'

   // Custom APIs for renderer
   const api = {
     sendAreaSelected: (args: { x: number; y: number; width: number; height: number }) =>
       ipcRenderer.send('area-selected', args),
     sendCancelSelection: () => ipcRenderer.send('cancel-selection')
   }

   // Use `contextBridge` APIs to expose Electron APIs to
   // renderer only if context isolation is enabled, otherwise
   // just add to the DOM global.
   if (process.contextIsolated) {
     try {
       contextBridge.exposeInMainWorld('api', api)
     } catch (error) {
       console.error(error)
     }
   } else {
     // @ts-ignore (define in dts)
     window.api = api
   }
   ```

2. 需要同步修改 `src/preload/index.d.ts` 以提供对应的 `Window` 类型声明，保证 React 端的 TS 推导。

### 阶段四：渲染层 (Renderer Process) React 化

1. 清理 `src/renderer/src/App.tsx` 现有样板代码。
2. 将原 [select_area.html](file:///Users/davidli/Documents/WebDevelops/LearnElectron/electron-screenshot/select_area.html) 中的 CSS (`html, body { ... }`) 逻辑迁移至 `src/renderer/src/assets/main.css` 或是内联/CSS Modules。
3. 在 `App.tsx` 中编写 Canvas 截图核心组件：
   - 使用 `useRef<HTMLCanvasElement>` 持有画布引用。
   - 使用 `useEffect` 绑定 `mousedown`, `mousemove`, `mouseup` 事件，管理绘制状态。
   - 在触发保存和取消动作时，调用 `window.api.sendAreaSelected(...)` 和 `window.api.sendCancelSelection()` 通讯给主进程。

### 阶段五：联调与优化

1. 测试应用冷启动与托盘/后台常驻。
2. 测试 `Alt+Q` 唤起速度，修正高分屏下 Canvas `width/height` 和 CSS 缩放可能导致的模糊或错位问题。
3. 确认 Mac 权限校验逻辑 (`systemPreferences.getMediaAccessStatus`) 能够正常工作。

## ⚠️ 核心注意避坑点

- **`scaleFactor` 缩放陷阱**：原生截图代码中在 `crop` 时使用了 `scaleFactor`，在重构为 React 时也要确保坐标单位一致性，避免在高分辨率屏幕上截图位置偏移。
- **透明度支持**：确保新项目的 `BrowserWindow` 配置中 `transparent: true` 设置生效，不要被 React 或默认样式的背景色阻拦 (比如 Vite 默认模板可能自带背景色)。
