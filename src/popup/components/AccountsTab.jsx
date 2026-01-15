import React, { useState } from 'react';
import { RecordCard } from './RecordCard';
import { SearchFilter } from './SearchFilter';

export function AccountsTab({ data, onDelete }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('name');

  const filteredData = data.filter(account => {
    const searchLower = searchTerm.toLowerCase();
    return (
      (account.name && account.name.toLowerCase().includes(searchLower)) ||
      (account.phone && account.phone.includes(searchTerm)) ||
      (account.industry && account.industry.toLowerCase().includes(searchLower)) ||
      (account.website && account.website.toLowerCase().includes(searchLower))
    );
  }).sort((a, b) => {
    if (sortBy === 'name') {
      return (a.name || '').localeCompare(b.name || '');
    }
    if (sortBy === 'industry') {
      return (a.industry || '').localeCompare(b.industry || '');
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
          { value: 'industry', label: 'Industry' },
          { value: 'createdDate', label: 'Date Created' }
        ]}
      />

      <div className="space-y-2 mt-4">
        {filteredData.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            No accounts found
          </div>
        ) : (
          filteredData.map(account => (
            <RecordCard
              key={account.id}
              record={account}
              onDelete={() => onDelete('accounts', account.id)}
              fields={[
                { label: 'Name', value: account.name },
                { label: 'Phone', value: account.phone },
                { label: 'Industry', value: account.industry },
                { label: 'Website', value: account.website },
                { label: 'Type', value: account.type }
              ]}
            />
          ))
        )}
      </div>
    </div>
  );
}