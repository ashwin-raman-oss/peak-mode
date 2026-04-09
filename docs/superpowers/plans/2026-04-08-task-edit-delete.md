# Task Edit & Delete Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add edit and delete functionality to task rows in ArenaDetail, with optimistic UI updates and Supabase persistence.

**Architecture:** Three-layer change — add `updateTask`/`deleteTask` to the `useTasks` hook, extend `TaskRow` with hover-revealed icon buttons, and wire edit/delete modals into `ArenaDetail`. Delete is restricted to misc tasks only; recurring tasks can be edited (title + priority_override) with a permanent-change warning. No new files needed — all changes are additive to existing files.

**Tech Stack:** React 19, Supabase JS client, Tailwind CSS v3 with custom peak-* tokens, Vitest (existing tests must stay green)

---

## File Map

| File | Change |
|------|--------|
| `src/hooks/useTasks.js` | Add `updateTask` and `deleteTask` functions; export them |
| `src/components/TaskRow.jsx` | Add `onEdit`/`onDelete` props; render hover-visible icon buttons |
| `src/pages/ArenaDetail.jsx` | Add edit modal + delete confirm modal; wire up handlers |

---

### Task 1: useTasks hook — updateTask + deleteTask

**Files:**
- Modify: `src/hooks/useTasks.js`

- [ ] **Step 1: Run existing tests to establish baseline**

```bash
cd C:/Users/ashwi/ClaudeCodeProjects/peak-mode && npx vitest run
```
Expected: All tests pass. If any fail, stop and investigate before continuing.

- [ ] **Step 2: Add `updateTask` after the `addMiscTask` function (around line 136)**

Insert after the closing `}` of `addMiscTask`:

```js
  async function updateTask(taskId, { title, priority_override }) {
    if (!userId) throw new Error('No authenticated user')
    const updates = {}
    if (title !== undefined) updates.title = title
    if (priority_override !== undefined) updates.priority_override = priority_override

    // Optimistic update
    setTasks(prev => prev.map(t =>
      t.id === taskId ? { ...t, ...updates } : t
    ))

    const { data, error: updateErr } = await supabase
      .from('tasks')
      .update(updates)
      .eq('id', taskId)
      .select('*, arenas(id, name, emoji, slug, default_priority)')
      .single()

    if (updateErr) {
      // Rollback: refetch to restore accurate state
      await fetchData()
      throw updateErr
    }

    setTasks(prev => prev.map(t => t.id === taskId ? data : t))
    return data
  }

  async function deleteTask(taskId) {
    if (!userId) throw new Error('No authenticated user')

    // Optimistic remove
    setTasks(prev => prev.filter(t => t.id !== taskId))
    setCompletions(prev => prev.filter(c => c.task_id !== taskId))

    // Delete completions first (FK constraint)
    const { error: compErr } = await supabase
      .from('task_completions')
      .delete()
      .eq('task_id', taskId)

    if (compErr) {
      await fetchData()
      throw compErr
    }

    const { error: taskErr } = await supabase
      .from('tasks')
      .delete()
      .eq('id', taskId)

    if (taskErr) {
      await fetchData()
      throw taskErr
    }
  }
```

- [ ] **Step 3: Export the new functions — add them to the return object at the bottom of the hook**

The current return block ends with `refetch: fetchData,`. Add `updateTask` and `deleteTask` to it:

```js
  return {
    tasks,
    completions,
    arenas,
    loading,
    error,
    isTaskDone,
    getCompletionCount,
    completeTask,
    addMiscTask,
    updateTask,
    deleteTask,
    getArenaStats,
    getTodaysFocusTasks,
    getWeekXp,
    weekStartStr,
    refetch: fetchData,
  }
```

- [ ] **Step 4: Run tests again to confirm nothing is broken**

```bash
npx vitest run
```
Expected: All tests still pass (these tests cover xp/dates/streak pure functions — hook changes can't break them, but confirm anyway).

- [ ] **Step 5: Verify the build compiles**

```bash
npm run build 2>&1 | tail -20
```
Expected: `✓ built in` with no TypeScript/import errors.

- [ ] **Step 6: Commit**

```bash
git add src/hooks/useTasks.js
git commit -m "feat: add updateTask and deleteTask to useTasks hook"
```

---

### Task 2: TaskRow — edit/delete icon buttons

**Files:**
- Modify: `src/components/TaskRow.jsx`

Context: The current TaskRow accepts `{ task, completionCount, isDone, onComplete, completing }`. We're adding `onEdit` and `onDelete` optional props. The row uses a `flex items-center gap-3` layout. We add an action group at the end, after the Badge.

Hover behavior:
- **Desktop** (`sm:` and up): buttons are invisible by default, revealed on row hover via CSS `group`/`group-hover`
- **Mobile** (below `sm:`): buttons are always visible at reduced opacity so touch users can access them

Only misc tasks (`task.task_type !== 'recurring'`) show the delete button. Edit button appears for all task types when `onEdit` is provided.

Icons: inline SVG, 14×14px, `currentColor` stroke.

- [ ] **Step 1: Replace the full content of `src/components/TaskRow.jsx`**

```jsx
import Badge from './ui/Badge'

function PencilIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
    </svg>
  )
}

function TrashIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="3 6 5 6 21 6" />
      <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
      <path d="M10 11v6M14 11v6" />
      <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
    </svg>
  )
}

export default function TaskRow({ task, completionCount, isDone, onComplete, completing, onEdit, onDelete }) {
  const effectivePriority = task.priority_override ?? task.priority
  const isCounter = task.weekly_target > 1
  const canComplete = !isDone && !completing

  return (
    <div className={`group flex items-center gap-3 py-2.5 px-1 border-b border-peak-border/50 last:border-0 ${isDone ? 'opacity-50' : ''}`}>
      {/* Checkbox or counter */}
      {isCounter ? (
        <button
          onClick={() => canComplete && onComplete(task)}
          disabled={!canComplete}
          aria-label={`${task.title} — ${completionCount} of ${task.weekly_target} complete`}
          className={`shrink-0 w-14 h-7 rounded-lg border text-[10px] font-black tracking-wider transition-colors
            ${isDone
              ? 'bg-peak-accent/20 border-peak-accent/40 text-peak-accent'
              : 'bg-peak-surface border-peak-border text-peak-muted hover:border-peak-accent/50'
            } disabled:cursor-not-allowed`}
        >
          {completionCount} / {task.weekly_target}
        </button>
      ) : (
        <button
          onClick={() => canComplete && onComplete(task)}
          disabled={!canComplete}
          aria-label={completing ? 'Completing...' : isDone ? `${task.title} — done` : `Complete: ${task.title}`}
          className={`shrink-0 w-5 h-5 rounded-full border-2 transition-colors flex items-center justify-center
            ${isDone
              ? 'bg-peak-accent border-peak-accent'
              : 'border-peak-border hover:border-peak-accent'
            } disabled:cursor-not-allowed`}
        >
          {isDone && <span className="text-peak-bg text-[10px] font-black">✓</span>}
          {completing && !isDone && <div className="w-1.5 h-1.5 rounded-full bg-peak-accent animate-pulse" />}
        </button>
      )}

      {/* Title */}
      <span className={`text-sm flex-1 ${isDone ? 'line-through text-peak-muted' : 'text-peak-primary'}`}>
        {task.title}
      </span>

      {/* Priority badge */}
      <Badge priority={effectivePriority} />

      {/* Action buttons — always visible on mobile, hover-only on desktop */}
      {(onEdit || onDelete) && (
        <div className="flex items-center gap-0.5 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
          {onEdit && (
            <button
              onClick={() => onEdit(task)}
              aria-label={`Edit: ${task.title}`}
              className="p-1.5 text-peak-muted hover:text-peak-primary transition-colors rounded"
            >
              <PencilIcon />
            </button>
          )}
          {onDelete && task.task_type !== 'recurring' && (
            <button
              onClick={() => onDelete(task)}
              aria-label={`Delete: ${task.title}`}
              className="p-1.5 text-peak-muted hover:text-red-400 transition-colors rounded"
            >
              <TrashIcon />
            </button>
          )}
        </div>
      )}
    </div>
  )
}
```

- [ ] **Step 2: Build to confirm no errors**

```bash
npm run build 2>&1 | tail -20
```
Expected: `✓ built in` with no errors.

- [ ] **Step 3: Commit**

```bash
git add src/components/TaskRow.jsx
git commit -m "feat: add edit/delete icon buttons to TaskRow"
```

---

### Task 3: ArenaDetail — edit and delete modals

**Files:**
- Modify: `src/pages/ArenaDetail.jsx`

Context: The current file already has `showAddModal` state and a `Modal` import. We're adding two more modal flows on top of the existing structure. The `useTasks` destructure needs `updateTask` and `deleteTask` added.

The edit modal reuses the same form pattern as "Add Task" (title input + priority select). The delete modal is a simple confirm dialog.

- [ ] **Step 1: Update the `useTasks` destructure to include `updateTask` and `deleteTask`**

Find this line (around line 21):
```js
  const {
    tasks, arenas, loading, isTaskDone, getCompletionCount, completeTask, addMiscTask, getArenaStats,
  } = useTasks(user?.id, slug)
```

Replace with:
```js
  const {
    tasks, arenas, loading, isTaskDone, getCompletionCount, completeTask, addMiscTask,
    updateTask, deleteTask, getArenaStats,
  } = useTasks(user?.id, slug)
```

- [ ] **Step 2: Add edit/delete state variables after the existing state declarations**

After line 30 (`const [actionError, setActionError] = useState(null)`), add:

```js
  const [taskToEdit, setTaskToEdit] = useState(null)
  const [editTitle, setEditTitle] = useState('')
  const [editPriority, setEditPriority] = useState('medium')
  const [saving, setSaving] = useState(false)
  const [taskToDelete, setTaskToDelete] = useState(null)
  const [deleting, setDeleting] = useState(false)
```

- [ ] **Step 3: Add edit and delete handler functions after `handleAddTask`**

After the closing `}` of `handleAddTask` (around line 111), add:

```js
  function handleEditOpen(task) {
    setTaskToEdit(task)
    setEditTitle(task.title)
    setEditPriority(task.priority_override ?? task.priority)
  }

  async function handleEditSave(e) {
    e.preventDefault()
    if (!editTitle.trim()) return
    setSaving(true)
    try {
      await updateTask(taskToEdit.id, { title: editTitle.trim(), priority_override: editPriority })
      setTaskToEdit(null)
    } catch (err) {
      console.error('Failed to update task:', err)
      setActionError('Could not update task. Try again.')
    } finally {
      setSaving(false)
    }
  }

  function handleDeleteOpen(task) {
    setTaskToDelete(task)
  }

  async function handleDeleteConfirm() {
    setDeleting(true)
    try {
      await deleteTask(taskToDelete.id)
      setTaskToDelete(null)
    } catch (err) {
      console.error('Failed to delete task:', err)
      setActionError('Could not delete task. Try again.')
    } finally {
      setDeleting(false)
    }
  }
```

- [ ] **Step 4: Pass `onEdit` and `onDelete` to all TaskRow instances**

There are two places in the JSX where `<TaskRow` is rendered. Update BOTH:

**Recurring tasks section** (around line 144):
```jsx
              <TaskRow
                key={task.id}
                task={task}
                completionCount={getCompletionCount(task)}
                isDone={isTaskDone(task)}
                onComplete={handleComplete}
                completing={completing === task.id}
                onEdit={handleEditOpen}
                onDelete={handleDeleteOpen}
              />
```

**Misc tasks section** (around line 166):
```jsx
              <TaskRow
                key={task.id}
                task={task}
                completionCount={getCompletionCount(task)}
                isDone={isTaskDone(task)}
                onComplete={handleComplete}
                completing={completing === task.id}
                onEdit={handleEditOpen}
                onDelete={handleDeleteOpen}
              />
```

Note: `TaskRow` itself only renders the delete button when `task.task_type !== 'recurring'`, so passing `handleDeleteOpen` to recurring tasks is safe — the button won't appear.

- [ ] **Step 5: Add the edit modal JSX after the existing add-task modal**

After the closing `}` of the `{showAddModal && (...)}` block (around line 218), add:

```jsx
      {/* Edit task modal */}
      {taskToEdit && (
        <Modal title="Edit Task" onClose={() => setTaskToEdit(null)}>
          {taskToEdit.task_type === 'recurring' && (
            <p className="text-xs bg-[#1E1A10] border border-[#3A2E10] text-[#8A7040] rounded-lg px-3 py-2 mb-4">
              This is a recurring task — changes apply permanently
            </p>
          )}
          <form onSubmit={handleEditSave} className="space-y-4">
            <div>
              <label htmlFor="edit-title" className="block text-xs font-bold tracking-widest text-peak-muted uppercase mb-1.5">Title</label>
              <input
                id="edit-title"
                type="text"
                value={editTitle}
                onChange={e => setEditTitle(e.target.value)}
                required
                autoFocus
                className="w-full bg-peak-bg border border-peak-border rounded-lg px-3 py-2.5 text-peak-primary text-sm focus:outline-none focus:border-peak-accent transition-colors"
              />
            </div>
            <div>
              <label htmlFor="edit-priority" className="block text-xs font-bold tracking-widest text-peak-muted uppercase mb-1.5">Priority</label>
              <select
                id="edit-priority"
                value={editPriority}
                onChange={e => setEditPriority(e.target.value)}
                className="w-full bg-peak-bg border border-peak-border rounded-lg px-3 py-2.5 text-peak-primary text-sm focus:outline-none focus:border-peak-accent transition-colors"
              >
                <option value="high">🔴 High</option>
                <option value="medium">🟡 Medium</option>
                <option value="optional">🟢 Optional</option>
              </select>
            </div>
            <div className="flex gap-2 pt-1">
              <Button type="submit" size="lg" className="flex-1" disabled={saving}>
                {saving ? 'Saving...' : 'Save Changes'}
              </Button>
              <Button type="button" variant="ghost" size="lg" onClick={() => setTaskToEdit(null)}>
                Cancel
              </Button>
            </div>
          </form>
        </Modal>
      )}

      {/* Delete confirm modal */}
      {taskToDelete && (
        <Modal title="Delete Task" onClose={() => setTaskToDelete(null)}>
          <p className="text-sm text-peak-primary mb-1 font-medium">{taskToDelete.title}</p>
          <p className="text-xs text-peak-muted mb-5">Delete this task? This will also remove all completion history.</p>
          <div className="flex gap-2">
            <Button
              size="lg"
              className="flex-1 !bg-red-950 !border-red-900 hover:!bg-red-900 !text-red-300"
              onClick={handleDeleteConfirm}
              disabled={deleting}
            >
              {deleting ? 'Deleting...' : 'Delete'}
            </Button>
            <Button type="button" variant="ghost" size="lg" onClick={() => setTaskToDelete(null)}>
              Cancel
            </Button>
          </div>
        </Modal>
      )}
```

- [ ] **Step 6: Build and verify**

```bash
npm run build 2>&1 | tail -20
```
Expected: `✓ built in` with no errors.

- [ ] **Step 7: Run tests**

```bash
npx vitest run
```
Expected: All tests pass.

- [ ] **Step 8: Commit**

```bash
git add src/pages/ArenaDetail.jsx
git commit -m "feat: add edit and delete task modals to ArenaDetail"
```

---

## Self-Review

**Spec coverage check:**
1. ✅ Edit/delete icon buttons on TaskRow — Task 2
2. ✅ Hover on desktop, always visible on mobile — Task 2 (sm:opacity-0 sm:group-hover:opacity-100)
3. ✅ Edit opens modal with pre-filled title + priority dropdown — Task 3
4. ✅ Save updates Supabase tasks table — Task 1 (`updateTask`)
5. ✅ Optimistic update on edit — Task 1 (optimistic setTasks before supabase call)
6. ✅ Delete shows confirmation modal with correct copy — Task 3
7. ✅ Delete removes from tasks + task_completions — Task 1 (`deleteTask`)
8. ✅ Optimistic remove on delete — Task 1 (setTasks + setCompletions filter)
9. ✅ Recurring tasks: edit allowed, delete button hidden, warning shown — Tasks 1+2+3
10. ✅ Misc tasks: fully editable and deletable — Tasks 1+2+3
11. ✅ Edit/delete buttons subtle: text-peak-muted, highlight on hover — Task 2
12. ✅ `updateTask` and `deleteTask` in useTasks hook — Task 1

**Type consistency:**
- `updateTask(taskId, { title, priority_override })` — consistent across Task 1 (definition) and Task 3 (call site)
- `deleteTask(taskId)` — consistent across Task 1 (definition) and Task 3 (call site)
- `handleEditOpen(task)` / `handleDeleteOpen(task)` — consistent with TaskRow `onEdit={handleEditOpen}` signatures
- `taskToEdit` / `taskToDelete` state names — no conflicts with hook exports

**Placeholder scan:** No TBDs, TODOs, or vague steps found.
