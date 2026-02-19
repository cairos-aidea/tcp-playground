import React, { useEffect, useRef, useState } from 'react';
import moment from 'moment';
import { Clock, ArrowRight } from 'lucide-react';

/**
 * A tooltip that follows the cursor during time range selection on the calendar.
 * Shows start time, end time, and duration.
 */
const CursorTimeTooltip = ({ selecting, start, end }) => {
    const tooltipRef = useRef(null);
    const [pos, setPos] = useState({ x: 0, y: 0 });
    const [visible, setVisible] = useState(false);

    // Track mouse position
    useEffect(() => {
        if (!selecting) return;

        const handleMouseMove = (e) => {
            setPos({ x: e.clientX, y: e.clientY });
        };

        // Hide on mouseup (selection finished) — safety net
        const handleMouseUp = () => {
            setVisible(false);
        };

        window.addEventListener('mousemove', handleMouseMove, { passive: true });
        window.addEventListener('mouseup', handleMouseUp, { once: true });
        return () => {
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('mouseup', handleMouseUp);
        };
    }, [selecting]);

    // Show/hide instantly
    useEffect(() => {
        if (selecting && start && end) {
            setVisible(true);
        } else {
            setVisible(false);
        }
    }, [selecting, start, end]);

    if (!start || !end) return null;

    const startMoment = moment(start);
    const endMoment = moment(end);

    // Calculate duration
    const durationMinutes = endMoment.diff(startMoment, 'minutes');
    const hours = Math.floor(durationMinutes / 60);
    const minutes = durationMinutes % 60;
    let durationStr = '';
    if (hours > 0 && minutes > 0) {
        durationStr = `${hours}h ${minutes}m`;
    } else if (hours > 0) {
        durationStr = `${hours}h`;
    } else {
        durationStr = `${minutes}m`;
    }

    const startStr = startMoment.format('h:mm A');
    const endStr = endMoment.format('h:mm A');

    // Prevent tooltip from going off-screen
    const offsetX = 16;
    const offsetY = -42;
    const tooltipWidth = 220;
    const windowWidth = typeof window !== 'undefined' ? window.innerWidth : 1200;
    const adjustedX = pos.x + offsetX + tooltipWidth > windowWidth
        ? pos.x - tooltipWidth - 8
        : pos.x + offsetX;

    return (
        <div
            ref={tooltipRef}
            className="fixed z-[9999] pointer-events-none"
            style={{
                left: adjustedX,
                top: pos.y + offsetY,
                opacity: visible ? 1 : 0,
                transform: visible ? 'translateY(0) scale(1)' : 'translateY(2px) scale(0.98)',
                transition: visible ? 'none' : 'opacity 80ms ease-out, transform 80ms ease-out',
            }}
        >
            <div className="bg-gray-900/90 backdrop-blur-md text-white rounded-lg px-3 py-1.5 shadow-xl border border-white/10 flex items-center gap-2 text-xs font-medium whitespace-nowrap">
                <Clock size={12} className="text-blue-300 shrink-0" />
                <span className="text-blue-100">{startStr}</span>
                <ArrowRight size={10} className="text-gray-400 shrink-0" />
                <span className="text-blue-100">{endStr}</span>
                <span className="text-gray-500">|</span>
                <span className="text-emerald-300 font-semibold">{durationStr}</span>
            </div>
        </div>
    );
};

export default CursorTimeTooltip;
