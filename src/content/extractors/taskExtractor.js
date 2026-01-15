// Task extractor for Salesforce Lightning
// Extends BaseExtractor with Task-specific logic

import { BaseExtractor } from './baseExtractor.js';

export class TaskExtractor extends BaseExtractor {
  constructor() {
    super('Task');
  }

  extract(rawData) {
    if (!rawData) return null;

    const record = this.normalizeRecord(rawData);

    // Task-specific validations
    if (!this.validateTaskRecord(record)) {
      return null;
    }

    return record;
  }

  validateTaskRecord(record) {
    // Call parent validation
    if (!super.validateRecord(record)) return false;

    // Tasks should have a subject
    if (!record.subject) {
      console.warn('Task record missing subject');
      return false;
    }

    return true;
  }

  getRequiredFields() {
    return ['id', 'subject'];
  }

  getFieldMappings() {
    const baseMappings = super.getFieldMappings();
    return {
      ...baseMappings,
      // Task-specific mappings
      'whoid': 'whoId',
      'whoname': 'whoName',
      'whatid': 'whatId',
      'whatname': 'whatName',
      'subject': 'subject',
      'status': 'status',
      'priority': 'priority',
      'activitydate': 'activityDate',
      'duedate': 'dueDate',
      'reminderdatetime': 'reminderDateTime',
      'isremindersent': 'isReminderSent',
      'description': 'description',
      'type': 'type',
      'tasksubtype': 'taskSubtype',
      'ownerid': 'ownerId',
      'owner_name': 'ownerName',
      'createdbyid': 'createdById',
      'createdby_name': 'createdByName',
      'lastmodifiedbyid': 'lastModifiedById',
      'lastmodifiedby_name': 'lastModifiedByName',
      'accountid': 'accountId',
      'account_name': 'accountName',
      'isclosed': 'isClosed',
      'isarchived': 'isArchived',
      'calltype': 'callType',
      'calldurationinseconds': 'callDurationInSeconds',
      'callobject': 'callObject'
    };
  }

  // Process task-specific data transformations
  normalizeRecord(record) {
    const normalized = super.normalizeRecord(record);

    // Parse dates
    if (normalized.activityDate) {
      normalized.activityDate = this.parseDate(normalized.activityDate);
    }

    if (normalized.dueDate) {
      normalized.dueDate = this.parseDate(normalized.dueDate);
    }

    if (normalized.reminderDateTime) {
      normalized.reminderDateTime = this.parseDate(normalized.reminderDateTime);
    }

    // Parse call duration
    if (normalized.callDurationInSeconds) {
      normalized.callDurationInSeconds = parseInt(normalized.callDurationInSeconds.toString().replace(/[^0-9]/g, '')) || null;
    }

    // Standardize status
    if (normalized.status) {
      normalized.status = this.standardizeStatus(normalized.status);
    }

    // Standardize priority
    if (normalized.priority) {
      normalized.priority = this.standardizePriority(normalized.priority);
    }

    // Standardize type
    if (normalized.type) {
      normalized.type = this.standardizeTaskType(normalized.type);
    }

    // Set boolean flags
    normalized.isClosed = this.isClosedStatus(normalized.status);
    normalized.isArchived = normalized.isArchived === 'true' || normalized.isArchived === true;

    return normalized;
  }

  standardizeStatus(status) {
    if (!status) return null;

    const statusMap = {
      'not started': 'Not Started',
      'not_started': 'Not Started',
      'in progress': 'In Progress',
      'in_progress': 'In Progress',
      'completed': 'Completed',
      'waiting on someone else': 'Waiting on someone else',
      'waiting_on_someone_else': 'Waiting on someone else',
      'deferred': 'Deferred'
    };

    const cleanStatus = status.toString().toLowerCase().trim();
    return statusMap[cleanStatus] || status;
  }

  standardizePriority(priority) {
    if (!priority) return null;

    const priorityMap = {
      'high': 'High',
      'normal': 'Normal',
      'low': 'Low'
    };

    const cleanPriority = priority.toString().toLowerCase().trim();
    return priorityMap[cleanPriority] || priority;
  }

  standardizeTaskType(type) {
    if (!type) return null;

    const typeMap = {
      'call': 'Call',
      'meeting': 'Meeting',
      'email': 'Email',
      'task': 'Task',
      'event': 'Event',
      'other': 'Other'
    };

    const cleanType = type.toString().toLowerCase().trim();
    return typeMap[cleanType] || type;
  }

  isClosedStatus(status) {
    if (!status) return false;

    const closedStatuses = ['completed'];
    return closedStatuses.includes(status.toLowerCase());
  }

  // Calculate task metrics
  calculateTaskMetrics(tasks) {
    const metrics = {
      totalCount: tasks.length,
      completedCount: 0,
      overdueCount: 0,
      todayCount: 0,
      upcomingCount: 0,
      byStatus: {},
      byPriority: {},
      byType: {}
    };

    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    tasks.forEach(task => {
      // Count by status
      const status = task.status || 'Unknown';
      metrics.byStatus[status] = (metrics.byStatus[status] || 0) + 1;

      // Count by priority
      const priority = task.priority || 'Normal';
      metrics.byPriority[priority] = (metrics.byPriority[priority] || 0) + 1;

      // Count by type
      const type = task.type || 'Task';
      metrics.byType[type] = (metrics.byType[type] || 0) + 1;

      // Count completed
      if (task.isClosed) {
        metrics.completedCount++;
      }

      // Check dates
      if (task.dueDate) {
        const dueDate = new Date(task.dueDate);
        const dueDateOnly = new Date(dueDate.getFullYear(), dueDate.getMonth(), dueDate.getDate());

        if (dueDateOnly < today) {
          metrics.overdueCount++;
        } else if (dueDateOnly.getTime() === today.getTime()) {
          metrics.todayCount++;
        } else {
          metrics.upcomingCount++;
        }
      }
    });

    return metrics;
  }
}

// Factory function for creating task extractors
export function createTaskExtractor() {
  return new TaskExtractor();
}