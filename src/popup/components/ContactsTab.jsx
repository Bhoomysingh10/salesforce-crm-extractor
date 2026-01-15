import React, { useState } from 'react';
import { RecordCard } from './RecordCard';
import { SearchFilter } from './SearchFilter';

export function ContactsTab({ data, onDelete }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('name');

  const filteredData = data.filter(contact => {
    const searchLower = searchTerm.toLowerCase();
    const fullName = `${contact.firstName || ''} ${contact.lastName || ''}`.trim();
    return (
      (fullName && fullName.toLowerCase().includes(searchLower)) ||
      (contact.email && contact.email.toLowerCase().includes(searchLower)) ||
      (contact.accountName && contact.accountName.toLowerCase().includes(searchLower)) ||
      (contact.phone && contact.phone.includes(searchTerm))
    );
  }).sort((a, b) => {
    if (sortBy === 'name') {
      const nameA = `${a.firstName || ''} ${a.lastName || ''}`.trim();
      const nameB = `${b.firstName || ''} ${b.lastName || ''}`.trim();
      return nameA.localeCompare(nameB);
    }
    if (sortBy === 'account') {
      return (a.accountName || '').localeCompare(b.accountName || '');
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
          { value: 'account', label: 'Account' },
          { value: 'createdDate', label: 'Date Created' }
        ]}
      />

      <div className="space-y-2 mt-4">
        {filteredData.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            No contacts found
          </div>
        ) : (
          filteredData.map(contact => (
            <RecordCard
              key={contact.id}
              record={contact}
              onDelete={() => onDelete('contacts', contact.id)}
              fields={[
                { label: 'Name', value: `${contact.firstName || ''} ${contact.lastName || ''}`.trim() },
                { label: 'Email', value: contact.email },
                { label: 'Phone', value: contact.phone },
                { label: 'Account', value: contact.accountName },
                { label: 'Title', value: contact.title }
              ]}
            />
          ))
        )}
      </div>
    </div>
  );
}