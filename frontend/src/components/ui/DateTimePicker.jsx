import * as React from 'react';
import { format } from 'date-fns';
import { Calendar as CalendarIcon, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { TimePicker } from '@/components/ui/time-picker';
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from '@/components/ui/popover';

export function DateTimePicker({
    value,
    onChange,
    placeholder = 'Select date and time',
    disabled = false,
    className,
    minDate,
    maxDate,
    disablePast = false,
    disabledDates, // Function or array of dates to disable
    minTime, // "HH:mm" format — minimum allowed time (used when on same day as minDate)
}) {
    const [open, setOpen] = React.useState(false);

    // Convert string value to Date if needed
    const dateValue = React.useMemo(() => {
        if (!value) return undefined;
        if (typeof value === 'string') {
            const parsed = new Date(value);
            return isNaN(parsed.getTime()) ? undefined : parsed;
        }
        return value;
    }, [value]);

    const [month, setMonth] = React.useState(dateValue || new Date());

    // Get time string from date
    const timeValue = React.useMemo(() => {
        if (!dateValue) return '09:00';
        const hours = dateValue.getHours().toString().padStart(2, '0');
        const minutes = dateValue.getMinutes().toString().padStart(2, '0');
        return `${hours}:${minutes}`;
    }, [dateValue]);

    // Calculate effective minDate
    const effectiveMinDate = React.useMemo(() => {
        if (disablePast) {
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            return minDate && minDate > today ? minDate : today;
        }
        return minDate;
    }, [minDate, disablePast]);

    // Date-only version of minDate for calendar day comparisons (strips time so same day is selectable)
    const calendarMinDate = React.useMemo(() => {
        if (!effectiveMinDate) return undefined;
        const d = new Date(effectiveMinDate);
        d.setHours(0, 0, 0, 0);
        return d;
    }, [effectiveMinDate]);

    // Calculate effective minTime — only applies when selected date is the same as minDate
    const effectiveMinTime = React.useMemo(() => {
        if (!effectiveMinDate || !dateValue) return undefined;
        const sameDay =
            dateValue.getFullYear() === effectiveMinDate.getFullYear() &&
            dateValue.getMonth() === effectiveMinDate.getMonth() &&
            dateValue.getDate() === effectiveMinDate.getDate();
        if (sameDay && minTime) return minTime;
        if (sameDay && effectiveMinDate.getHours() > 0) {
            // If minDate has a time component, use it as minTime constraint
            return `${effectiveMinDate.getHours().toString().padStart(2, '0')}:${effectiveMinDate.getMinutes().toString().padStart(2, '0')}`;
        }
        return undefined;
    }, [effectiveMinDate, dateValue, minTime]);

    const handleDateSelect = (date) => {
        if (!date) {
            onChange?.(undefined);
            return;
        }
        // Combine selected date with current time
        const [hours, minutes] = timeValue.split(':').map(Number);
        date.setHours(hours, minutes, 0, 0);

        // If the new date+time is before minDate, clamp to minDate's time
        if (effectiveMinDate && date < effectiveMinDate) {
            date.setHours(effectiveMinDate.getHours(), effectiveMinDate.getMinutes(), 0, 0);
        }

        onChange?.(date);
    };

    const handleTimeChange = (newTime) => {
        if (dateValue) {
            const [hours, minutes] = newTime.split(':').map(Number);
            const newDate = new Date(dateValue);
            newDate.setHours(hours, minutes, 0, 0);
            onChange?.(newDate);
        } else {
            // If no date selected yet, create a new date with the time
            const today = new Date();
            const [hours, minutes] = newTime.split(':').map(Number);
            today.setHours(hours, minutes, 0, 0);
            onChange?.(today);
        }
    };

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <Button
                    type="button"
                    variant="outline"
                    disabled={disabled}
                    className={cn(
                        'w-full justify-start text-left font-normal',
                        'h-9 px-3 gap-2',
                        'transition-all duration-200 ease-out',
                        'border-border/60 shadow-sm',
                        'hover:border-primary/40 hover:shadow-md hover:bg-accent/50',
                        'focus-visible:ring-2 focus-visible:ring-primary/30 focus-visible:ring-offset-1',
                        'active:scale-[0.995]',
                        !dateValue && 'text-muted-foreground',
                        open && 'border-primary/50 ring-2 ring-primary/20 shadow-md',
                        className
                    )}
                >
                    <CalendarIcon className={cn(
                        "h-3.5 w-3.5 shrink-0 transition-colors duration-200",
                        open ? "text-primary" : "text-muted-foreground"
                    )} />
                    <span className="truncate">
                        {dateValue
                            ? format(dateValue, "MMMM d, yyyy 'at' h:mm a")
                            : placeholder
                        }
                    </span>
                </Button>
            </PopoverTrigger>
            <PopoverContent
                className="w-auto p-0 shadow-xl border-border/60 rounded-xl overflow-hidden animate-in fade-in-0 zoom-in-95 duration-200"
                align="start"
                sideOffset={6}
            >
                <div className="flex flex-col sm:flex-row">
                    {/* Calendar */}
                    <Calendar
                        mode="single"
                        selected={dateValue}
                        onSelect={handleDateSelect}
                        month={month}
                        onMonthChange={setMonth}
                        captionLayout="dropdown"
                        fromDate={calendarMinDate}
                        toDate={maxDate}
                        disabled={(date) => {
                            // Compare date-only (strip time) so same day as minDate is selectable
                            if (calendarMinDate) {
                                const d = new Date(date);
                                d.setHours(0, 0, 0, 0);
                                if (d < calendarMinDate) return true;
                            }
                            if (maxDate && date > maxDate) return true;
                            // Custom disabled dates logic
                            if (disabledDates) {
                                if (typeof disabledDates === 'function') {
                                    return disabledDates(date);
                                }
                                if (Array.isArray(disabledDates)) {
                                    return disabledDates.some(d => d.toDateString() === date.toDateString());
                                }
                            }
                            return false;
                        }}
                        initialFocus
                    />
                    {/* Time Picker */}
                    <div className="border-t sm:border-l sm:border-t-0 border-border/40 p-3 bg-muted/10">
                        <div className="mb-3 flex items-center gap-2 justify-center sm:justify-start">
                            <Clock className="h-3.5 w-3.5 text-primary/70" />
                            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Time</span>
                        </div>
                        <TimePicker
                            value={timeValue}
                            onChange={handleTimeChange}
                            disabled={disabled}
                            minTime={effectiveMinTime}
                        />
                    </div>
                </div>
            </PopoverContent>
        </Popover>
    );
}
