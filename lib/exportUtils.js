/**
 * Utility to export tasks to CSV and JSON formats
 */

export function exportTasksToJSON(tasks) {
  const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(tasks, null, 2));
  const downloadAnchor = document.createElement('a');
  downloadAnchor.setAttribute('href', dataStr);
  downloadAnchor.setAttribute('download', `tasks_export_${new Date().toISOString().split('T')[0]}.json`);
  document.body.appendChild(downloadAnchor);
  downloadAnchor.click();
  downloadAnchor.remove();
}

export function exportTasksToCSV(tasks) {
  if (!tasks || tasks.length === 0) return;

  const headers = ['Title', 'Description', 'Status', 'Priority', 'Due Date', 'Tags', 'Subtasks Count', 'Completed Subtasks', 'Created At'];
  
  const rows = tasks.map((t) => {
    const completedSubs = t.subtasks?.filter((s) => s.completed).length || 0;
    const totalSubs = t.subtasks?.length || 0;
    const tagsStr = (t.tags || []).join('; ');
    const dueDateStr = t.dueDate ? new Date(t.dueDate).toISOString().split('T')[0] : '';
    const createdStr = t.createdAt ? new Date(t.createdAt).toISOString().split('T')[0] : '';

    return [
      `"${(t.title || '').replace(/"/g, '""')}"`,
      `"${(t.description || '').replace(/"/g, '""')}"`,
      `"${t.status || 'todo'}"`,
      `"${t.priority || 'medium'}"`,
      `"${dueDateStr}"`,
      `"${tagsStr}"`,
      totalSubs,
      completedSubs,
      `"${createdStr}"`,
    ].join(',');
  });

  const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows].join('\n');
  const encodedUri = encodeURI(csvContent);
  const downloadAnchor = document.createElement('a');
  downloadAnchor.setAttribute('href', encodedUri);
  downloadAnchor.setAttribute('download', `tasks_export_${new Date().toISOString().split('T')[0]}.csv`);
  document.body.appendChild(downloadAnchor);
  downloadAnchor.click();
  downloadAnchor.remove();
}
