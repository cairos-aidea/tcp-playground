import React, { useMemo } from 'react';
import { BarChart, Clock, Calendar as CalendarIcon } from 'lucide-react';

const TimeEntrySummary = ({ timeEntries, selectedDate, calendarView }) => {
    // calendarView: 'month' | 'week' | 'day'

    // console.log("Current view:", calendarView);

    const stats = useMemo(() => {
        const currentDate = new Date(selectedDate);

        // Helper to format date keys
        const formatDateKey = (date) => date.toISOString().split('T')[0];

        // Helper to get range for week
        const getWeekRange = (date) => {
            const day = date.getDay();
            const firstDayOfWeek = new Date(date);
            firstDayOfWeek.setDate(date.getDate() - day);
            const lastDayOfWeek = new Date(firstDayOfWeek);
            lastDayOfWeek.setDate(firstDayOfWeek.getDate() + 6);
            return [firstDayOfWeek, lastDayOfWeek];
        };

        // Helper to get range for month
        const getMonthRange = (date) => {
            const firstDay = new Date(date.getFullYear(), date.getMonth(), 1);
            const lastDay = new Date(date.getFullYear(), date.getMonth() + 1, 0);
            return [firstDay, lastDay];
        };

        // Helper to get range for day
        const getDayRange = (date) => [new Date(date), new Date(date)];

        let rangeStart, rangeEnd, rangeText;
        if (calendarView === 'month') {
            [rangeStart, rangeEnd] = getMonthRange(currentDate);
            rangeText = `${rangeStart.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${rangeEnd.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`;
        } else if (calendarView === 'week') {
            [rangeStart, rangeEnd] = getWeekRange(currentDate);
            rangeText = `${rangeStart.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${rangeEnd.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`;
        } else {
            [rangeStart, rangeEnd] = getDayRange(currentDate);
            rangeText = `${rangeStart.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`;
        }

        let regularHours = 0;
        let overtimeHours = 0;
        let totalDaysWorked = 0;
        const dailyHours = [];

        let daysInRange = [];
        let numDays = 1;

        if (calendarView === 'month') {
            numDays = (rangeEnd - rangeStart) / (1000 * 60 * 60 * 24) + 1;
            for (let i = 0; i < numDays; i++) {
                const d = new Date(rangeStart);
                d.setDate(rangeStart.getDate() + i);
                daysInRange.push(d);
            }
        } else if (calendarView === 'week') {
            for (let i = 0; i < 7; i++) {
                const d = new Date(rangeStart);
                d.setDate(rangeStart.getDate() + i);
                daysInRange.push(d);
            }
        } else {
            daysInRange = [rangeStart];
        }

        daysInRange.forEach((day) => {
            const dateKey = formatDateKey(day);
            const dayEntries = timeEntries[dateKey] || [];
            let dayRegularHours = 0;
            let dayOvertimeHours = 0;

            dayEntries.forEach(entry => {
                dayRegularHours += entry.regularHours;
                dayOvertimeHours += entry.overtimeHours;
            });

            const totalDayHours = dayRegularHours + dayOvertimeHours;
            if (totalDayHours > 0) totalDaysWorked++;

            regularHours += dayRegularHours;
            overtimeHours += dayOvertimeHours;

            dailyHours.push({
                day: day.toLocaleDateString('en-US', { weekday: 'short', day: 'numeric' }),
                regularHours: dayRegularHours,
                overtimeHours: dayOvertimeHours,
                totalHours: totalDayHours
            });
        });

        return {
            rangeText,
            regularHours,
            overtimeHours,
            totalHours: regularHours + overtimeHours,
            totalDaysWorked,
            dailyHours,
            numDays: daysInRange.length
        };
    }, [timeEntries, selectedDate, calendarView]);

    return (
        <div>
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Activity Summary</h2>

            <div className="mb-6">
                <div className="flex items-center mb-2">
                    <CalendarIcon className="h-4 w-4 text-gray-500 mr-1" />
                    <h3 className="text-sm font-medium text-gray-700">
                        {calendarView === 'month' ? 'Monthly Summary' : calendarView === 'week' ? 'Weekly Summary' : 'Daily Summary'}
                    </h3>
                </div>
                <p className="text-xs text-gray-500 mb-3">{stats.rangeText}</p>

                <div className="grid grid-cols-2 gap-3 mb-4">
                    <div className="bg-blue-50 rounded-lg p-3">
                        <p className="text-xs text-blue-600 mb-1">Regular Hours</p>
                        <p className="text-lg font-semibold text-blue-800">{stats.regularHours.toFixed(2)}</p>
                    </div>
                    <div className="bg-orange-50 rounded-lg p-3">
                        <p className="text-xs text-orange-600 mb-1">Overtime Hours</p>
                        <p className="text-lg font-semibold text-orange-800">{stats.overtimeHours.toFixed(2)}</p>
                    </div>
                </div>

                <div className="bg-gray-50 rounded-lg p-3 mb-4">
                    <div className="flex justify-between mb-1">
                        <p className="text-xs text-gray-500">Total Hours</p>
                        <p className="text-xs font-medium text-gray-700">{stats.totalHours.toFixed(2)}</p>
                    </div>
                    <div className="flex justify-between">
                        <p className="text-xs text-gray-500">Days Worked</p>
                        <p className="text-xs font-medium text-gray-700">{stats.totalDaysWorked} / {stats.numDays}</p>
                    </div>
                </div>
            </div>

            <div>
                <div className="flex items-center mb-3">
                    <BarChart className="h-4 w-4 text-gray-500 mr-1" />
                    <h3 className="text-sm font-medium text-gray-700">
                        {calendarView === 'month' ? 'Monthly Hours' : calendarView === 'week' ? 'Weekly Hours' : 'Daily Hours'}
                    </h3>
                </div>

                {calendarView === 'month' ? (
                    <div className="space-y-2">
                        {Array.from({ length: Math.ceil(stats.dailyHours.length / 7) }).map((_, weekIdx) => (
                            <div key={weekIdx} className="h-40 flex items-end space-x-2 overflow-x-auto">
                                {stats.dailyHours.slice(weekIdx * 7, weekIdx * 7 + 7).map((day, index) => {
                                    const maxHeight = 120;
                                    const maxHours = Math.max(...stats.dailyHours.map(d => d.totalHours), 8);
                                    const regularHeight = (day.regularHours / maxHours) * maxHeight;
                                    const overtimeHeight = (day.overtimeHours / maxHours) * maxHeight;

                                    return (
                                        <div key={index} className="flex-1 flex flex-col items-center min-w-[32px]">
                                            <div className="w-full flex flex-col-reverse">
                                                {day.overtimeHours > 0 && (
                                                    <div
                                                        className="w-full bg-orange-400 rounded-t-sm transition-all duration-300"
                                                        style={{ height: `${overtimeHeight}px` }}
                                                    ></div>
                                                )}
                                                {day.regularHours > 0 && (
                                                    <div
                                                        className="w-full bg-blue-400 rounded-t-sm transition-all duration-300"
                                                        style={{ height: `${regularHeight}px` }}
                                                    ></div>
                                                )}
                                            </div>
                                            <p className="text-xs text-gray-500 mt-1">{day.day}</p>
                                        </div>
                                    );
                                })}
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="h-40 flex items-end space-x-2 overflow-x-auto">
                        {stats.dailyHours.map((day, index) => {
                            const maxHeight = 120;
                            const maxHours = Math.max(...stats.dailyHours.map(d => d.totalHours), 8);
                            const regularHeight = (day.regularHours / maxHours) * maxHeight;
                            const overtimeHeight = (day.overtimeHours / maxHours) * maxHeight;

                            return (
                                <div key={index} className="flex-1 flex flex-col items-center min-w-[32px]">
                                    <div className="w-full flex flex-col-reverse">
                                        {day.overtimeHours > 0 && (
                                            <div
                                                className="w-full bg-orange-400 rounded-t-sm transition-all duration-300"
                                                style={{ height: `${overtimeHeight}px` }}
                                            ></div>
                                        )}
                                        {day.regularHours > 0 && (
                                            <div
                                                className="w-full bg-blue-400 rounded-t-sm transition-all duration-300"
                                                style={{ height: `${regularHeight}px` }}
                                            ></div>
                                        )}
                                    </div>
                                    <p className="text-xs text-gray-500 mt-1">{day.day}</p>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            <div className="mt-6 pt-4 border-t border-gray-200">
                <div className="flex items-center mb-2">
                    <Clock className="h-4 w-4 text-gray-500 mr-1" />
                    <h3 className="text-sm font-medium text-gray-700">Quick Stats</h3>
                </div>

                <div className="bg-gray-50 rounded-lg p-3">
                    <div className="text-xs text-gray-500 mb-2">Working Hours Policy</div>
                    <div className="flex justify-between text-sm mb-1">
                        <span className="text-gray-600">Regular Hours Window</span>
                        <span className="font-medium text-gray-700">7:00 AM - 7:00 PM</span>
                    </div>
                    <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Standard Work Day</span>
                        <span className="font-medium text-gray-700">8 hours</span>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default TimeEntrySummary;
