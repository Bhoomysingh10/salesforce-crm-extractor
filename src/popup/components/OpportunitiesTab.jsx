import React, { useState } from 'react';
import { RecordCard } from './RecordCard';
import { SearchFilter } from './SearchFilter';
import { StagesPipeline } from './StagesPipeline';

export function OpportunitiesTab({ data, stages, onDelete }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('name');
  const [filterStage, setFilterStage] = useState('all');

  const filteredData = data.filter(opportunity => {
    const searchLower = searchTerm.toLowerCase();
    const matchesSearch = (
      (opportunity.name && opportunity.name.toLowerCase().includes(searchLower)) ||
      (opportunity.accountName && opportunity.accountName.toLowerCase().includes(searchLower))
    );

    const matchesStage = filterStage === 'all' ||
      (opportunity.stage && opportunity.stage.toLowerCase().replace(/\s+/g, '') === filterStage);

    return matchesSearch && matchesStage;
  }).sort((a, b) => {
    if (sortBy === 'name') {
      return (a.name || '').localeCompare(b.name || '');
    }
    if (sortBy === 'amount') {
      return (b.amount || 0) - (a.amount || 0);
    }
    if (sortBy === 'closeDate') {
      return new Date(a.closeDate || '9999-12-31') - new Date(b.closeDate || '9999-12-31');
    }
    if (sortBy === 'stage') {
      return (a.stage || '').localeCompare(b.stage || '');
    }
    return 0;
  });

  return (
    <div>
      <StagesPipeline
        stages={stages}
        activeFilter={filterStage}
        onFilterChange={setFilterStage}
      />

      <SearchFilter
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
        sortBy={sortBy}
        setSortBy={setSortBy}
        sortOptions={[
          { value: 'name', label: 'Name' },
          { value: 'amount', label: 'Amount' },
          { value: 'closeDate', label: 'Close Date' },
          { value: 'stage', label: 'Stage' }
        ]}
      />

      <div className="space-y-2 mt-4">
        {filteredData.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            No opportunities found
          </div>
        ) : (
          filteredData.map(opportunity => (
            <RecordCard
              key={opportunity.id}
              record={opportunity}
              onDelete={() => onDelete('opportunities', opportunity.id)}
              fields={[
                { label: 'Name', value: opportunity.name },
                { label: 'Account', value: opportunity.accountName },
                { label: 'Amount', value: opportunity.amount ? `$${opportunity.amount.toLocaleString()}` : null },
                { label: 'Stage', value: opportunity.stage },
                { label: 'Close Date', value: opportunity.closeDate ? new Date(opportunity.closeDate).toLocaleDateString() : null }
              ]}
            />
          ))
        )}
      </div>
    </div>
  );
}