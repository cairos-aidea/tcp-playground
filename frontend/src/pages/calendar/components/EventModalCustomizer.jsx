import { CircleCheck, CircleX, Clock, Hourglass } from "lucide-react";

const EventModalCustomizer = ({ event }) => {
  // Set background color based on event type and status
  let bg = "";
  if (event.type === "leave") {
    bg = "bg-purple-400 text-white";
  } else if (event.type === "holiday") {
    bg = "bg-gray-400 text-white";
  } else if (event.status === "pending") {
    bg = "bg-yellow-300 text-gray-800";
  } else if (event.status === "approved") {
    bg = "bg-green-400 text-gray-950";
  } else if (event.status === "declined") {
    bg = "bg-red-400 text-gray-800";
  } else {
    bg = "bg-gray-200 text-gray-950";
  }

  // Determine the display label
  let label = "";
  let stageActivityLine = "";
  if (event.type === "timeCharge") {
    if (event.chargeType === "external") {
      label = event.project_label || event.title;
      if (event.stage_label || event.activity) {
        stageActivityLine = `${event.stage_label ? " " + event.stage_label : ""}${event.activity ? " - " + event.activity : ""}`;
      }
    } else if (event.chargeType === "internal") {
      label = event.project_label || event.title;
    } else if (event.chargeType === "departmental") {
      label = event.activity || event.title;
    } else {
      label = event.title;
    }
  } else if (event.type === "leave") {
    label = event.title || "Leave";
  } else if (event.type === "holiday") {
    label = event.title || "Holiday";
  } else {
    label = event.title || "";
  }

  // Helper to compute duration between two dates in hours and minutes
  const getDuration = (start, end) => {
    if (!start || !end) return { hours: 0, minutes: 0 };
    let startDate = new Date(start);
    let endDate = new Date(end);
    let diffMs = endDate - startDate;
    let totalMinutes = Math.floor(diffMs / 60000);
    let hours = Math.floor(totalMinutes / 60);
    let minutes = totalMinutes % 60;
    return { hours, minutes };
  };

  // Compute duration if start and end exist
  let computedDuration = null;
  if (event.start && event.end) {
    computedDuration = getDuration(event.start, event.end);
  }

  return (
    <div className={`h-full w-full rounded-lg px-3 py-3 mb-1 text-xs font-medium ${bg} flex flex-col justify-start relative event-with-handles`} title={label}>
      {/* Top resize handle (circle) */}
      <div className="absolute left-0 top-0 flex justify-center items-center w-6 h-6 rounded-full bg-black opacity-80 cursor-pointer z-10">
        <div className="rbc-addons-dnd-resize-ns-icon w-4 h-4 bg-black rounded-full" />
      </div>

      {/* Bottom resize handle (circle) */}
      <div className="absolute right-0 bottom-0 flex justify-center items-center w-6 h-6 rounded-full bg-black opacity-80 cursor-pointer z-10">
        <div className="rbc-addons-dnd-resize-ns-icon w-4 h-4 bg-black rounded-full" />
      </div>

      {/* Event status and time */}
      <div className="flex items-center gap-1 text-[10px] opacity-80 break-words whitespace-normal">
        {event.status === "approved" && <CircleCheck size={12} className="text-gray-950" />}
        {event.status === "declined" && <CircleX size={12} className="text-gray-950" />}
        {event.status === "pending" && <Hourglass size={12} className="text-gray-950" />}
        {event.start?.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} –{' '}
        {event.end?.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        {event.is_ot && ' (OT)'}
      </div>

      {/* Event title */}
      <div className="break-words whitespace-normal text-[12px]">{label}</div>

      {/* Stage and activity */}
      {stageActivityLine && (
        <div className="text-[10px] break-words whitespace-normal">{stageActivityLine}</div>
      )}
    </div>
  );
};

export default EventModalCustomizer;
