const CustomDateHeader = ({ label, date, getDayTotals, isMobile }) => {
  const { regular, ot } = getDayTotals(date);

  return (
    <div className="flex flex-row items-start text-gray-700 justify-between w-full p-2">
      <span>{label}</span>
      {!isMobile ? 
        ((regular > 0 || ot > 0) && (
          <span className="flex flex-row items-end gap-0.5">
            {regular > 0 && (
              <span className="text-xxs text-white font-mono px-1.5 py-0.5 rounded bg-primary">
                {regular.toFixed(2)}h
              </span>
            )}
            {ot >= 1 && (
              <span className="text-xxs text-white font-mono px-1.5 py-0.5 rounded bg-muted">
                {ot.toFixed(2)}h
              </span>
            )}
          </span>
        ))
      : null}
    </div>
  );
};

export default CustomDateHeader;
