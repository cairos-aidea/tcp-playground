import * as React from 'react';
import { cn } from '@/lib/utils';

export function TimePicker({ value, onChange, disabled = false, className, minTime, maxTime }) {
    // Refs for auto-scrolling selected items into view
    const hourRef = React.useRef(null);
    const minuteRef = React.useRef(null);

    // Parse current value or use defaults
    const parseTime = (timeStr) => {
        if (!timeStr) {
            return { hour: 9, minute: 0, period: 'AM' };
        }
        const [hourStr, minuteStr] = timeStr.split(':');
        let hour = parseInt(hourStr, 10);
        const minute = parseInt(minuteStr, 10);
        const period = hour >= 12 ? 'PM' : 'AM';
        if (hour > 12) hour -= 12;
        if (hour === 0) hour = 12;
        return { hour, minute, period };
    };

    const { hour, minute, period } = parseTime(value);

    // Parse min/max time constraints (24h format "HH:mm")
    const minHour24 = minTime ? parseInt(minTime.split(':')[0], 10) : null;
    const minMinute = minTime ? parseInt(minTime.split(':')[1], 10) : null;
    const maxHour24 = maxTime ? parseInt(maxTime.split(':')[0], 10) : null;
    const maxMinute = maxTime ? parseInt(maxTime.split(':')[1], 10) : null;

    // Get current 24h value for comparison
    const currentHour24 = period === 'PM' ? (hour === 12 ? 12 : hour + 12) : (hour === 12 ? 0 : hour);

    // Check if a specific hour (12h) + period combo is disabled by min/max constraints
    const isHourDisabled = (h, p) => {
        const h24 = p === 'PM' ? (h === 12 ? 12 : h + 12) : (h === 12 ? 0 : h);
        if (minHour24 !== null && h24 < minHour24) return true;
        if (maxHour24 !== null && h24 > maxHour24) return true;
        return false;
    };

    // Check if a specific minute is disabled (when on same hour as min/max)
    const isMinuteDisabled = (m) => {
        if (minHour24 !== null && currentHour24 === minHour24 && minMinute !== null && m < minMinute) return true;
        if (maxHour24 !== null && currentHour24 === maxHour24 && maxMinute !== null && m > maxMinute) return true;
        return false;
    };

    // Check if a period (AM/PM) is fully disabled
    const isPeriodDisabled = (p) => {
        if (p === 'AM') {
            // AM hours are 0-11
            if (minHour24 !== null && minHour24 >= 12) return true;
        } else {
            // PM hours are 12-23
            if (maxHour24 !== null && maxHour24 < 12) return true;
        }
        return false;
    };

    const handleHourChange = (newHour) => {
        const hour24 = period === 'PM' ? (newHour === 12 ? 12 : newHour + 12) : (newHour === 12 ? 0 : newHour);
        const newTime = `${hour24.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
        onChange?.(newTime);
    };

    const handleMinuteChange = (newMinute) => {
        const hour24 = period === 'PM' ? (hour === 12 ? 12 : hour + 12) : (hour === 12 ? 0 : hour);
        const newTime = `${hour24.toString().padStart(2, '0')}:${newMinute.toString().padStart(2, '0')}`;
        onChange?.(newTime);
    };

    const handlePeriodChange = (newPeriod) => {
        let hour24;
        if (newPeriod === 'PM') {
            hour24 = hour === 12 ? 12 : hour + 12;
        } else {
            hour24 = hour === 12 ? 0 : hour;
        }
        // If changing period makes the time invalid, clamp to minTime
        if (minHour24 !== null && hour24 < minHour24) {
            const clampedMin = minMinute !== null ? minMinute : 0;
            onChange?.(`${minHour24.toString().padStart(2, '0')}:${clampedMin.toString().padStart(2, '0')}`);
            return;
        }
        const newTime = `${hour24.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
        onChange?.(newTime);
    };

    const hours = Array.from({ length: 12 }, (_, i) => i + 1);
    const minutes = Array.from({ length: 12 }, (_, i) => i * 5); // 0, 5, 10, ... 55

    // Auto-scroll selected hour/minute into view on mount and value change
    React.useEffect(() => {
        const scrollToSelected = (containerRef) => {
            if (!containerRef.current) return;
            const selected = containerRef.current.querySelector('[data-selected="true"]');
            if (selected) {
                selected.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
            }
        };
        // Small delay to let popover open
        const timer = setTimeout(() => {
            scrollToSelected(hourRef);
            scrollToSelected(minuteRef);
        }, 100);
        return () => clearTimeout(timer);
    }, [hour, minute, period]);

    return (
        <div className={cn('flex gap-1.5', className)}>
            {/* Hours */}
            <div ref={hourRef} className="h-[200px] w-[58px] rounded-lg border border-border/60 overflow-y-auto tp-scrollbar bg-muted/20">
                <div className="p-1.5 flex flex-col gap-0.5">
                    {hours.map((h) => {
                        const hourDisabled = disabled || isHourDisabled(h, period);
                        return (
                            <button
                                key={h}
                                type="button"
                                disabled={hourDisabled}
                                data-selected={hour === h}
                                onClick={() => handleHourChange(h)}
                                className={cn(
                                    'w-full rounded-md py-1.5 text-center text-sm font-medium',
                                    'transition-all duration-150 ease-out',
                                    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:ring-offset-1',
                                    hourDisabled
                                        ? 'text-muted-foreground/40 cursor-not-allowed'
                                        : 'hover:bg-accent hover:scale-[1.02] active:scale-[0.98] cursor-pointer',
                                    hour === h
                                        ? 'bg-primary text-primary-foreground shadow-sm hover:bg-primary/90 hover:scale-100'
                                        : ''
                                )}
                            >
                                {h.toString().padStart(2, '0')}
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* Minutes */}
            <div ref={minuteRef} className="h-[200px] w-[58px] rounded-lg border border-border/60 overflow-y-auto tp-scrollbar bg-muted/20">
                <div className="p-1.5 flex flex-col gap-0.5">
                    {minutes.map((m) => {
                        const minuteDisabled = disabled || isMinuteDisabled(m);
                        return (
                            <button
                                key={m}
                                type="button"
                                disabled={minuteDisabled}
                                data-selected={minute === m}
                                onClick={() => handleMinuteChange(m)}
                                className={cn(
                                    'w-full rounded-md py-1.5 text-center text-sm font-medium',
                                    'transition-all duration-150 ease-out',
                                    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:ring-offset-1',
                                    minuteDisabled
                                        ? 'text-muted-foreground/40 cursor-not-allowed'
                                        : 'hover:bg-accent hover:scale-[1.02] active:scale-[0.98] cursor-pointer',
                                    minute === m
                                        ? 'bg-primary text-primary-foreground shadow-sm hover:bg-primary/90 hover:scale-100'
                                        : ''
                                )}
                            >
                                {m.toString().padStart(2, '0')}
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* AM/PM */}
            <div className="flex flex-col gap-1 h-[200px] w-[48px] rounded-lg border border-border/60 p-1.5 bg-muted/20">
                {['AM', 'PM'].map((p) => {
                    const periodDisabled = disabled || isPeriodDisabled(p);
                    return (
                        <button
                            key={p}
                            type="button"
                            disabled={periodDisabled}
                            onClick={() => handlePeriodChange(p)}
                            className={cn(
                                'flex-1 rounded-md text-center text-sm font-semibold',
                                'transition-all duration-150 ease-out',
                                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:ring-offset-1',
                                periodDisabled
                                    ? 'text-muted-foreground/40 cursor-not-allowed'
                                    : 'hover:bg-accent hover:scale-[1.03] active:scale-[0.97] cursor-pointer',
                                period === p
                                    ? 'bg-primary text-primary-foreground shadow-sm hover:bg-primary/90 hover:scale-100'
                                    : ''
                            )}
                        >
                            {p}
                        </button>
                    );
                })}
            </div>

            <style>{`
                .tp-scrollbar::-webkit-scrollbar {
                    width: 3px;
                }
                .tp-scrollbar::-webkit-scrollbar-track {
                    background: transparent;
                }
                .tp-scrollbar::-webkit-scrollbar-thumb {
                    background: hsl(var(--border));
                    border-radius: 10px;
                }
                .tp-scrollbar::-webkit-scrollbar-thumb:hover {
                    background: hsl(var(--muted-foreground));
                }
            `}</style>
        </div>
    );
}
