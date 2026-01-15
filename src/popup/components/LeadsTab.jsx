import React, { useState } from 'react';
import { RecordCard } from './RecordCard';
import { SearchFilter } from './SearchFilter';

export function LeadsTab({ data, onDelete }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('name');

  const filteredData = data.filter(lead => {
    const searchLower = searchTerm.toLowerCase();
    return (
      (lead.name && lead.name.toLowerCase().includes(searchLower)) ||
      (lead.email && lead.email.toLowerCase().includes(searchLower)) ||
      (lead.company && lead.company.toLowerCase().includes(searchLower)) ||
      (lead.phone && lead.phone.includes(searchTerm))
    );
  }).sort((a, b) => {
    if (sortBy === 'name') {
      return (a.name || '').localeCompare(b.name || '');
    }
    if (sortBy === 'company') {
      return (a.company || '').localeCompare(b.company || '');
    }
    if (sortBy === 'createdDate') {
      return new Date(b.createdDate || 0) - new Date(a.createdDate || 0);
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
          { value: 'name', label: 'Name' },
          { value: 'company', label: 'Company' },
          { value: 'createdDate', label: 'Date Created' }
        ]}
      />

      <div className="space-y-2 mt-4">
        {filteredData.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            No leads found
          </div>
        ) : (
          filteredData.map(lead => (
            <RecordCard
              key={lead.id}
              record={lead}
              onDelete={() => onDelete('leads', lead.id)}
              fields={[
                { label: 'Name', value: lead.name },
                { label: 'Email', value: lead.email },
                { label: 'Phone', value: lead.phone },
                { label: 'Company', value: lead.company },
                { label: 'Status', value: lead.status }
              ]}
            />
          ))
        )}
      </div>
    </div>
  );
}