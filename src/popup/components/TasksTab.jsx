import React, { useState } from 'react';
import { RecordCard } from './RecordCard';
import { SearchFilter } from './SearchFilter';

export function TasksTab({ data, onDelete }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('subject');

  const filteredData = data.filter(task => {
    const searchLower = searchTerm.toLowerCase();
    return (
      (task.subject && task.subject.toLowerCase().includes(searchLower)) ||
      (task.status && task.status.toLowerCase().includes(searchLower)) ||
      (task.priority && task.priority.toLowerCase().includes(searchLower))
    );
  }).sort((a, b) => {
    if (sortBy === 'subject') {
      return (a.subject || '').localeCompare(b.subject || '');
    }
    if (sortBy === 'dueDate') {
      return new Date(a.dueDate || '9999-12-31') - new Date(b.dueDate || '9999-12-31');
    }
    if (sortBy === 'status') {
      return (a.status || '').localeCompare(b.status || '');
    }
    if (sortBy === 'priority') {
      const priorityOrder = { 'High': 3, 'Normal': 2, 'Low': 1 };
      return (priorityOrder[b.priority] || 0) - (priorityOrder[a.priority] || 0);
    }
    return 0;
  });

  return (
    <div>
      <SearchFilter
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
        sortBy={sortBy}
        setSortBy={setSortBy}
        sortOptions={[
          { value: 'subject', label: 'Subject' },
          { value: 'dueDate', label: 'Due Date' },
          { value: 'status', label: 'Status' },
          { value: 'priority', label: 'Priority' }
        ]}
      />

      <div className="space-y-2 mt-4">
        {filteredData.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            No tasks found
          </div>
        ) : (
          filteredData.map(task => (
            <RecordCard
              key={task.id}
              record={task}
              onDelete={() => onDelete('tasks', task.id)}
              fields={[
                { label: 'Subject', value: task.subject },
                { label: 'Status', value: task.status },
                { label: 'Priority', value: task.priority },
                { label: 'Due Date', value: task.dueDate ? new Date(task.dueDate).toLocaleDateString() : null },
                { label: 'Related To', value: task.whatName || task.whoName }
              ]}
            />
          ))
        )}
      </div>
    </div>
  );
}