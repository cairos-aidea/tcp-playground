import moment from 'moment';
export function addCommasToNumber(number) {
  // Convert the number to a string to facilitate manipulation
  let numberStr = number.toString();

  // Split the string into integer and decimal parts
  let parts = numberStr.split(".");
  let integerPart = parts[0];
  let decimalPart = parts.length > 1 ? "." + parts[1] : "";

  // Reverse the integer part of the number to make adding commas easier
  let reversedIntegerPart = integerPart.split("").reverse().join("");

  // Initialize an empty string to store the formatted integer part
  let formattedIntegerPart = "";

  // Loop through the reversed string to add commas
  for (let i = 0; i < reversedIntegerPart.length; i++) {
    // Add a comma after every third digit
    if (i % 3 === 0 && i !== 0) {
      formattedIntegerPart += ",";
    }
    // Add the digit
    formattedIntegerPart += reversedIntegerPart[i];
  }

  // Reverse the formatted integer part back to its original order
  formattedIntegerPart = formattedIntegerPart.split("").reverse().join("");

  // Combine the formatted integer part and the decimal part
  let formattedNumber = formattedIntegerPart + decimalPart;

  return formattedNumber;
}

/* -------------------------------------- FUNCTION SEPARATOR -------------------------------------- */

export function generateTransactionNumber() {
  const randomPart1 = generateRandomString(4);
  const randomPart2 = generateRandomString(6);
  const randomPart3 = generateRandomString(7);
  return `${randomPart1}-02${randomPart2}-12${randomPart3}`;
}

/* -------------------------------------- FUNCTION SEPARATOR -------------------------------------- */

// Function to generate a random string of specified length
function generateRandomString(length) {
  let result = '';
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  const charactersLength = characters.length;
  for (let i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() * charactersLength));
  }
  return result;
}

/* -------------------------------------- FUNCTION SEPARATOR -------------------------------------- */

export function getDatesBetween(startDate, endDate) {
  // Convert strings to Moment.js objects
  startDate = moment(startDate);
  endDate = moment(endDate);

  const dates = [];
  let currentDate = startDate.clone(); // Use clone to avoid modifying startDate

  // Loop through each day until reaching or exceeding endDate
  while (currentDate.isBefore(endDate) || currentDate.isSame(endDate)) {
    dates.push(currentDate.format('YYYY-MM-DD')); // Add formatted date to array
    currentDate.add(1, 'days'); // Increment date by 1 day
  }

  return dates;
}

export const getAuthUser = () => {
  if (localStorage.hasOwnProperty('auth_user')) {
    return JSON.parse(localStorage.getItem("auth_user"));
  }
  return null;
};

export const logout = () => {
  localStorage.clear();
  window.location.href = '/login';
};

/* -------------------------------------- FUNCTION SEPARATOR -------------------------------------- */

export const formatStatus = (status) => {
  if (!status) return '';
  return status
    .replace(/_/g, ' ')
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
};

/* -------------------------------------- FUNCTION SEPARATOR -------------------------------------- */

/* -------------------------------------- TIMED BASED CALENDAR -------------------------------------- */
export function isWeekday(date) {
  // console.log("isWeekday called with:", date);
  const day = moment(date).day();
  return day !== 0 && day !== 6;
}

// Placeholder for holiday check
// holidays: { fixedHolidays: [...], dynamicHolidays: [...] }
export function isHoliday(date, holidays) {
  if (!holidays) return false;
  const mDate = moment(date);

  // Check fixed holidays (MM-DD)
  if (Array.isArray(holidays.fixedHolidays)) {
    const mmdd = mDate.format('MM-DD');
    if (
      holidays.fixedHolidays.some(
        h => h.isFixedDate && h.date === mmdd
      )
    ) {
      return true;
    }
  }

  // Check dynamic holidays (YYYY-MM-DD)
  if (Array.isArray(holidays.dynamicHolidays)) {
    const ymd = mDate.format('YYYY-MM-DD');
    if (
      holidays.dynamicHolidays.some(
        h => !h.isFixedDate && h.date === ymd
      )
    ) {
      return true;
    }
  }

  return false;
}

// Helper: Check overlap
export function isOverlapping(start1, end1, start2, end2) {
  // console.log("isOverlapping called with:", start1, end1, start2, end2);
  return moment(start1).isBefore(end2) && moment(end1).isAfter(start2);
}

// Helper: Get total hours for events in a day
export function getTotalHours(events, date) {
  // console.log("getTotalHours called with:", events, date);
  return events
    .filter(
      (e) =>
        moment(e.start).isSame(date, "day") &&
        ["time_charge", "absent", "leave", "official_business"].includes(e.type)
    )
    .reduce(
      (sum, e) =>
        sum + moment(e.end).diff(moment(e.start), "hours", true),
      0
    );
}

// Helper: Check if time is within office hours
export function isWithinOfficeHours(OFFICE_START_HOUR, OFFICE_END_HOUR, start, end) {
  // console.log("isWithinOfficeHours called with:", start, end);
  const startMoment = moment(start);
  const endMoment = moment(end);

  const officeStart = startMoment.clone().set({ hour: OFFICE_START_HOUR, minute: 0, second: 0, millisecond: 0 });
  const officeEnd = startMoment.clone().set({ hour: OFFICE_END_HOUR, minute: 0, second: 0, millisecond: 0 });

  return (
    startMoment.isSameOrAfter(officeStart) &&
    endMoment.isSameOrBefore(officeEnd)
  );
}

export function getOTEventsForDate(events, date) {
  return events.filter(
    (ev) =>
      moment(ev.start).isSame(date, "day") &&
      ev.isOT
  );
}

export function getRegularEventsForDate(events, date) {
  events.filter(
    (ev) =>
      moment(ev.start).isSame(date, "day") &&
      !ev.isOT &&
      (ev.projectType === "internal" ||
        ev.projectType === "external" ||
        ev.projectType === "departmental")
  );
}