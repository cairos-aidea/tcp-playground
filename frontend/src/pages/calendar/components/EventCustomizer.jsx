import { useEffect, useRef, useState } from "react";
import { CircleCheck, CircleX, Clock, DatabaseBackup, Hourglass, Calendar as CalendarIcon } from "lucide-react";
import moment from "moment";
import { cn } from "@/lib/utils";
import { createPortal } from "react-dom";

const EventCustomizer = ({ view, event, showDragHandles = false }) => {
  const containerRef = useRef(null);

  useEffect(() => {
    if (event.isCurrent && containerRef.current) {
      // Small delay to ensure render is complete
      setTimeout(() => {
        containerRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }, 100);
    }
  }, [event.isCurrent]);

  // HACK: Recursively remove title attribute from parent elements to prevent native tooltip
  useEffect(() => {
    if (containerRef.current) {
      // Traverse up to find any element with a title attribute
      let el = containerRef.current.parentElement;
      while (el && el !== document.body) {
        if (el.getAttribute("title")) {
          el.removeAttribute("title");
        }
        // Also observe for changes if RBC re-adds it
        if (el.classList.contains("rbc-event") || el.classList.contains("rbc-day-slot") || el.classList.contains("rbc-row-segment")) {
           const observer = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
              if (mutation.type === "attributes" && mutation.attributeName === "title") {
                const title = el.getAttribute("title");
                if (title) el.removeAttribute("title");
              }
            });
          });
          observer.observe(el, { attributes: true });
        }
        
        el = el.parentElement;
        // Stop if we go too far up (e.g., past the row/cell)
        if (el && (el.classList.contains("rbc-row") || el.classList.contains("rbc-month-view"))) break;
      }
    }
  }, []);

  if (event.source === "SYNC-SP-LIST" && (view === "day" || view === "week")) {
    return null;
  }


  // Determine Styles matching visual reference
  let styles = {
    bg: "bg-yellow-400",
    border: "border-yellow-600",
    text: "text-yellow-950",
    icon: "text-yellow-900",
    subtext: "text-yellow-900/80"
  };

  const isEditable = !["approved", "declined"].includes((event.status || "").toLowerCase());

  if (event.type === "leave") {
    styles = {
      bg: "bg-purple-300",
      border: "border-purple-600",
      text: "text-purple-950",
      icon: "text-purple-900",
      subtext: "text-purple-900/80"
    };
  } else if (event.type === "holiday") {
    styles = {
      bg: "bg-gray-300",
      border: "border-gray-500",
      text: "text-gray-900",
      icon: "text-gray-700",
      subtext: "text-gray-700/80"
    };
  } else if (event.source === "SYNC-SP-LIST") {
    styles = {
      bg: "bg-blue-300",
      border: "border-blue-500",
      text: "text-blue-950",
      icon: "text-blue-800",
      subtext: "text-blue-800/80"
    };
  } else if (event.status === "approved") {
    styles = {
      bg: "bg-emerald-300",
      border: "border-emerald-600",
      text: "text-emerald-950",
      icon: "text-emerald-900",
      subtext: "text-emerald-900/80"
    };
  } else if (event.status === "declined") {
    styles = {
      bg: "bg-red-300",
      border: "border-red-600",
      text: "text-red-950",
      icon: "text-red-900",
      subtext: "text-red-900/80"
    };
  }

  // Format Duration
  const start = moment(event.start);
  const end = moment(event.end);
  const startStr = start.format("hh:mm A");
  const endStr = end.format("hh:mm A");

  const diff = end.diff(start);
  const duration = moment.duration(diff);
  const hours = Math.floor(duration.asHours());
  const minutes = duration.minutes();

  let durationStr = "";
  if (hours > 0) durationStr += `${hours}h`;
  if (minutes > 0) durationStr += ` ${minutes}m`;
  if (!durationStr) durationStr = "0m";

  // Create label strings
  let title = event.title;
  let subtitle = "";

  if (event.type === "timeCharge") {
    if (event.chargeType === "external") {
      title = event.project_label || event.project_code || "External Project";
      // Keep stage and activity separate for two-row display
    } else if (event.chargeType === "internal") {
      title = event.project_label || "Internal Project";
      subtitle = event.status || "Internal";
    } else if (event.chargeType === "departmental") {
      title = event.activity || "Departmental Task";
      subtitle = "";
    }
  }

  // Icon Selection
  let Icon = Hourglass;
  if (event.status === 'approved') Icon = CircleCheck;
  if (event.status === 'declined') Icon = CircleX;
  if (event.type === 'leave') Icon = CalendarIcon;

  // Tooltip Content
  const tooltipContent = (
    <div className="flex flex-col gap-1 min-w-[200px] max-w-[300px]">
        {/* Header */}
        <div className="border-b border-zinc-700 pb-2 mb-1">
            <div className="font-bold text-sm text-white leading-tight">
                {title}
            </div>
            {(event.stage_label || subtitle) && (
                <div className="text-xs text-zinc-400 mt-0.5">
                   {event.stage_label ? `${event.stage_label} ${event.activity ? `• ${event.activity}` : ''}` : subtitle}
                </div>
            )}
        </div>
        
        {/* Body */}
        <div className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 text-xs text-zinc-300">
             <span className="text-zinc-500 font-medium">Time:</span>
             <div className="flex items-center gap-2">
                <span className="font-mono text-zinc-200">{startStr} – {endStr}</span>
                {event.is_ot && (
                    <span className="text-amber-400 font-bold text-[10px] uppercase tracking-wide border border-amber-400/30 bg-amber-400/10 px-1.5 rounded-sm">
                        OVERTIME
                    </span>
                )}
             </div>
             
             <span className="text-zinc-500 font-medium">Duration:</span>
             <span className="text-zinc-200">{durationStr}</span>

             <span className="text-zinc-500 font-medium">Status:</span>
             <span className={cn(
                 "font-medium capitalize",
                 event.status === 'approved' ? "text-emerald-400" :
                 event.status === 'declined' ? "text-red-400" : "text-zinc-200"
             )}>
                 {event.status || 'Pending'}
             </span>
        </div>

        {/* Remarks Footer */}
        {event.remarks && (
            <div className="mt-2 pt-2 border-t border-zinc-800 text-xs text-zinc-400 italic">
                "{event.remarks}"
            </div>
        )}
    </div>
  );

  // ── Custom Tooltip Logic ──────────────────────────────────────────────
  const [showTooltip, setShowTooltip] = useState(false);
  const tooltipRef = useRef(null);
  const mousePos = useRef({ x: 0, y: 0 });
  const hoverTimeout = useRef(null);

  const handleMouseEnter = (e) => {
    // Capture initial position
    mousePos.current = { x: e.clientX, y: e.clientY };
    // Start delay
    hoverTimeout.current = setTimeout(() => {
      setShowTooltip(true);
    }, 1000); // 1s delay
  };

  const handleMouseMove = (e) => {
    // Update ref immediately
    mousePos.current = { x: e.clientX, y: e.clientY };
    
    // Direct DOM manipulation for butter-smooth performance
    if (tooltipRef.current) {
        // Position: Bottom-Right of cursor
        const x = e.clientX + 10;
        const y = e.clientY + 25;
        tooltipRef.current.style.transform = `translate3d(${x}px, ${y}px, 0)`;
    }
  };

  const handleMouseLeave = () => {
    // Clear timeout and hide
    if (hoverTimeout.current) clearTimeout(hoverTimeout.current);
    setShowTooltip(false);
  };

  // Render portal if visible
  const TooltipPortal = showTooltip ? createPortal(
    <div 
      ref={tooltipRef}
      className="fixed z-[9999] pointer-events-none"
      style={{
        top: 0,
        left: 0,
        // Set initial position immediately to avoid jump
        transform: `translate3d(${mousePos.current.x + 10}px, ${mousePos.current.y + 25}px, 0)`
      }}
    >
      <div className="bg-zinc-950 border border-zinc-800 text-white shadow-xl p-3 rounded-md animate-in fade-in zoom-in-95 duration-200 origin-top-left">
        {tooltipContent}
      </div>
    </div>,
    document.body
  ) : null;

  // ── Month view: full card (naturally flowing, not absolute) ───────────
  if (view === "month") {
    return (
      <>
        <div
          ref={containerRef}
          onMouseEnter={handleMouseEnter}
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseLeave}
          className={cn(
          "relative w-full p-1.5 flex flex-col rounded-md border text-[10px] leading-snug cursor-pointer",
          styles.bg,
          styles.border
        )}
      >
        {/* Time + Duration */}
        <div className={cn("flex items-center gap-1 font-medium mb-0.5", styles.icon)}>
          <Icon size={10} className="shrink-0" />
          <span className="truncate">
            {startStr} – {endStr}{" "}
            <span className="opacity-75">({durationStr})</span>
          </span>
        </div>

        {/* Title */}
        <div className={cn("font-bold leading-tight uppercase", styles.text)}>
          {title}
        </div>

        {/* Subtitle: stage and activity on separate rows */}
        {event.type === "timeCharge" && event.chargeType === "external" ? (
          <>
            {event.stage_label && (
              <div className={cn("mt-0.5 leading-tight opacity-80", styles.subtext)}>
                {event.stage_label}
              </div>
            )}
            {event.activity && (
              <div className={cn("leading-tight opacity-80", styles.subtext)}>
                {event.activity}
              </div>
            )}
          </>
        ) : (subtitle && (
          <div className={cn("mt-0.5 leading-tight opacity-80", styles.subtext)}>
            {subtitle}
          </div>
        ))}

        {/* OT Badge for Month View */}
        {event.is_ot && (
          <div className="absolute bottom-1 right-1">
            <span className={cn(
              "text-[9px] font-extrabold px-1 rounded border bg-background/50 backdrop-blur-[1px]",
              styles.border,
              styles.text
            )}>
              OT
            </span>
          </div>
        )}
        </div>
        {TooltipPortal}
      </>
    );
  }

  // ── Day / Week view: full card ─────────────────────────────────────────
  return (
    <>
      <div 
        className="relative w-full h-full group" 
        ref={containerRef}
        onMouseEnter={handleMouseEnter}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
      >
      <div
        className={cn(
          "absolute inset-0 w-full min-h-full p-2 flex flex-col rounded-md border transition-all duration-200 ease-in-out",
          "hover:shadow-[0_0_14px_4px_rgba(0,0,0,0.18)] hover:z-50",
          styles.bg,
          styles.border
        )}
      >
        {/* Top resize handle indicator — shown only when drag handles are enabled and event is selected AND editable */}
        {showDragHandles && event.isCurrent && isEditable && (
          <div className="absolute top-0 left-0 right-0 flex justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-150 pointer-events-none z-10">
            <div className="mt-[3px] flex flex-col gap-[3px]">
              <div className="w-5 h-[2px] rounded-full bg-current opacity-40" />
              <div className="w-5 h-[2px] rounded-full bg-current opacity-40" />
            </div>
          </div>
        )}

        {/* Header: Icon + Time + (Duration) */}
        <div className={cn("flex items-center justify-between text-[10px] font-medium mb-1", styles.icon)}>
          <div className="flex items-center gap-1.5 flex-1 min-w-0">
            <Icon size={12} className="shrink-0" />
            <span className="truncate">
              {startStr} – {endStr} <span className="opacity-75">({durationStr})</span>
            </span>
          </div>
          {showDragHandles && event.isCurrent && (
            <span className="text-[9px] font-bold uppercase tracking-wider opacity-60 ml-1 shrink-0">Selected</span>
          )}
        </div>

        {/* Title */}
        <div className={cn("text-xs font-bold leading-tight line-clamp-2 uppercase", styles.text)}>
          {title}
        </div>

        {/* Subtitle: stage and activity on separate rows */}
        {event.type === "timeCharge" && event.chargeType === "external" ? (
          <>
            {event.stage_label && (
              <div className={cn("text-[10px] mt-0.5 leading-tight line-clamp-1 opacity-90", styles.subtext)}>
                {event.stage_label}
              </div>
            )}
            {event.activity && (
              <div className={cn("text-[10px] leading-tight line-clamp-1 opacity-80", styles.subtext)}>
                {event.activity}
              </div>
            )}
          </>
        ) : (subtitle && (
          <div className={cn("text-[10px] mt-0.5 leading-tight line-clamp-2", styles.subtext)}>
            {subtitle}
          </div>
        ))}

        {/* Bottom resize handle indicator — shown only when drag handles are enabled and event is selected AND editable */}
        {showDragHandles && event.isCurrent && isEditable && (
          <div className="absolute bottom-0 left-0 right-0 flex justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-150 pointer-events-none z-10">
            <div className="mb-[3px] flex flex-col gap-[3px]">
              <div className="w-5 h-[2px] rounded-full bg-current opacity-40" />
              <div className="w-5 h-[2px] rounded-full bg-current opacity-40" />
            </div>
          </div>
        )}

        {/* Overtime Badge */}
        {event.is_ot && (
          <div className="absolute right-1.5 bottom-1.5 z-10">
            <span className={cn(
              "text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded border opacity-90",
              styles.border, // Use the card border color for the badge border
              styles.text // Use the text color for the badge text
            )}
              style={{ backgroundColor: "rgba(255,255,255,0.3)" }} // Subtle semi-transparent background
            >
              Overtime
            </span>
          </div>
        )}
        </div>
      </div>
      {TooltipPortal}
    </>
  );
};

export default EventCustomizer;
