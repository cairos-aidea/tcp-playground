import moment from 'moment';
import { cn } from '@/lib/utils';

export const CustomMonthHeader = ({ label }) => {
  return (
    <div className="text-sm font-medium text-muted-foreground text-center py-3">
      {label}
    </div>
  );
};

export const CustomWeekHeader = ({ label, date }) => {
  const dateObj = date;
  const isToday = moment(dateObj).isSame(moment(), 'day');

  const weekday = moment(dateObj).format('ddd');
  const dayNum = moment(dateObj).format('D');

  return (
    <div className={cn("flex flex-col items-center py-3 gap-0.5", isToday && "")}>
      <span className="text-sm font-medium text-muted-foreground">
        {weekday}
      </span>
      <div className={cn(
        "flex items-center justify-center w-8 h-8 rounded-full text-lg font-semibold mt-1 transition-colors leading-none",
        isToday ? "bg-primary text-primary-foreground" : "text-foreground"
      )}>
        {dayNum}
      </div>
    </div>
  );
};
