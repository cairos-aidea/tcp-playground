
import { ChevronLeft, ChevronRight, AlertCircle, Clock, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

const MONTHS = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
];

const CalendarToolbar = ({ userHireDate, events, date, label, localizer, onNavigate, onView, views, view, children, showSidebarOptions, setShowSidebarOptions, isMobile }) => {

    // Helper to get current week number of the month/year
    const getWeekNumber = (d) => {
        const date = new Date(d.getTime());
        date.setHours(0, 0, 0, 0);
        date.setDate(date.getDate() + 3 - (date.getDay() + 6) % 7);
        const week1 = new Date(date.getFullYear(), 0, 4);
        return 1 + Math.round(((date.getTime() - week1.getTime()) / 86400000 - 3 + (week1.getDay() + 6) % 7) / 7);
    };

    const currentMonthName = MONTHS[date.getMonth()];
    const currentYear = date.getFullYear();
    const currentDay = date.getDate();
    const shortMonth = currentMonthName.slice(0, 3);

    // Calculate week number relative to month roughly or just use week of year
    // Reference uses "Week X"
    const weekNum = getWeekNumber(date);

    // Calculate month range
    const startOfMonth = new Date(currentYear, date.getMonth(), 1);
    const endOfMonth = new Date(currentYear, date.getMonth() + 1, 0);

    // ── Stats helpers (ported from CustomToolbar) ──────────────────────────

    const isWeekday = (d) => { const day = d.getDay(); return day !== 0 && day !== 6; };

    const calculateDuration = (start, end) => {
        let startDate = new Date(start);
        let endDate = new Date(end);
        const dayStart = new Date(startDate); dayStart.setHours(7, 0, 0, 0);
        const dayEnd = new Date(startDate); dayEnd.setHours(19, 0, 0, 0);
        if (startDate < dayStart) startDate = new Date(dayStart);
        if (endDate > dayEnd) endDate = new Date(dayEnd);
        if (endDate <= startDate) return 0;
        const lunchStart = new Date(startDate); lunchStart.setHours(11, 30, 0, 0);
        const lunchEnd = new Date(startDate); lunchEnd.setHours(12, 30, 0, 0);
        let overlap = 0;
        if (startDate < lunchEnd && endDate > lunchStart) {
            const os = new Date(Math.max(startDate.getTime(), lunchStart.getTime()));
            const oe = new Date(Math.min(endDate.getTime(), lunchEnd.getTime()));
            overlap = Math.max(0, (oe - os) / (1000 * 60 * 60));
        }
        return Math.max(0, (endDate - startDate) / (1000 * 60 * 60) - overlap);
    };

    const getViewRange = (date, view) => {
        const d = new Date(date);
        if (view === "month") return { start: new Date(d.getFullYear(), d.getMonth(), 1), end: new Date(d.getFullYear(), d.getMonth() + 1, 0) };
        if (view === "week") {
            const start = new Date(d); start.setDate(d.getDate() - d.getDay());
            const end = new Date(start); end.setDate(start.getDate() + 6);
            return { start, end };
        }
        return { start: new Date(d), end: new Date(d) };
    };

    const shouldShowStats = (range) => {
        const today = new Date();
        const setDate = new Date(2025, 10, 10);
        return range.end >= setDate && range.start <= today;
    };

    const computeStats = ({ events, userHireDate, range }) => {
        let start = new Date(range.start);
        let end = new Date(range.end);
        const statsStartDate = new Date(2025, 10, 10);
        if (view === "month" && start < statsStartDate && end >= statsStartDate) start = new Date(statsStartDate);
        if (userHireDate) {
            const hireDate = new Date(userHireDate);
            if (hireDate > start && hireDate <= end) start = new Date(hireDate);
            if (hireDate > end) return { upToDate: true };
        }
        const today = new Date();
        if (start > today) return { upToDate: true };
        if (end.getFullYear() === today.getFullYear() && end.getMonth() === today.getMonth() && end.getDate() >= today.getDate()) {
            end = new Date(today); end.setDate(today.getDate() - 1);
        }

        const holidays = (events || [])
            .filter(e => e.type === "holiday" && new Date(e.start) >= start && new Date(e.start) <= end)
            .map(e => new Date(e.start).toDateString());

        const timeCharges = (events || []).filter(e => {
            if (e.type !== "timeCharge" || e.status === "declined" || e.is_ot === true) return false;
            const ed = new Date(e.start); ed.setHours(0, 0, 0, 0);
            const s = new Date(start); s.setHours(0, 0, 0, 0);
            const en = new Date(end); en.setHours(0, 0, 0, 0);
            return ed >= s && ed <= en;
        });

        const eventsByDay = {};
        timeCharges.forEach(e => {
            const k = new Date(e.start).toDateString();
            if (!eventsByDay[k]) eventsByDay[k] = [];
            eventsByDay[k].push(e);
        });

        const leaveEvents = (events || []).filter(e =>
            e.type === "leave" &&
            new Date(e.start).getFullYear() === start.getFullYear() &&
            new Date(e.start).getMonth() === start.getMonth()
        );

        const leaveDurationsByDay = {};
        leaveEvents.forEach(e => {
            const k = new Date(e.start).toDateString();
            const dur = calculateDuration(e.start, e.end);
            const status = e.status === 0 || e.status === 4 ? "approved" : e.status;
            if (!leaveDurationsByDay[k]) leaveDurationsByDay[k] = { approved: 0, pending: 0 };
            if (status === "approved" || e.status === 0) leaveDurationsByDay[k].approved += dur;
            else if (status === "pending") leaveDurationsByDay[k].pending += dur;
        });

        let missingHours = 0, pendingHours = 0;
        let cursor = new Date(start);
        const isSingleDay = start.getFullYear() === end.getFullYear() && start.getMonth() === end.getMonth() && start.getDate() === end.getDate();

        while (cursor <= end) {
            const dayStr = cursor.toDateString();
            if (isWeekday(cursor) && !holidays.includes(dayStr)) {
                const dayEvents = eventsByDay[dayStr] || [];
                let approvedDuration = 0, pendingDuration = 0;
                dayEvents.forEach(e => {
                    const dur = calculateDuration(e.start, e.end);
                    if (e.status === "approved") approvedDuration += dur;
                    if (e.status === "pending") pendingDuration += dur;
                });
                const leaveDur = leaveDurationsByDay[dayStr] || { approved: 0, pending: 0 };
                approvedDuration += leaveDur.approved;
                pendingDuration += leaveDur.pending;
                const cappedPending = Math.min(pendingDuration, Math.max(8 - approvedDuration, 0));
                if (isSingleDay) {
                    missingHours += Math.max(0, 8 - (approvedDuration + pendingDuration));
                    pendingHours += cappedPending;
                } else {
                    const total = Math.min(approvedDuration + pendingDuration, 8);
                    if (total < 8) missingHours += 8 - total;
                    pendingHours += cappedPending;
                }
            }
            if (isSingleDay) break;
            cursor.setDate(cursor.getDate() + 1);
        }

        return { missingHours, pendingHours, upToDate: false };
    };

    // ── Stats rendering ────────────────────────────────────────────────────

    const range = getViewRange(date, view);
    const showStats = shouldShowStats(range);
    let statsContent = null;

    if (showStats && !isMobile) {
        const stats = computeStats({ events, userHireDate, range });
        const fmtH = (h) => `${Math.floor(h)}${h % 1 !== 0 ? `.${(h % 1).toFixed(2).split(".")[1]}` : ""}h`;

        if (stats.upToDate) {
            statsContent = (
                <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-border bg-background text-xs font-medium text-muted-foreground">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                    <span>Up to date</span>
                </div>
            );
        } else {
            statsContent = (
                <div className="flex items-center gap-2">
                    {/* Missing hours pill */}
                    <div className={cn(
                        "flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs font-medium transition-colors",
                        stats.missingHours === 0
                            ? "border-border bg-background text-muted-foreground"
                            : "border-destructive/30 bg-destructive/5 text-destructive"
                    )}>
                        {stats.missingHours === 0
                            ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                            : <AlertCircle className="w-3.5 h-3.5 shrink-0" />}
                        <span>
                            {stats.missingHours === 0
                                ? "No missing hours"
                                : <><span className="opacity-70">Missing</span>{" "}<span className="font-bold">{fmtH(stats.missingHours)}</span></>}
                        </span>
                    </div>

                    {/* Pending hours pill */}
                    <div className={cn(
                        "flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs font-medium transition-colors",
                        stats.pendingHours === 0
                            ? "border-border bg-background text-muted-foreground"
                            : "border-amber-300/60 bg-amber-50/80 text-amber-700"
                    )}>
                        {stats.pendingHours === 0
                            ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                            : <Clock className="w-3.5 h-3.5 shrink-0" />}
                        <span>
                            {stats.pendingHours === 0
                                ? "No pending"
                                : <><span className="opacity-70">For Approval</span>{" "}<span className="font-bold">{fmtH(stats.pendingHours)}</span></>}
                        </span>
                    </div>
                </div>
            );
        }
    }

    return (
        <div className="flex flex-col gap-6 mb-6">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    {/* Date Badge - Shows selected date/current view date details */}
                    <div className="flex items-center px-3 py-2 rounded-lg border bg-muted/50">
                        <div className="text-center pr-3 border-r border-border">
                            <div className="text-[10px] font-medium text-primary uppercase tracking-wider">
                                {shortMonth}
                            </div>
                            <div className="text-xl font-bold text-primary leading-none">
                                {currentDay}
                            </div>
                        </div>
                        <div className="pl-3">
                            <div className="flex items-center gap-2">
                                <span className="font-semibold text-sm">{currentMonthName} {currentYear}</span>
                                {/* Week Badge */}
                                <span className="px-2 py-0.5 text-xs rounded-full border bg-background text-muted-foreground">
                                    Week {weekNum}
                                </span>
                            </div>
                            <div className="text-xs text-muted-foreground">
                                {shortMonth} 1, {currentYear} – {shortMonth} {endOfMonth.getDate()}, {currentYear}
                            </div>
                        </div>
                    </div>

                    {/* Stats Bar */}
                    {statsContent}
                </div>

                <div className="flex items-center gap-2">
                    {/* Navigation */}
                    <Button
                        variant="outline"
                        size="icon"
                        onClick={() => onNavigate('PREV')}
                        className="h-9 w-9"
                    >
                        <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => onNavigate('TODAY')}>
                        Today
                    </Button>
                    <Button
                        variant="outline"
                        size="icon"
                        onClick={() => onNavigate('NEXT')}
                        className="h-9 w-9"
                    >
                        <ChevronRight className="h-4 w-4" />
                    </Button>

                    {/* View Selector */}
                    <Select value={view} onValueChange={(v) => onView(v)}>
                        <SelectTrigger className="w-[130px] h-9">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="month">Month view</SelectItem>
                            <SelectItem value="week">Week view</SelectItem>
                            <SelectItem value="day">Day view</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
            </div>

            {/* Custom Children (e.g. Filters/Legend if needed) or just separation */}
            {children && <div className="w-full">{children}</div>}
        </div>
    );
};

export default CalendarToolbar;
