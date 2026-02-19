const CustomDateHeader = ({ label, date, getDayTotals, isMobile }) => {
  const { regular, ot } = getDayTotals(date);

  // Format hours: always 2 decimal places, e.g. 9.00h, 9.25h, 6.30h
  const fmtH = (h) => {
    const floored = Math.floor(h);
    const mins = Math.round((h - floored) * 60);
    return `${floored}.${mins < 10 ? '0' + mins : mins}h`;
  };

  const isToday = (() => {
    const now = new Date();
    return date.getFullYear() === now.getFullYear() &&
      date.getMonth() === now.getMonth() &&
      date.getDate() === now.getDate();
  })();

  return (
    <div className="flex flex-row items-center text-gray-700 justify-between w-full px-2 pt-1.5 pb-1">
      {isToday ? (
        <span
          className="inline-flex items-center justify-center text-xs font-bold rounded-full"
          style={{
            width: '22px',
            height: '22px',
            backgroundColor: '#26292f',
            color: '#ffffff',
          }}
        >
          {label}
        </span>
      ) : (
        <span className="text-xs font-medium">{label}</span>
      )}
      {!isMobile ?
        ((regular > 0 || ot > 0) && (
          <span className="flex flex-row items-center gap-1">
            {regular > 0 && (
              <span
                className="inline-flex items-center gap-1 text-[10px] font-semibold px-1.5 py-0.5 rounded-full"
                style={{
                  backgroundColor: '#26292f',
                  color: '#ffffff'
                }}
              >
                <span className="font-bold">{fmtH(regular)}</span>
              </span>
            )}
            {ot >= 0.1 && (
              <span
                className="inline-flex items-center gap-1 text-[10px] font-semibold px-1.5 py-0.5 rounded-full"
                style={{
                  backgroundColor: '#9ca3af',
                  color: '#ffffff'
                }}
              >
                <span className="font-bold">{fmtH(ot)}</span>
              </span>
            )}
          </span>
        ))
        : null}
    </div>
  );
};

export default CustomDateHeader;
