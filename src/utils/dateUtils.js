import { format, formatDistanceToNow, isToday, isTomorrow, isYesterday, parseISO, differenceInMinutes } from 'date-fns';

export function formatDate(dateStr) {
  if (!dateStr) return '';
  const date = typeof dateStr === 'string' ? parseISO(dateStr) : dateStr;
  if (isToday(date)) return 'Today';
  if (isTomorrow(date)) return 'Tomorrow';
  if (isYesterday(date)) return 'Yesterday';
  return format(date, 'MMM d, yyyy');
}

export function formatTime(timeStr) {
  if (!timeStr) return '';
  const [hours, minutes] = timeStr.split(':').map(Number);
  const date = new Date();
  date.setHours(hours, minutes, 0, 0);
  return format(date, 'h:mm a');
}

export function formatDateTime(dateStr, timeStr) {
  const datePart = formatDate(dateStr);
  const timePart = formatTime(timeStr);
  if (datePart && timePart) return `${datePart} at ${timePart}`;
  return datePart || timePart || '';
}

export function formatRelative(dateStr) {
  if (!dateStr) return '';
  const date = typeof dateStr === 'string' ? parseISO(dateStr) : dateStr;
  return formatDistanceToNow(date, { addSuffix: true });
}

export function formatClock() {
  return format(new Date(), 'HH:mm:ss');
}

export function formatDateShort(dateStr) {
  if (!dateStr) return '';
  const date = typeof dateStr === 'string' ? parseISO(dateStr) : dateStr;
  return format(date, 'MMM d');
}

export function getMinutesUntil(dateStr, timeStr) {
  if (!dateStr || !timeStr) return null;
  const [hours, minutes] = timeStr.split(':').map(Number);
  const date = typeof dateStr === 'string' ? parseISO(dateStr) : new Date(dateStr);
  date.setHours(hours, minutes, 0, 0);
  return differenceInMinutes(date, new Date());
}
