// Deduplication utilities for Salesforce records

// Merge records from multiple sources, handling duplicates and updates
export function mergeRecords(existingRecords, newRecords) {
  const recordMap = new Map();

  // Index existing records by ID
  existingRecords.forEach(record => {
    if (record.id) {
      recordMap.set(record.id, record);
    }
  });

  // Process new records
  newRecords.forEach(newRecord => {
    if (!newRecord.id) {
      // Skip records without IDs
      return;
    }

    const existing = recordMap.get(newRecord.id);

    if (existing) {
      // Update existing record with newer data
      recordMap.set(newRecord.id, mergeRecordData(existing, newRecord));
    } else {
      // Add new record
      recordMap.set(newRecord.id, {
        ...newRecord,
        createdAt: Date.now()
      });
    }
  });

  return Array.from(recordMap.values());
}

// Merge data from two records of the same ID
function mergeRecordData(existing, incoming) {
  const merged = { ...existing };

  // Update fields from incoming record
  Object.keys(incoming).forEach(key => {
    if (incoming[key] !== null && incoming[key] !== undefined && incoming[key] !== '') {
      merged[key] = incoming[key];
    }
  });

  // Update metadata
  merged.updatedAt = Date.now();
  merged.lastSource = incoming.source || 'unknown';

  return merged;
}

// Find potential duplicates based on similarity
export function findPotentialDuplicates(records, similarityThreshold = 0.8) {
  const duplicates = [];

  for (let i = 0; i < records.length; i++) {
    for (let j = i + 1; j < records.length; j++) {
      const similarity = calculateRecordSimilarity(records[i], records[j]);
      if (similarity >= similarityThreshold) {
        duplicates.push({
          record1: records[i],
          record2: records[j],
          similarity: similarity
        });
      }
    }
  }

  return duplicates;
}

// Calculate similarity between two records
function calculateRecordSimilarity(record1, record2) {
  let totalScore = 0;
  let fieldCount = 0;

  // Compare common fields
  const fieldsToCompare = ['name', 'email', 'phone', 'company', 'accountName'];

  fieldsToCompare.forEach(field => {
    const value1 = record1[field];
    const value2 = record2[field];

    if (value1 && value2) {
      const similarity = calculateStringSimilarity(
        value1.toString().toLowerCase(),
        value2.toString().toLowerCase()
      );
      totalScore += similarity;
      fieldCount++;
    }
  });

  return fieldCount > 0 ? totalScore / fieldCount : 0;
}

// Calculate string similarity using Levenshtein distance
function calculateStringSimilarity(str1, str2) {
  const longer = str1.length > str2.length ? str1 : str2;
  const shorter = str1.length > str2.length ? str2 : str1;

  if (longer.length === 0) return 1.0;

  const distance = levenshteinDistance(longer, shorter);
  return (longer.length - distance) / longer.length;
}

// Calculate Levenshtein distance between two strings
function levenshteinDistance(str1, str2) {
  const matrix = [];

  for (let i = 0; i <= str2.length; i++) {
    matrix[i] = [i];
  }

  for (let j = 0; j <= str1.length; j++) {
    matrix[0][j] = j;
  }

  for (let i = 1; i <= str2.length; i++) {
    for (let j = 1; j <= str1.length; j++) {
      if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1, // substitution
          matrix[i][j - 1] + 1,     // insertion
          matrix[i - 1][j] + 1      // deletion
        );
      }
    }
  }

  return matrix[str2.length][str1.length];
}

// Remove exact duplicates
export function removeExactDuplicates(records) {
  const seen = new Set();
  return records.filter(record => {
    const key = record.id || JSON.stringify(record);
    if (seen.has(key)) {
      return false;
    }
    seen.add(key);
    return true;
  });
}

// Clean records by removing invalid entries
export function cleanRecords(records) {
  return records.filter(record => {
    // Must have an ID
    if (!record.id) return false;

    // Must have some meaningful data
    const hasData = record.name || record.email || record.phone || record.subject;
    if (!hasData) return false;

    // Check for obviously invalid data
    if (record.email && !isValidEmail(record.email)) {
      delete record.email;
    }

    return true;
  });
}

// Basic email validation
function isValidEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

// Group records by similarity clusters
export function groupSimilarRecords(records, threshold = 0.8) {
  const groups = [];
  const processed = new Set();

  records.forEach((record, index) => {
    if (processed.has(index)) return;

    const group = [record];
    processed.add(index);

    // Find similar records
    for (let j = index + 1; j < records.length; j++) {
      if (processed.has(j)) continue;

      const similarity = calculateRecordSimilarity(record, records[j]);
      if (similarity >= threshold) {
        group.push(records[j]);
        processed.add(j);
      }
    }

    if (group.length > 1) {
      groups.push(group);
    }
  });

  return groups;
}