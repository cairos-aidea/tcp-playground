import { useEffect, useRef } from "react";
import { CircleCheck, CircleX, Clock, DatabaseBackup, Hourglass, Calendar as CalendarIcon } from "lucide-react";
import moment from "moment";
import { cn } from "@/lib/utils";

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

  // ── Month view: full card (naturally flowing, not absolute) ───────────
  if (view === "month") {
    return (
      <div
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
    );
  }

  // ── Day / Week view: full card ─────────────────────────────────────────
  return (
    <div className="relative w-full h-full group" ref={containerRef}>
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
  );
};

export default EventCustomizer;
