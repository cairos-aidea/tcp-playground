const legendItems = [
  { color: "bg-emerald-500", label: "Approved" },
  { color: "bg-yellow-500", label: "Pending" },
  { color: "bg-red-500", label: "Declined" },
];

const CalendarLegend = () => {
  return (
    <div className="flex items-center gap-6 px-4 py-3">
      {legendItems.map((item) => (
        <div key={item.label} className="flex items-center gap-2">
          <span className={`w-2.5 h-2.5 rounded-full ${item.color} shrink-0`} />
          <span className="text-sm text-muted-foreground">{item.label}</span>
        </div>
      ))}
    </div>
  );
};

export default CalendarLegend;
