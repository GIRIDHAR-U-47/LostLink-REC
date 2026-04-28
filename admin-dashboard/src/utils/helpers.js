import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import utc from 'dayjs/plugin/utc';
import localizedFormat from 'dayjs/plugin/localizedFormat';

dayjs.extend(relativeTime);
dayjs.extend(utc);
dayjs.extend(localizedFormat);

/**
 * Format a UTC timestamp to a human-readable local date/time string.
 * e.g., "Mar 22, 2026 9:17 PM"
 */
export const formatDateTime = (dateStr) => {
    if (!dateStr) return 'N/A';
    return dayjs.utc(dateStr).local().format('MMM D, YYYY h:mm A');
};

/**
 * Format to date only.
 * e.g., "Mar 22, 2026"
 */
export const formatDate = (dateStr) => {
    if (!dateStr) return 'N/A';
    return dayjs.utc(dateStr).local().format('MMM D, YYYY');
};

/**
 * Format to time only.
 * e.g., "9:17 PM"
 */
export const formatTime = (dateStr) => {
    if (!dateStr) return 'N/A';
    return dayjs.utc(dateStr).local().format('h:mm A');
};

/**
 * Get relative time label for recency display.
 * e.g., "2 hours ago", "3 days ago"
 */
export const getRelativeTime = (dateStr) => {
    if (!dateStr) return 'N/A';
    return dayjs.utc(dateStr).local().fromNow();
};

/**
 * Get a short tracking ID from a Mongo _id or tracking field.
 * Prefers Found_ID or Lost_ID, falls back to last 6 chars of _id.
 */
export const getTrackingId = (item) => {
    if (item.Found_ID) return item.Found_ID;
    if (item.Lost_ID) return item.Lost_ID;
    const rawId = item.id || item._id || '';
    return rawId ? rawId.slice(-6).toUpperCase() : 'N/A';
};

/**
 * Get the usable item ID (handles both `id` and `_id` from Mongo)
 */
export const getItemId = (item) => {
    return item.id || item._id;
};

/**
 * Backend categories — single source of truth matching the backend enum.
 * Rather than hardcoding in every page, components import from here.
 * If a /categories API is available, components should prefer that.
 */
export const CATEGORIES = [
    'DOCUMENTS',
    'DEVICES',
    'ACCESSORIES',
    'PERSONAL_ITEMS',
    'KEYS',
    'BOOKS',
    'JEWELLERY',
    'OTHERS',
];

/**
 * Map status codes to human-friendly badge styles.
 */
export const getStatusBadge = (status) => {
    const map = {
        PENDING:   { bg: '#fef3c7', color: '#d97706', label: 'Pending' },
        AVAILABLE: { bg: '#d1fae5', color: '#059669', label: 'Available' },
        RETURNED:  { bg: '#dbeafe', color: '#1d4ed8', label: 'Returned' },
        RESOLVED:  { bg: '#dbeafe', color: '#1d4ed8', label: 'Resolved' },
        CLAIMED:   { bg: '#ede9fe', color: '#6d28d9', label: 'Claimed' },
        ARCHIVED:  { bg: '#f1f5f9', color: '#475569', label: 'Archived' },
        DISPOSED:  { bg: '#fee2e2', color: '#dc2626', label: 'Disposed' },
        OPEN:      { bg: '#fff7ed', color: '#c2410c', label: 'Open' },
    };
    return map[status] || { bg: '#f1f5f9', color: '#64748b', label: status || 'Unknown' };
};

/**
 * Centralized campus locations for the location dropdown.
 * These match common campus buildings/areas.
 */
export const CAMPUS_LOCATIONS = [
    'Main Building',
    'Library',
    'Canteen',
    'Boys Hostel',
    'Girls Hostel',
    'Auditorium',
    'Lab Block A',
    'Lab Block B',
    'Workshop Block',
    'Sports Ground',
    'CSE Department',
    'ECE Department',
    'EEE Department',
    'MECH Department',
    'CIVIL Department',
    'IT Department',
    'MBA Block',
    'Parking Area',
    'Admin Office',
    'Exam Cell',
    'Seminar Hall',
    'Other',
];
