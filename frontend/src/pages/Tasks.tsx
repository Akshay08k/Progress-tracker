import React, { useState } from 'react';
import { useAppDispatch, useAppSelector } from '../store';
import { addTask, updateTask, toggleTaskCompleted, deleteTask, type Task } from '../store/tasksSlice';
import { showToast } from '../store/uiSlice';
import { earnXp } from '../store/profileSlice';
import { Card } from '../components/UI/Card';
import { db } from '../services/firebase';
import { collection, addDoc, doc, updateDoc } from 'firebase/firestore';
import { DragDropContext, Droppable, Draggable, type DropResult } from '@hello-pangea/dnd';
import {
  IoListOutline, IoGridOutline, IoAddOutline, IoTrashOutline,
  IoCheckmarkCircleOutline, IoEllipseOutline, IoFilterOutline, IoCalendarOutline
} from 'react-icons/io5';
import { exportToExcel, exportToPdf } from '../utils/export';




export const Tasks: React.FC = () => {
  const dispatch = useAppDispatch();
  const user = useAppSelector((state) => state.auth.user);
  const tasks = useAppSelector((state) => state.tasks.items);

  // Layout & Filter States
  const [viewMode, setViewMode] = useState<'list' | 'board'>('board');
  const [filterCategory, setFilterCategory] = useState('All');
  const [filterPriority, setFilterPriority] = useState('All');
  const [searchTerm, setSearchTerm] = useState('');

  // Task Creation Form Modal States
  const [modalOpen, setModalOpen] = useState(false);
  const [formTitle, setFormTitle] = useState('');
  const [formDesc, setFormDesc] = useState('');
  const [formCategory, setFormCategory] = useState('Work');
  const [formPriority, setFormPriority] = useState<Task['priority']>('medium');
  const [formDueDate, setFormDueDate] = useState(new Date().toISOString().split('T')[0]);
  const [formDueTime, setFormDueTime] = useState('12:00');
  const [formRecurring, setFormRecurring] = useState<'none' | 'daily' | 'weekly'>('none');
  const [formColumnId, setFormColumnId] = useState<'todo' | 'in_progress' | 'done'>('todo');
  const [editingTask, setEditingTask] = useState<Task | null>(null);

  const categories = ['Work', 'Personal', 'Health', 'Finance', 'Learning', 'General'];
  const columns = [
    { id: 'todo', title: 'Need to Sew', color: 'border-accent/40 bg-accent/5' },
    { id: 'in_progress', title: 'Stitching In Progress', color: 'border-orange-500/40 bg-orange-500/5' },
    { id: 'done', title: 'Finished Stitches', color: 'border-green-500/40 bg-green-500/5' },
  ];

  const handleCreateOrEditTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formTitle.trim()) return;

    try {
      const isNewlyDone = formColumnId === 'done' && (!editingTask || editingTask.columnId !== 'done');
      
      const taskFields = {
        userId: user?.uid || 'anonymous',
        title: formTitle,
        description: formDesc,
        category: formCategory,
        priority: formPriority,
        dueDate: formDueDate,
        dueTime: formDueTime,
        recurring: formRecurring,
        completed: formColumnId === 'done',
        columnId: formColumnId,
        updatedAt: new Date().toISOString()
      };

      if (editingTask) {
        // Edit flow
        const taskRef = doc(db, 'tasks', editingTask.id);
        await updateDoc(taskRef, taskFields);
        dispatch(updateTask({ id: editingTask.id, ...taskFields }));
        dispatch(showToast({ message: 'Task updated!', type: 'success' }));
      } else {
        // Create flow
        const docRef = await addDoc(collection(db, 'tasks'), {
          ...taskFields,
          createdAt: new Date().toISOString(),
          isDeleted: false
        });

        dispatch(addTask({ id: docRef.id, ...taskFields }));
        dispatch(showToast({ message: 'Task created on canvas!', type: 'success' }));
      }

      if (isNewlyDone) {
        dispatch(earnXp(10));
        // Update user XP inside Firestore
        if (user?.uid) {
          const userRef = doc(db, 'users', user.uid);
          const newXp = (user.xp || 0) + 10;
          await updateDoc(userRef, { xp: newXp });

          // Log XP to user's xpHistory
          const todayStr = new Date().toISOString().split('T')[0];
          const currentHistory = user.xpHistory ? [...user.xpHistory] : [];
          const existingEntryIdx = currentHistory.findIndex(h => h.date === todayStr);
          if (existingEntryIdx !== -1) {
            currentHistory[existingEntryIdx] = {
              ...currentHistory[existingEntryIdx],
              xp: currentHistory[existingEntryIdx].xp + 10
            };
          } else {
            currentHistory.push({ date: todayStr, xp: 10 });
          }
          await updateDoc(userRef, { xpHistory: currentHistory });
        }
      }

      handleCloseModal();
    } catch (err: any) {
      console.error(err);
      dispatch(showToast({ message: 'Operation failed.', type: 'error' }));
    }
  };

  const handleOpenCreateModal = () => {
    setEditingTask(null);
    setFormTitle('');
    setFormDesc('');
    setFormCategory('Work');
    setFormPriority('medium');
    setFormDueDate(new Date().toISOString().split('T')[0]);
    setFormDueTime('12:00');
    setFormRecurring('none');
    setFormColumnId('todo');
    setModalOpen(true);
  };

  const handleOpenEditModal = (task: Task) => {
    setEditingTask(task);
    setFormTitle(task.title);
    setFormDesc(task.description);
    setFormCategory(task.category);
    setFormPriority(task.priority);
    setFormDueDate(task.dueDate);
    setFormDueTime(task.dueTime || '12:00');
    setFormRecurring(task.recurring || 'none');
    setFormColumnId(task.columnId || (task.completed ? 'done' : 'todo'));
    setModalOpen(true);
  };

  const handleCloseModal = () => {
    setModalOpen(false);
    setEditingTask(null);
  };

  const handleChangeTaskStatus = async (taskId: string, nextColumn: 'todo' | 'in_progress' | 'done') => {
    try {
      const taskRef = doc(db, 'tasks', taskId);
      const nextCompleted = nextColumn === 'done';

      const existingTask = tasks.find(t => t.id === taskId);
      const wasDone = existingTask?.columnId === 'done' || existingTask?.completed;

      await updateDoc(taskRef, { completed: nextCompleted, columnId: nextColumn });
      dispatch(updateTask({ id: taskId, completed: nextCompleted, columnId: nextColumn }));

      if (nextCompleted && !wasDone) {
        dispatch(earnXp(10));
        dispatch(showToast({ message: 'Stitch Completed! Gained +10 XP! 🧵', type: 'success' }));

        // Update user XP inside Firestore
        if (user?.uid) {
          const userRef = doc(db, 'users', user.uid);
          const newXp = (user.xp || 0) + 10;
          await updateDoc(userRef, { xp: newXp });

          // Log XP to user's xpHistory
          const todayStr = new Date().toISOString().split('T')[0];
          const currentHistory = user.xpHistory ? [...user.xpHistory] : [];
          const existingEntryIdx = currentHistory.findIndex(h => h.date === todayStr);
          if (existingEntryIdx !== -1) {
            currentHistory[existingEntryIdx] = {
              ...currentHistory[existingEntryIdx],
              xp: currentHistory[existingEntryIdx].xp + 10
            };
          } else {
            currentHistory.push({ date: todayStr, xp: 10 });
          }
          await updateDoc(userRef, { xpHistory: currentHistory });
        }
      } else {
        const laneName = nextColumn === 'todo' ? 'Need to Sew' : nextColumn === 'in_progress' ? 'Stitching In Progress' : 'Finished Stitches';
        dispatch(showToast({ message: `Task moved to: ${laneName}`, type: 'success' }));
      }
    } catch (err) {
      console.error(err);
      dispatch(showToast({ message: 'Failed to update status.', type: 'error' }));
    }
  };

  const handleToggleComplete = async (taskId: string, currentCompleted: boolean) => {
    const nextColumn = !currentCompleted ? 'done' : 'todo';
    await handleChangeTaskStatus(taskId, nextColumn);
  };

  const handleDeleteTask = async (taskId: string) => {
    if (!window.confirm('Delete this task node from canvas?')) return;
    try {
      const taskRef = doc(db, 'tasks', taskId);
      await updateDoc(taskRef, { isDeleted: true });
      dispatch(deleteTask(taskId));
      dispatch(showToast({ message: 'Task node removed.', type: 'info' }));
    } catch (err) {
      console.error(err);
    }
  };

  const handleDragEnd = async (result: DropResult) => {
    const { destination, source, draggableId } = result;
    if (!destination) return;
    if (destination.droppableId === source.droppableId && destination.index === source.index) return;

    const nextColumn = destination.droppableId as 'todo' | 'in_progress' | 'done';
    await handleChangeTaskStatus(draggableId, nextColumn);
  };

  // Filter Tasks list
  const filteredTasks = tasks.filter((t) => {
    if (t.isDeleted) return false;
    if (filterCategory !== 'All' && t.category !== filterCategory) return false;
    if (filterPriority !== 'All' && t.priority !== filterPriority) return false;
    if (searchTerm.trim() !== '' && !t.title.toLowerCase().includes(searchTerm.toLowerCase())) return false;
    return true;
  });

  return (
    <div className="space-y-6">

      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight uppercase font-mono-stats">
            TASKS & BOARDS
          </h1>
          <p className="text-xs text-text-secondary mt-0.5">
            Manage your daily tasks in traditional tabular lists or interactive tactile Kanban lanes.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Toggle Views */}
          <div className="flex rounded-lg border border-border-stitch overflow-hidden bg-background-surface">
            <button
              onClick={() => setViewMode('list')}
              className={`p-2.5 flex items-center gap-1.5 text-xs font-bold transition-all focus:outline-none ${viewMode === 'list' ? 'bg-accent text-white' : 'text-text-secondary hover:text-text-primary'}`}
            >
              <IoListOutline className="text-base" />
              <span className="hidden sm:inline">List View</span>
            </button>
            <button
              onClick={() => setViewMode('board')}
              className={`p-2.5 flex items-center gap-1.5 text-xs font-bold transition-all focus:outline-none ${viewMode === 'board' ? 'bg-accent text-white' : 'text-text-secondary hover:text-text-primary'}`}
            >
              <IoGridOutline className="text-base" />
              <span className="hidden sm:inline">Board View</span>
            </button>
          </div>

          <button
            onClick={handleOpenCreateModal}
            className="flex items-center gap-1.5 px-4 py-2.5 rounded-lg bg-accent border-2 border-double border-white text-white font-extrabold text-xs shadow-orbital hover:shadow-floating transition-all"
          >
            <IoAddOutline className="text-base" />
            <span>Sketch Task</span>
          </button>
        </div>
      </div>

      {/* Filter toolbar */}
      <div className="flex flex-col md:flex-row md:items-center gap-4 bg-background-surface border border-border-stitch p-4 rounded-xl">
        <div className="flex-1 flex gap-3 items-center">
          <IoFilterOutline className="text-text-secondary shrink-0" />
          <input
            type="text"
            placeholder="Search task titles..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-transparent text-xs text-text-primary focus:outline-none placeholder-text-secondary/40"
          />
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            className="px-3 py-1.5 rounded-lg bg-background-primary border border-border-stitch text-xs text-text-primary focus:outline-none focus:border-accent"
          >
            <option value="All">All Categories</option>
            {categories.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>

          <select
            value={filterPriority}
            onChange={(e) => setFilterPriority(e.target.value)}
            className="px-3 py-1.5 rounded-lg bg-background-primary border border-border-stitch text-xs text-text-primary focus:outline-none focus:border-accent"
          >
            <option value="All">All Priorities</option>
            <option value="low">Low Priority</option>
            <option value="medium">Medium Priority</option>
            <option value="high">High Priority</option>
          </select>

          <button
            onClick={() => exportToExcel(filteredTasks as any)}
            className="px-3 py-1.5 rounded-lg bg-green-500/10 border border-green-500/30 hover:bg-green-500 hover:text-white text-xs font-bold text-green-500 transition-all font-mono-stats uppercase"
          >
            XLSX
          </button>

          <button
            onClick={() => exportToPdf(filteredTasks as any, user?.displayName || 'Stitch Member')}
            className="px-3 py-1.5 rounded-lg bg-[#d85a30]/10 border border-[#d85a30]/30 hover:bg-[#d85a30] hover:text-white text-xs font-bold text-[#d85a30] transition-all font-mono-stats uppercase"
          >
            PDF
          </button>
        </div>
      </div>

      {/* View layouts Render */}
      {viewMode === 'list' ? (
        <Card stitched={true} padding="p-6">
          <div className="space-y-3">
            {filteredTasks.length === 0 ? (
              <div className="text-center p-8 text-text-secondary text-xs">
                No tasks match your filter variables. Sketch a new target task node to populate the canvas.
              </div>
            ) : (
              filteredTasks.map((t) => (
                <div
                  key={t.id}
                  className={`
                    p-4 rounded-xl border flex items-center justify-between gap-4 transition-all duration-300
                    ${t.completed ? 'bg-background-primary/30 border-border-stitch/60 text-text-secondary' : 'bg-background-surface border-border-stitch hover:border-accent/40 shadow-orbital'}
                  `}
                >
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => handleToggleComplete(t.id, t.completed)}
                      className="text-xl text-accent focus:outline-none"
                    >
                      {t.completed ? <IoCheckmarkCircleOutline className="text-green-500" /> : <IoEllipseOutline />}
                    </button>
                    <div>
                      <h3 className={`text-xs font-bold uppercase ${t.completed ? 'line-through text-text-secondary/70' : 'text-text-primary'}`}>
                        {t.title}
                      </h3>
                      <p className="text-[10px] text-text-secondary line-clamp-1 mt-0.5">{t.description}</p>
                      <div className="flex gap-1.5 items-center mt-2 flex-wrap">
                        <span className="text-[8px] font-bold bg-accent/10 text-accent px-1.5 py-0.5 rounded uppercase font-mono-stats">
                          {t.category}
                        </span>
                        <span className={`text-[8px] font-bold px-1.5 py-0.5 rounded uppercase font-mono-stats border ${t.priority === 'high' ? 'bg-red-500/10 text-red-500 border-red-500/30' : t.priority === 'medium' ? 'bg-orange-500/10 text-orange-500 border-orange-500/30' : 'bg-green-500/10 text-green-500 border-green-500/30'}`}>
                          {t.priority}
                        </span>
                        {t.dueDate && (
                          <span className="text-[8px] font-mono-stats text-text-secondary/70 flex items-center gap-0.5">
                            <IoCalendarOutline />
                            {t.dueDate}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <select
                      value={t.columnId || (t.completed ? 'done' : 'todo')}
                      onChange={(e) => handleChangeTaskStatus(t.id, e.target.value as any)}
                      className="px-2 py-1 bg-background-primary border border-border-stitch rounded text-[10px] text-text-primary focus:outline-none focus:border-accent font-semibold"
                    >
                      <option value="todo">Need to Sew</option>
                      <option value="in_progress">Stitching In Progress</option>
                      <option value="done">Finished Stitches</option>
                    </select>

                    <button
                      onClick={() => handleOpenEditModal(t)}
                      className="px-2.5 py-1 bg-background-primary hover:bg-background-primary/80 border border-border-stitch text-[10px] font-extrabold uppercase font-mono-stats text-text-secondary rounded"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDeleteTask(t.id)}
                      className="p-1.5 bg-background-primary hover:bg-red-600 hover:text-white border border-border-stitch hover:border-red-600 transition-all rounded text-text-secondary"
                    >
                      <IoTrashOutline />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </Card>
      ) : (
        /* Kanban Drag & Drop View */
        <DragDropContext onDragEnd={handleDragEnd}>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {columns.map((col) => {
              const colTasks = filteredTasks.filter((t) => (t.columnId || 'todo') === col.id);

              return (
                <div key={col.id} className="flex flex-col min-h-[400px]">
                  <div className={`p-3.5 border border-dashed rounded-t-xl border-b-0 font-extrabold text-xs tracking-wider uppercase font-mono-stats text-text-primary text-center ${col.color}`}>
                    {col.title} ({colTasks.length})
                  </div>

                  <Droppable droppableId={col.id}>
                    {(provided, snapshot) => (
                      <div
                        ref={provided.innerRef}
                        {...provided.droppableProps}
                        className={`flex-1 p-3 border border-dashed rounded-b-xl border-border-stitch flex flex-col gap-3 transition-colors ${snapshot.isDraggingOver ? 'bg-accent/5 border-accent/40' : 'bg-background-surface/30'}`}
                      >
                        {colTasks.map((t, index) => (
                          <Draggable key={t.id} draggableId={t.id} index={index}>
                            {(provided, snapshot) => (
                              <div
                                ref={provided.innerRef}
                                {...provided.draggableProps}
                                {...provided.dragHandleProps}
                                className={`
                                  p-4 rounded-xl border bg-background-surface transition-all duration-200
                                  ${snapshot.isDragging ? 'shadow-floating border-accent bg-woven-grid scale-105' : 'border-border-stitch hover:border-accent/40 shadow-orbital'}
                                `}
                              >
                                <div className="flex justify-between items-start gap-2">
                                  <h4 className="text-xs font-bold text-text-primary uppercase leading-tight truncate">
                                    {t.title}
                                  </h4>
                                  <button
                                    onClick={() => handleToggleComplete(t.id, t.completed)}
                                    className="text-base text-accent focus:outline-none shrink-0"
                                  >
                                    {t.completed ? <IoCheckmarkCircleOutline className="text-green-500" /> : <IoEllipseOutline />}
                                  </button>
                                </div>
                                <p className="text-[10px] text-text-secondary mt-1.5 line-clamp-2 leading-relaxed">{t.description}</p>

                                <div className="flex items-center justify-between gap-2 mt-4 pt-3 border-t border-dashed border-border-stitch/60 text-[8px] font-mono-stats">
                                  <span className="font-bold bg-accent/10 text-accent px-1.5 py-0.5 rounded uppercase">
                                    {t.category}
                                  </span>
                                  <span className="text-text-secondary/70">{t.dueDate}</span>
                                </div>

                                <div className="flex justify-end gap-1.5 mt-3 pt-1 text-[9px] font-bold">
                                  <button
                                    onClick={() => handleOpenEditModal(t)}
                                    className="text-text-secondary hover:text-accent font-mono-stats uppercase"
                                  >
                                    Edit
                                  </button>
                                  <span className="text-border-stitch">|</span>
                                  <button
                                    onClick={() => handleDeleteTask(t.id)}
                                    className="text-text-secondary hover:text-red-500 font-mono-stats uppercase"
                                  >
                                    Purge
                                  </button>
                                </div>
                              </div>
                            )}
                          </Draggable>
                        ))}
                        {provided.placeholder}
                      </div>
                    )}
                  </Droppable>
                </div>
              );
            })}
          </div>
        </DragDropContext>
      )}

      {/* Sketch Modal for creating/updating task records */}
      {modalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 px-4">
          <div
            className="w-full max-w-md bg-background-surface border-4 border-double border-accent rounded-2xl p-6 relative shadow-floating animate-fadeIn"
            style={{ clipPath: 'polygon(1% 0%, 99% 1%, 98% 99%, 0% 98%)' }}
          >
            <div className="absolute inset-1.5 border border-dashed border-accent/40 rounded-xl pointer-events-none"></div>

            <div className="text-center mb-6">
              <span className="text-[10px] font-bold tracking-wider text-accent uppercase font-mono-stats">
                {editingTask ? 'EDIT CANVAS NODE' : 'SKETCH NEW NODE'}
              </span>
              <h3 className="text-sm font-bold text-text-primary uppercase mt-1">
                {editingTask ? 'Modify Task Details' : 'Design Target Thread Goal'}
              </h3>
            </div>

            <form onSubmit={handleCreateOrEditTask} className="space-y-4 relative z-10 text-xs">
              <div>
                <label className="block text-[10px] font-bold text-text-secondary uppercase mb-1 tracking-wide">
                  Task Title
                </label>
                <input
                  type="text"
                  required
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  placeholder="Task Name"
                  className="w-full p-2.5 rounded-lg bg-background-primary border border-border-stitch text-text-primary focus:outline-none focus:border-accent"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-text-secondary uppercase mb-1 tracking-wide">
                  Description
                </label>
                <textarea
                  value={formDesc}
                  onChange={(e) => setFormDesc(e.target.value)}
                  rows={2}
                  placeholder="Description of target thread..."
                  className="w-full p-2.5 rounded-lg bg-background-primary border border-border-stitch text-text-primary focus:outline-none focus:border-accent resize-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold text-text-secondary uppercase mb-1 tracking-wide">
                    Category Focus
                  </label>
                  <select
                    value={formCategory}
                    onChange={(e) => setFormCategory(e.target.value)}
                    className="w-full p-2.5 rounded-lg bg-background-primary border border-border-stitch text-text-primary focus:outline-none focus:border-accent"
                  >
                    {categories.map((c) => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-text-secondary uppercase mb-1 tracking-wide">
                    Priority Weight
                  </label>
                  <select
                    value={formPriority}
                    onChange={(e) => setFormPriority(e.target.value as any)}
                    className="w-full p-2.5 rounded-lg bg-background-primary border border-border-stitch text-text-primary focus:outline-none focus:border-accent"
                  >
                    <option value="low">Low Priority</option>
                    <option value="medium">Medium Priority</option>
                    <option value="high">High Priority</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold text-text-secondary uppercase mb-1 tracking-wide">
                    Due Date
                  </label>
                  <input
                    type="date"
                    required
                    value={formDueDate}
                    onChange={(e) => setFormDueDate(e.target.value)}
                    className="w-full p-2.5 rounded-lg bg-background-primary border border-border-stitch text-text-primary focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-text-secondary uppercase mb-1 tracking-wide">
                    Due Time
                  </label>
                  <input
                    type="time"
                    required
                    value={formDueTime}
                    onChange={(e) => setFormDueTime(e.target.value)}
                    className="w-full p-2.5 rounded-lg bg-background-primary border border-border-stitch text-text-primary focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-text-secondary uppercase mb-1 tracking-wide">
                  Recurring Loop
                </label>
                <select
                  value={formRecurring}
                  onChange={(e) => setFormRecurring(e.target.value as any)}
                  className="w-full p-2.5 rounded-lg bg-background-primary border border-border-stitch text-text-primary focus:outline-none focus:border-accent"
                >
                  <option value="none">No Recurrence</option>
                  <option value="daily">Daily Loop</option>
                  <option value="weekly">Weekly Loop</option>
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-text-secondary uppercase mb-1 tracking-wide">
                  Stitch Status (Lane)
                </label>
                <select
                  value={formColumnId}
                  onChange={(e) => setFormColumnId(e.target.value as any)}
                  className="w-full p-2.5 rounded-lg bg-background-primary border border-border-stitch text-text-primary focus:outline-none focus:border-accent font-bold"
                >
                  <option value="todo">Need to Sew (New)</option>
                  <option value="in_progress">Stitching In Progress</option>
                  <option value="done">Finished Stitches (Complete)</option>
                </select>
              </div>

              <div className="flex gap-3 pt-3 border-t border-dashed border-border-stitch mt-4 justify-end">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="px-4 py-2 bg-background-primary border border-border-stitch rounded-lg font-bold text-text-secondary uppercase font-mono-stats"
                >
                  Discard
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 bg-accent border border-white text-white rounded-lg font-extrabold uppercase shadow-orbital"
                >
                  {editingTask ? 'Save Settings' : 'Sketch Thread'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};

export default Tasks;
