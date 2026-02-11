export const countWorkingDays = (days) => {
  return days.filter((d) => {
    const day = d.getDay();
    return day >= 1 && day <= 5;
  }).length;
};

export const getOverlapWorkingDays = (range1, range2) => {
  const start = new Date(
    Math.max(new Date(range1.start).setHours(0, 0, 0, 0), new Date(range2.start).setHours(0, 0, 0, 0))
  );
  const end = new Date(
    Math.min(new Date(range1.end).setHours(23, 59, 59, 999), new Date(range2.end).setHours(23, 59, 59, 999))
  );
  if (start > end) return 0;

  let count = 0;
  let hasWorkingDay = false;
  const cur = new Date(start);

  while (cur <= end) {
    const day = cur.getDay();
    if (day !== 0 && day !== 6) {
      count++;
      hasWorkingDay = true;
    }
    cur.setDate(cur.getDate() + 1);
  }

  return hasWorkingDay ? count : 0;
};

export const getDateRange = (start, end) => {
  const dates = [];
  const current = new Date(start);
  current.setHours(0, 0, 0, 0);
  const endDate = new Date(end);
  endDate.setHours(0, 0, 0, 0);

  while (current <= endDate) {
    dates.push(new Date(current));
    current.setDate(current.getDate() + 1);
  }

  return dates;
};

export const getWeekOfMonth = (date) => {
  // Week starts on Monday (1), Sunday is 0
  const startOfMonth = new Date(date.getFullYear(), date.getMonth(), 1);
  const dayOfWeek = startOfMonth.getDay() === 0 ? 7 : startOfMonth.getDay();
  const offsetDate = date.getDate() + dayOfWeek - 1;
  return Math.ceil(offsetDate / 7);
};

// If the first week object does not start with weekNum 1 or 2, use its weekNum as the base for userWeekNum
export const getUserFriendlyWeeks = (weeks) => {
  if (!weeks || weeks.length === 0) return [];
  let w = 0;
  let prevMonth = weeks[0].month;
  let baseWeekNum = 1;

  // Check if the first weekNum is not 1 or 2, use its weekNum as base
  if (weeks[0].weekNum > 2) {
    baseWeekNum = weeks[0].weekNum;
    w = baseWeekNum - 1;
  }

  return weeks.map((week, idx) => {
    if (prevMonth !== week.month) {
      w = 0;
      prevMonth = week.month;
      // Reset baseWeekNum for new month
      baseWeekNum = (week.weekNum > 2) ? week.weekNum : 1;
      if (week.weekNum > 2) w = baseWeekNum - 1;
    }
    const userWeekNum = w + 1;
    w++;
    return {
      ...week,
      userWeekNum,
      weekKey: `W${userWeekNum}`,
    };
  });
};

// export const getUserFriendlyWeeks = (weeks) => {
//   if (!weeks || weeks.length === 0) return [];
//   let w = 0;
//   let prevMonth = weeks[0].month;
//   let baseWeekNum = 1;

//   // Check if the first weekNum is not 1 or 2, use its weekNum as base
//   if (weeks[0].weekNum > 2) {
//     baseWeekNum = weeks[0].weekNum;
//     w = baseWeekNum - 1;
//   }

//   return weeks.map((week) => {
//     if (prevMonth !== week.month) {
//       w = 0;
//       prevMonth = week.month;
//       // Reset baseWeekNum for new month
//       baseWeekNum = (week.weekNum > 2) ? week.weekNum : 1;
//       if (week.weekNum > 2) w = baseWeekNum - 1;
//     }
//     const userWeekNum = w + 1;
//     w++;
//     return {
//       ...week,
//       userWeekNum,
//       weekKey: `W${userWeekNum}`,
//     };
//   });
// };
//       weekNum = 1;
//     } else {
//       d07 = 6;
//       weekNum++;
//     }
//   }

//   return weekNum;
// };

// export const getWeekOfMonth = (date) => {
//   const startOfMonth = new Date(date.getFullYear(), date.getMonth(), 1);
//   const dayOfWeek = startOfMonth.getDay() === 0 ? 7 : startOfMonth.getDay();
//   const offsetDate = date.getDate() + dayOfWeek - 1;
//   return Math.ceil(offsetDate / 7);
// };

// export const getUserFriendlyWeeks = (weeks) => {
//   return weeks.map((week) => {
//     const userWeekNum = getWeekOfMonth(week.start);
//     return {
//       ...week,
//       userWeekNum,
//       weekKey: `W${userWeekNum}`,
//     };
//   });
// };

export const getWeeksSplitByMonth = (startDate, endDate) => {
  const weeks = [];
  const start = new Date(startDate);
  const end = new Date(endDate);
  end.setHours(23, 59, 59, 999);

  const current = new Date(start);
  while (current.getDay() !== 1) {
    current.setDate(current.getDate() - 1);
  }

  while (current <= end) {
    const weekStart = new Date(current);
    const weekEnd = new Date(current);
    weekEnd.setDate(weekEnd.getDate() + 6);

    let tempStart = new Date(weekStart);

    while (tempStart <= weekEnd && tempStart <= end) {
      let tempEnd = new Date(tempStart);
      tempEnd.setDate(tempEnd.getDate() + 6);
      if (tempEnd > weekEnd) tempEnd = new Date(weekEnd);
      if (tempEnd > end) tempEnd = new Date(end);

      if (tempStart.getMonth() !== tempEnd.getMonth()) {
        let splitEnd = new Date(tempStart.getFullYear(), tempStart.getMonth() + 1, 0);
        if (splitEnd > weekEnd) splitEnd = new Date(weekEnd);
        if (splitEnd > end) splitEnd = new Date(end);

        const daysArr = getDateRange(tempStart, splitEnd);
        const workingDays = countWorkingDays(daysArr);

        if (daysArr.length > 0 && workingDays > 0) {
          weeks.push({
            year: tempStart.getFullYear(),
            month: tempStart.getMonth(),
            monthName: tempStart.toLocaleString('default', { month: 'short' }),
            weekNum: getWeekOfMonth(tempStart),
            start: new Date(tempStart),
            end: new Date(splitEnd),
            workingDays,
          });
        }

        tempStart = new Date(splitEnd);
        tempStart.setDate(tempStart.getDate() + 1);
      } else {
        const daysArr = getDateRange(tempStart, tempEnd);
        const workingDays = countWorkingDays(daysArr);

        if (daysArr.length > 0 && workingDays > 0) {
          weeks.push({
            year: tempStart.getFullYear(),
            month: tempStart.getMonth(),
            monthName: tempStart.toLocaleString('default', { month: 'short' }),
            weekNum: getWeekOfMonth(tempStart),
            start: new Date(tempStart),
            end: new Date(tempEnd),
            workingDays,
          });
        }

        tempStart = new Date(tempEnd);
        tempStart.setDate(tempStart.getDate() + 1);
      }
    }

    current.setDate(current.getDate() + 7);
  }

  return weeks;
};

export const getCellKey = (person, stage, weekKey, type) => {
  let stageId = '';
  if (typeof stage === 'object' && stage !== null) {
    stageId = stage.stage_id ? stage.stage_id : stage.stage;
  } else {
    stageId = stage;
  }
  return `${person}-${stageId}-${weekKey}-${type}`;
};


// export const getCellKey = (userId, weekKey, isSubsidiaryManpower, stageId) => {
//   return `${userId}-${weekKey}-${isSubsidiaryManpower}-${stageId}`;
// };

export const convertToGMTDate = (date) => {
  if (!date) return null;
  const offsetMs = 8 * 60 * 60 * 1000; 
  const gmt8Date = new Date(date.getTime() + offsetMs);
  const pad = (n) => n.toString().padStart(2, '0');
  const yyyy = gmt8Date.getUTCFullYear();
  const mm = pad(gmt8Date.getUTCMonth() + 1);
  const dd = pad(gmt8Date.getUTCDate());
  return `${yyyy}-${mm}-${dd}`;
}
