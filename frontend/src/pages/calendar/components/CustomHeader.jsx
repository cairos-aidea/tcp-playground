export const CustomMonthHeader = ({ label }) => {
  return (
    <div className="text-xs font-bold text-gray-600 uppercase text-center py-3">
      {label}
    </div>
  );
};

export const CustomWeekHeader = ({ label }) => {
  // Expect label format: "11 MON" or "MON 11"
  let day = '';
  let weekday = '';

  // Try to extract day and weekday from label
  const parts = label.split(' ');
  if (parts.length === 2) {
    // Check which part is the day (number)
    if (!isNaN(parts[0])) {
      day = parts[0];
      weekday = parts[1];
    } else {
      weekday = parts[0];
      day = parts[1];
    }
  } else {
    // Fallback: show label as weekday, empty day
    weekday = label;
  }

  return (
    <div className="flex flex-col items-center py-3">
      <span className="text-xs font-bold text-gray-700 uppercase">{weekday}</span>
      <span className="text-2xl font-extrabold text-gray-800">{day}</span>
    </div>
  );
};
