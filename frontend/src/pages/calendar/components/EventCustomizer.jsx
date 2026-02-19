import { CircleCheck, CircleX, Clock, DatabaseBackup, Hourglass, Calendar as CalendarIcon } from "lucide-react";
import moment from "moment";
import { cn } from "@/lib/utils";

const EventCustomizer = ({ view, event }) => {
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
      const parts = [];
      if (event.stage_label) parts.push(event.stage_label);
      if (event.activity) parts.push(event.activity);
      subtitle = parts.join(" - ");
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
          "w-full p-1.5 flex flex-col rounded-md border text-[10px] leading-snug cursor-pointer",
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

        {/* Subtitle */}
        {subtitle && (
          <div className={cn("mt-0.5 leading-tight opacity-80", styles.subtext)}>
            {subtitle}
          </div>
        )}
      </div>
    );
  }

  // ── Day / Week view: full card ─────────────────────────────────────────
  return (
    <div className="relative w-full h-full group">
      <div
        className={cn(
          "absolute inset-0 w-full min-h-full p-2 flex flex-col rounded-md border transition-all duration-200 ease-in-out",
          "hover:h-auto hover:z-50 hover:shadow-xl hover:scale-[1.02]",
          styles.bg,
          styles.border
        )}
      >
        {/* Header: Icon + Time + (Duration) */}
        <div className={cn("flex items-center gap-1.5 text-[10px] font-medium mb-1", styles.icon)}>
          <Icon size={12} className="shrink-0" />
          <span className="truncate">
            {startStr} – {endStr} <span className="opacity-75">({durationStr})</span>
          </span>
        </div>

        {/* Title */}
        <div className={cn("text-xs font-bold leading-tight line-clamp-2 uppercase", styles.text)}>
          {title}
        </div>

        {/* Subtitle */}
        {subtitle && (
          <div className={cn("text-[10px] mt-0.5 leading-tight line-clamp-2", styles.subtext)}>
            {subtitle}
          </div>
        )}
      </div>
    </div>
  );
};

export default EventCustomizer;
