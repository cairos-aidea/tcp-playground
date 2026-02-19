
import { cn } from "@/lib/utils";

// Event color classes based on status - Full rounded border style
const EVENT_COLORS = {
    p_pending: {
        bg: 'bg-yellow-500/10 dark:bg-yellow-500/20',
        border: 'border-l-4 border-yellow-500', // Left border for status indicator
        text: 'text-yellow-700 dark:text-yellow-400',
    },
    p_approved: {
        bg: 'bg-emerald-500/10 dark:bg-emerald-500/20',
        border: 'border-l-4 border-emerald-500',
        text: 'text-emerald-700 dark:text-emerald-400',
    },
    p_declined: {
        bg: 'bg-red-500/10 dark:bg-red-500/20',
        border: 'border-l-4 border-red-500',
        text: 'text-red-700 dark:text-red-400',
    },
    // Map project statuses if different
    Scheduled: {
        bg: 'bg-blue-500/10 dark:bg-blue-500/20',
        border: 'border-l-4 border-blue-500',
        text: 'text-blue-700 dark:text-blue-400',
    },
    Completed: {
        bg: 'bg-emerald-500/10 dark:bg-emerald-500/20',
        border: 'border-l-4 border-emerald-500',
        text: 'text-emerald-700 dark:text-emerald-400',
    },
    Cancelled: {
        bg: 'bg-red-500/10 dark:bg-red-500/20',
        border: 'border-l-4 border-red-500',
        text: 'text-red-700 dark:text-red-400',
    },
    default: {
        bg: 'bg-primary/5',
        border: 'border-l-4 border-primary',
        text: 'text-primary',
    }
};

const CalendarEvent = ({ event }) => {
    // Determine status key map
    let statusKey = 'default';

    // Map existing event status logic to colors
    // event.status might be numeric or string depending on backend
    // Assuming backend returns descriptive strings or we map them here:
    // 0: Pending, 1: Approved, 2: Declined? Or string 'pending', 'approved'

    if (event.status === 'pending' || event.status === 0) statusKey = 'p_pending';
    if (event.status === 'approved' || event.status === 1) statusKey = 'p_approved';
    if (event.status === 'declined' || event.status === 2) statusKey = 'p_declined';

    // If event has specific type 'holiday', use a specific color?
    if (event.type === 'holiday') {
        return (
            <div className="flex flex-col h-full w-full bg-purple-100 border-l-4 border-purple-500 text-purple-700 px-1 py-0.5 text-xs overflow-hidden rounded-r-sm">
                <span className="font-semibold truncate">{event.title}</span>
            </div>
        )
    }

    const colors = EVENT_COLORS[statusKey] || EVENT_COLORS.default;

    return (
        <div className={cn(
            'flex flex-col h-full w-full px-2 py-1 text-xs overflow-hidden rounded-r-md transition-all hover:brightness-95',
            colors.bg,
            colors.border,
            colors.text
        )}>
            <div className="flex items-center justify-between gap-2">
                <span className="font-semibold truncate">{event.title}</span>
                {/* <span className="text-[10px] opacity-70 whitespace-nowrap">
                   {new Date(event.start).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                </span> */}
            </div>
            {event.desc && (
                <div className="text-[10px] opacity-80 truncate">
                    {event.desc}
                </div>
            )}
        </div>
    );
};

export default CalendarEvent;
