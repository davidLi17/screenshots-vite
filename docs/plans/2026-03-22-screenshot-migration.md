# Screenshot Migration Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Migrate the legacy Electron screenshot flow into the current `electron-vite` project while preserving background residency, adding platform-specific shortcuts, and supporting clipboard-first completion with optional manual file saving.

**Architecture:** Keep capture and file-system behavior in the main process, expose a minimal typed API through preload, and rebuild the legacy HTML overlay as a React canvas-driven selection UI. Extract pure helper logic for selection normalization and action handling so critical behavior is testable outside Electron.

**Tech Stack:** Electron, electron-vite, React, TypeScript, Node test runner

---

### Task 1: Add a migration test harness and pure helpers

**Files:**

- Create: `src/shared/selection.ts`
- Create: `src/shared/selection.test.mjs`
- Modify: `package.json`

**Step 1: Write the failing test**

Add tests for:

- normalizing reverse drag rectangles into positive bounds
- choosing `Alt+Q` on Windows/Linux and `Option+Q` on macOS
- validating supported screenshot actions

**Step 2: Run test to verify it fails**

Run: `node --test src/shared/selection.test.mjs`
Expected: FAIL because the shared helper module does not exist yet.

**Step 3: Write minimal implementation**

Create `src/shared/selection.ts` with:

- `normalizeSelectionBounds`
- `getCaptureShortcut`
- shared action and bounds types

**Step 4: Run test to verify it passes**

Run: `node --test src/shared/selection.test.mjs`
Expected: PASS

### Task 2: Migrate screenshot core to TypeScript

**Files:**

- Create: `src/main/screenshots.ts`
- Modify: `src/shared/selection.ts`

**Step 1: Write the failing test**

Extend tests for a helper that converts CSS-pixel bounds into crop bounds using `scaleFactor`, including rounding behavior.

**Step 2: Run test to verify it fails**

Run: `node --test src/shared/selection.test.mjs`
Expected: FAIL because crop helper does not exist yet.

**Step 3: Write minimal implementation**

Add crop-bound conversion helper and create `Screenshots` class in `src/main/screenshots.ts` to:

- capture the full display
- crop by normalized bounds
- copy to clipboard on complete
- show a save dialog and write file only on download

**Step 4: Run test to verify it passes**

Run: `node --test src/shared/selection.test.mjs`
Expected: PASS

### Task 3: Replace main-process template logic

**Files:**

- Modify: `src/main/index.ts`
- Modify: `src/preload/index.ts`
- Modify: `src/preload/index.d.ts`

**Step 1: Write the failing test**

Add a failing test covering the IPC payload shape, including supported actions and normalized bounds.

**Step 2: Run test to verify it fails**

Run: `node --test src/shared/selection.test.mjs`
Expected: FAIL because payload helper or typing does not match.

**Step 3: Write minimal implementation**

Implement:

- hidden background window behavior
- overlay window creation with preload + isolation
- platform shortcut registration
- macOS screen-recording permission guard
- IPC listeners for `submit-selection` and `cancel-selection`
- typed preload API for renderer calls

**Step 4: Run test to verify it passes**

Run: `node --test src/shared/selection.test.mjs`
Expected: PASS

### Task 4: Rebuild the renderer overlay in React

**Files:**

- Modify: `src/renderer/src/App.tsx`
- Modify: `src/renderer/src/assets/main.css`

**Step 1: Write the failing test**

Add a failing shared test for selection lifecycle helpers:

- no selection if drag size is zero
- button panel only appears after a valid selection

**Step 2: Run test to verify it fails**

Run: `node --test src/shared/selection.test.mjs`
Expected: FAIL because lifecycle helpers do not exist yet.

**Step 3: Write minimal implementation**

Replace the default app UI with:

- full-screen transparent canvas overlay
- drag-to-select rectangle
- controls for cancel, complete, and download save
- resize-safe canvas redraw

**Step 4: Run test to verify it passes**

Run: `node --test src/shared/selection.test.mjs`
Expected: PASS

### Task 5: Verify the migrated app

**Files:**

- No new production files expected unless verification uncovers fixes

**Step 1: Run targeted tests**

Run: `node --test src/shared/selection.test.mjs`
Expected: PASS

**Step 2: Run type checks**

Run: `npm run typecheck`
Expected: PASS

**Step 3: Run production build**

Run: `npm run build`
Expected: PASS
