// utils/timeUtils.js
import moment from 'moment';

export const calculateWorkedHours = (start, end) => {
  let totalMinutes = moment(end).diff(moment(start), 'minutes');

  // Deduct 1 hour for break if overlapping 11:30–12:30
  const breakStart = moment(start).clone().set({ hour: 11, minute: 30 });
  const breakEnd = moment(start).clone().set({ hour: 12, minute: 30 });

  const overlapStart = moment.max(moment(start), breakStart);
  const overlapEnd = moment.min(moment(end), breakEnd);

  const breakOverlap = moment(overlapEnd).diff(moment(overlapStart), 'minutes');
  if (breakOverlap > 0) {
    totalMinutes -= breakOverlap;
  }

  return +(totalMinutes / 60).toFixed(2); // return hours
};

export const splitRegularAndOT = (workedHours, existingRegular) => {
  const regularRemaining = Math.max(0, 9 - existingRegular);
  const regular = Math.min(regularRemaining, workedHours);
  const ot = workedHours - regular;
  return { regular, ot };
};
