'use client';

import { useState, useEffect } from 'react';
import {
  X, Plus, Trash2, Calendar, Tag, AlertCircle, CheckSquare,
  MessageSquare, History, FileText, Send, Link2, ExternalLink,
  Clock, User, CheckCircle2, ArrowRightLeft, Sparkles, Loader2
} from 'lucide-react';
import appConfig from '@/data/appConfig.json';

const STATUS_ENTRIES = Object.entries(appConfig.statuses);
const PRIORITY_ENTRIES = Object.entries(appConfig.priorities);

function formatTimestamp(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  const now = new Date();
  const diffSec = Math.floor((now - d) / 1000);

  if (diffSec < 60) return 'Just now';
  if (diffSec < 3600) return `${Math.floor(diffSec / 60)}m ago`;
  if (diffSec < 86400) return `${Math.floor(diffSec / 3600)}h ago`;
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
}

export default function TaskModal({ isOpen, onClose, onSave, taskToEdit, initialStatus = 'todo' }) {
  const [activeTab, setActiveTab] = useState('details'); // 'details' | 'comments' | 'activity'
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [status, setStatus] = useState('todo');
  const [priority, setPriority] = useState('medium');
  const [dueDate, setDueDate] = useState('');
  const [tagsInput, setTagsInput] = useState('');
  const [subtasks, setSubtasks] = useState([]);
  const [newSubtaskTitle, setNewSubtaskTitle] = useState('');
  
  // Links state
  const [links, setLinks] = useState([]);
  const [newLinkTitle, setNewLinkTitle] = useState('');
  const [newLinkUrl, setNewLinkUrl] = useState('');
  const [isAddingLink, setIsAddingLink] = useState(false);

  // Comments state
  const [comments, setComments] = useState([]);
  const [newCommentText, setNewCommentText] = useState('');
  const [isPostingComment, setIsPostingComment] = useState(false);

  // Activity Log state
  const [activityLog, setActivityLog] = useState([]);

  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (taskToEdit) {
      setTitle(taskToEdit.title || '');
      setDescription(taskToEdit.description || '');
      setStatus(taskToEdit.status || 'todo');
      setPriority(taskToEdit.priority || 'medium');
      setDueDate(
        taskToEdit.dueDate
          ? new Date(taskToEdit.dueDate).toISOString().split('T')[0]
          : ''
      );
      setTagsInput(taskToEdit.tags ? taskToEdit.tags.join(', ') : '');
      setSubtasks(taskToEdit.subtasks || []);
      setLinks(taskToEdit.links || []);
      setComments(taskToEdit.comments || []);
      setActivityLog(taskToEdit.activityLog || []);
    } else {
      setTitle('');
      setDescription('');
      setStatus(initialStatus);
      setPriority('medium');
      setDueDate('');
      setTagsInput('');
      setSubtasks([]);
      setLinks([]);
      setComments([]);
      setActivityLog([]);
    }
    setActiveTab('details');
    setError('');
  }, [taskToEdit, initialStatus, isOpen]);

  if (!isOpen) return null;

  // ── Subtasks Handlers ──────────────────────────────────────
  const handleAddSubtask = (e) => {
    e?.preventDefault();
    if (!newSubtaskTitle.trim()) return;
    setSubtasks([...subtasks, { title: newSubtaskTitle.trim(), completed: false }]);
    setNewSubtaskTitle('');
  };

  const handleToggleSubtask = (index) => {
    const updated = [...subtasks];
    updated[index].completed = !updated[index].completed;
    setSubtasks(updated);
  };

  const handleRemoveSubtask = (index) => {
    setSubtasks(subtasks.filter((_, i) => i !== index));
  };

  // ── Links Handlers ─────────────────────────────────────────
  const handleAddLink = (e) => {
    e?.preventDefault();
    if (!newLinkTitle.trim() || !newLinkUrl.trim()) return;
    let url = newLinkUrl.trim();
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      url = 'https://' + url;
    }
    setLinks([...links, { title: newLinkTitle.trim(), url }]);
    setNewLinkTitle('');
    setNewLinkUrl('');
    setIsAddingLink(false);
  };

  const handleRemoveLink = (index) => {
    setLinks(links.filter((_, i) => i !== index));
  };

  // ── Comments Handlers ──────────────────────────────────────
  const handlePostComment = async (e) => {
    e?.preventDefault();
    if (!newCommentText.trim() || isPostingComment) return;

    if (!taskToEdit?._id) {
      // Offline mode for newly creating task: add to local state
      const tempComment = {
        _id: 'temp_' + Date.now(),
        userName: 'You',
        text: newCommentText.trim(),
        createdAt: new Date(),
      };
      setComments([...comments, tempComment]);
      setNewCommentText('');
      return;
    }

    setIsPostingComment(true);
    try {
      const res = await fetch(`/api/tasks/${taskToEdit._id}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: newCommentText.trim() }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error || 'Failed to post comment');

      setComments(data.data.comments || []);
      setActivityLog(data.data.activityLog || []);
      setNewCommentText('');
    } catch (err) {
      setError(err.message);
    } finally {
      setIsPostingComment(false);
    }
  };

  const handleDeleteComment = async (commentId) => {
    if (!taskToEdit?._id) {
      setComments(comments.filter((c) => c._id !== commentId));
      return;
    }

    try {
      const res = await fetch(`/api/tasks/${taskToEdit._id}/comments?commentId=${commentId}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error || 'Failed to delete comment');

      setComments(data.data.comments || []);
    } catch (err) {
      setError(err.message);
    }
  };

  // ── Submit Modal ───────────────────────────────────────────
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title.trim()) {
      setError('Task title is required.');
      return;
    }

    setIsSubmitting(true);
    setError('');

    const formattedTags = tagsInput
      .split(',')
      .map((t) => t.trim())
      .filter((t) => t.length > 0);

    const taskData = {
      title: title.trim(),
      description: description.trim(),
      status,
      priority,
      dueDate: dueDate ? new Date(dueDate).toISOString() : null,
      tags: formattedTags,
      subtasks,
      links,
    };

    try {
      await onSave(taskData, taskToEdit?._id);
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to save task.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-box modal-box-lg p-0 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b" style={{ borderColor: 'var(--border)' }}>
          <div className="flex items-center gap-3">
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
              style={{ background: 'linear-gradient(135deg, #2563eb, #06b6d4)' }}
            >
              <FileText className="w-4 h-4 text-white" />
            </div>
            <div>
              <h2 className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
                {taskToEdit ? 'Task Details' : 'Create New Task'}
              </h2>
              <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                {taskToEdit ? `ID: #${taskToEdit._id?.substring(0, 8)}` : 'Add task details, checklist, links & notes'}
              </p>
            </div>
          </div>
          <button onClick={onClose} className="btn-icon">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab Navigation (Details, Comments, Activity History) */}
        <div className="flex border-b px-6 bg-[var(--bg-secondary)]" style={{ borderColor: 'var(--border)' }}>
          {[
            { id: 'details', label: 'Details', icon: FileText, count: null },
            { id: 'comments', label: 'Comments', icon: MessageSquare, count: comments.length },
            { id: 'activity', label: 'Activity History', icon: History, count: activityLog.length },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`py-3 px-3 text-xs font-semibold flex items-center gap-2 border-b-2 transition-all ${
                  isActive
                    ? 'border-blue-500 text-blue-400'
                    : 'border-transparent text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{tab.label}</span>
                {tab.count !== null && tab.count > 0 && (
                  <span
                    className="text-[10px] px-1.5 py-0.2 rounded-full font-mono font-bold"
                    style={{ background: isActive ? 'rgba(37,99,235,0.2)' : 'var(--bg-hover)', color: isActive ? '#60a5fa' : 'var(--text-muted)' }}
                  >
                    {tab.count}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Modal Error Alert */}
        {error && (
          <div
            className="mx-6 mt-4 p-3 rounded-lg text-xs flex items-center gap-2"
            style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', color: '#f87171' }}
          >
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* TAB 1: DETAILS FORM */}
        {activeTab === 'details' && (
          <form onSubmit={handleSubmit} className="overflow-y-auto px-6 py-4 space-y-4 flex-1">
            {/* Title */}
            <div>
              <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>
                Task Title *
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Implement MongoDB schema validation"
                className="input-field"
                required
                autoFocus
              />
            </div>

            {/* Description */}
            <div>
              <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>
                Description
              </label>
              <textarea
                rows={3}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Provide detail instructions, notes, or implementation steps..."
                className="input-field resize-none"
              />
            </div>

            {/* Status & Priority Row */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>
                  Status
                </label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                  className="input-field cursor-pointer"
                >
                  {STATUS_ENTRIES.map(([key, cfg]) => (
                    <option key={key} value={key}>
                      {cfg.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>
                  Priority
                </label>
                <select
                  value={priority}
                  onChange={(e) => setPriority(e.target.value)}
                  className="input-field cursor-pointer"
                >
                  {PRIORITY_ENTRIES.map(([key, cfg]) => (
                    <option key={key} value={key}>
                      {cfg.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Due Date & Tags */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>
                  Due Date
                </label>
                <input
                  type="date"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  className="input-field cursor-pointer"
                />
              </div>

              <div>
                <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>
                  Tags (comma separated)
                </label>
                <input
                  type="text"
                  value={tagsInput}
                  onChange={(e) => setTagsInput(e.target.value)}
                  placeholder="e.g. Next.js, Docker, API"
                  className="input-field"
                />
              </div>
            </div>

            {/* Resource Links / Attachments */}
            <div className="pt-3 border-t" style={{ borderColor: 'var(--border)' }}>
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-medium flex items-center gap-1.5" style={{ color: 'var(--text-secondary)' }}>
                  <Link2 className="w-3.5 h-3.5" />
                  <span>Resource Links ({links.length})</span>
                </label>
                {!isAddingLink && (
                  <button
                    type="button"
                    onClick={() => setIsAddingLink(true)}
                    className="text-[11px] text-blue-400 hover:text-blue-300 font-medium flex items-center gap-1"
                  >
                    <Plus className="w-3 h-3" /> Add Link
                  </button>
                )}
              </div>

              {/* Links list */}
              {links.length > 0 && (
                <div className="space-y-1.5 mb-2.5">
                  {links.map((link, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between p-2 rounded-lg text-xs"
                      style={{ background: 'var(--bg-tertiary)', border: '1px solid var(--border)' }}
                    >
                      <a
                        href={link.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1.5 text-blue-400 hover:underline truncate flex-1 min-w-0"
                      >
                        <ExternalLink className="w-3.5 h-3.5 flex-shrink-0" />
                        <span className="truncate">{link.title}</span>
                      </a>
                      <button
                        type="button"
                        onClick={() => handleRemoveLink(idx)}
                        className="btn-danger-icon w-6 h-6 ml-2"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {/* Add Link Form */}
              {isAddingLink && (
                <div className="p-2.5 rounded-lg border space-y-2 mb-2" style={{ background: 'var(--bg-tertiary)', borderColor: 'var(--border)' }}>
                  <input
                    type="text"
                    value={newLinkTitle}
                    onChange={(e) => setNewLinkTitle(e.target.value)}
                    placeholder="Link Title (e.g. Figma Prototype / GitHub PR)"
                    className="input-field text-xs py-1.5"
                  />
                  <input
                    type="url"
                    value={newLinkUrl}
                    onChange={(e) => setNewLinkUrl(e.target.value)}
                    placeholder="https://..."
                    className="input-field text-xs py-1.5"
                  />
                  <div className="flex justify-end gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => setIsAddingLink(false)}
                      className="btn-secondary text-xs py-1 px-2.5"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={handleAddLink}
                      className="btn-primary text-xs py-1 px-3"
                    >
                      Add
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Subtasks Section */}
            <div className="pt-3 border-t" style={{ borderColor: 'var(--border)' }}>
              <label className="block text-xs font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>
                Subtasks Checklist ({subtasks.filter((s) => s.completed).length}/{subtasks.length})
              </label>

              {/* Subtasks List */}
              {subtasks.length > 0 && (
                <div className="space-y-1.5 mb-3">
                  {subtasks.map((subtask, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between gap-2 p-2 rounded-lg text-xs"
                      style={{ background: 'var(--bg-tertiary)', border: '1px solid var(--border)' }}
                    >
                      <label className="flex items-center gap-2 cursor-pointer flex-1 min-w-0">
                        <input
                          type="checkbox"
                          checked={subtask.completed}
                          onChange={() => handleToggleSubtask(index)}
                          className="rounded cursor-pointer"
                          style={{ accentColor: 'var(--accent-blue)' }}
                        />
                        <span
                          className="truncate"
                          style={{
                            textDecoration: subtask.completed ? 'line-through' : 'none',
                            color: subtask.completed ? 'var(--text-muted)' : 'var(--text-primary)',
                          }}
                        >
                          {subtask.title}
                        </span>
                      </label>
                      <button
                        type="button"
                        onClick={() => handleRemoveSubtask(index)}
                        className="btn-danger-icon w-6 h-6"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {/* Add Subtask Input */}
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newSubtaskTitle}
                  onChange={(e) => setNewSubtaskTitle(e.target.value)}
                  placeholder="Add a new checklist item..."
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddSubtask();
                    }
                  }}
                  className="input-field text-xs py-1.5"
                />
                <button
                  type="button"
                  onClick={handleAddSubtask}
                  className="btn-secondary text-xs py-1.5 px-3 flex-shrink-0"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add</span>
                </button>
              </div>
            </div>

            {/* Modal Footer Actions */}
            <div className="flex items-center justify-end gap-3 pt-4 border-t" style={{ borderColor: 'var(--border)' }}>
              <button
                type="button"
                onClick={onClose}
                className="btn-secondary"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="btn-primary"
              >
                {isSubmitting ? 'Saving...' : taskToEdit ? 'Update Task' : 'Create Task'}
              </button>
            </div>
          </form>
        )}

        {/* TAB 2: COMMENTS THREAD */}
        {activeTab === 'comments' && (
          <div className="flex-1 flex flex-col overflow-hidden p-6">
            {/* Comments List */}
            <div className="flex-1 overflow-y-auto space-y-3 mb-4 pr-1">
              {comments.length === 0 ? (
                <div className="text-center py-12" style={{ color: 'var(--text-muted)' }}>
                  <MessageSquare className="w-8 h-8 mx-auto mb-2 opacity-40" />
                  <p className="text-xs font-medium">No comments yet</p>
                  <p className="text-[11px] mt-1">Start a discussion or leave notes for this task.</p>
                </div>
              ) : (
                comments.map((c, idx) => (
                  <div
                    key={c._id || idx}
                    className="p-3 rounded-lg border group relative"
                    style={{ background: 'var(--bg-tertiary)', borderColor: 'var(--border)' }}
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <div className="flex items-center gap-2">
                        <div
                          className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold text-white"
                          style={{ background: 'linear-gradient(135deg, #3b82f6, #06b6d4)' }}
                        >
                          {c.userName?.[0]?.toUpperCase() || 'U'}
                        </div>
                        <span className="text-xs font-semibold" style={{ color: 'var(--text-primary)' }}>
                          {c.userName}
                        </span>
                        <span className="text-[10px]" style={{ color: 'var(--text-muted)' }}>
                          {formatTimestamp(c.createdAt)}
                        </span>
                      </div>
                      <button
                        onClick={() => handleDeleteComment(c._id)}
                        className="opacity-0 group-hover:opacity-100 btn-danger-icon w-5 h-5 transition-opacity"
                        title="Delete comment"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                    <p className="text-xs leading-relaxed pl-7" style={{ color: 'var(--text-primary)', whiteSpace: 'pre-wrap' }}>
                      {c.text}
                    </p>
                  </div>
                ))
              )}
            </div>

            {/* Comment Input Box */}
            <form onSubmit={handlePostComment} className="pt-3 border-t" style={{ borderColor: 'var(--border)' }}>
              <div className="relative">
                <textarea
                  rows={2}
                  value={newCommentText}
                  onChange={(e) => setNewCommentText(e.target.value)}
                  placeholder="Write a comment or note... (Ctrl+Enter to post)"
                  onKeyDown={(e) => {
                    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
                      e.preventDefault();
                      handlePostComment();
                    }
                  }}
                  className="input-field text-xs py-2 pr-12 resize-none"
                />
                <button
                  type="submit"
                  disabled={!newCommentText.trim() || isPostingComment}
                  className="btn-primary absolute right-2 bottom-2 p-1.5 rounded-md"
                  title="Post comment"
                >
                  {isPostingComment ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Send className="w-3.5 h-3.5" />
                  )}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* TAB 3: ACTIVITY HISTORY TIMELINE */}
        {activeTab === 'activity' && (
          <div className="flex-1 overflow-y-auto p-6">
            {activityLog.length === 0 ? (
              <div className="text-center py-12" style={{ color: 'var(--text-muted)' }}>
                <History className="w-8 h-8 mx-auto mb-2 opacity-40" />
                <p className="text-xs font-medium">No activity recorded yet</p>
              </div>
            ) : (
              <div className="relative pl-6 space-y-4 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-[var(--border)]">
                {[...activityLog].reverse().map((log, idx) => (
                  <div key={idx} className="relative group">
                    {/* Timeline dot */}
                    <div
                      className="absolute -left-6 top-1 w-4 h-4 rounded-full flex items-center justify-center ring-4 ring-[var(--bg-secondary)]"
                      style={{ background: 'var(--accent-blue)', color: '#ffffff' }}
                    >
                      <Clock className="w-2.5 h-2.5" />
                    </div>

                    <div className="card-flat p-2.5 rounded-lg text-xs" style={{ background: 'var(--bg-tertiary)' }}>
                      <div className="flex items-center justify-between mb-0.5">
                        <span className="font-semibold text-blue-400">
                          {log.userName || 'User'}{' '}
                          <span className="font-normal text-[var(--text-secondary)]">{log.action}</span>
                        </span>
                        <span className="text-[10px]" style={{ color: 'var(--text-muted)' }}>
                          {formatTimestamp(log.createdAt)}
                        </span>
                      </div>
                      {log.details && (
                        <p className="text-[11px] mt-0.5" style={{ color: 'var(--text-muted)' }}>
                          {log.details}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
