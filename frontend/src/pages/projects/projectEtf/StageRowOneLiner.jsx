import React, { useState, useRef } from "react";
import { getOverlapWorkingDays } from "../../../utilities/projects/etfHelpers";

const defaultColors = [
  "#bbf7d0",
  "#fca5a5",
  "#fdba74",
  "#fcd34d",
  "#a5b4fc",
  "#f9a8d4",
  "#6ee7b7",
  "#fef08a",
  "#c4b5fd",
  "#f87171",
];

function getStageColor(idx) {
  return defaultColors[idx % defaultColors.length];
}

const StageRowOneLiner = ({ weeks, stages, hiddenStages = [] }) => {
  const stageColorMap = {};
  stages.forEach((s, idx) => {
    const key = s.stage_id || s.stage;
    stageColorMap[key] = getStageColor(idx);
  });

  const [popoverVisible, setPopoverVisible] = useState(false);
  const [popoverContent, setPopoverContent] = useState("");
  const [popoverPosition, setPopoverPosition] = useState({ top: 0, left: 0 });
  const popoverTimeout = useRef();

  const showPopover = (e, content) => {
    if (popoverTimeout.current) clearTimeout(popoverTimeout.current);
    const rect = e.currentTarget.getBoundingClientRect();
    setPopoverPosition({
      top: rect.top + window.scrollY + rect.height / 2 + 4,
      left: rect.left + window.scrollX + rect.width + 8,
    });
    setPopoverContent(content);
    setPopoverVisible(true);
  };

  const hidePopover = () => {
    popoverTimeout.current = setTimeout(() => setPopoverVisible(false), 80);
  };

  return (
    <>
      <tr className="h-[25px]">
        {/* LABEL */}
        <td className="sticky left-0 z-10 bg-white h-[25px] p-0 font-bold text-xs text-gray-700 border-r border-gray-400 min-w-32">
          Project Stages
        </td>

        {weeks.map((w, i) => {
          const isLastWeekOfMonth =
            i === weeks.length - 1 || w.month !== weeks[i + 1]?.month;

          const overlappingStages = stages
            .map((s, sIdx) => {
              const key = s.stage_id || s.stage;
              if (hiddenStages.includes(key)) return null;
              const days = getOverlapWorkingDays(
                { start: s.start, end: s.end },
                { start: w.start, end: w.end }
              );
              return days > 0 ? { ...s, key, days } : null;
            })
            .filter(Boolean);

          /* empty */
          if (overlappingStages.length === 0) {
            return (
              <td
                key={i}
                className={`border-r border-black h-[25px] p-0 bg-gray-50 ${isLastWeekOfMonth ? "border-b border-black" : ""}`}
              />
            );
          }

          /* single */
          if (overlappingStages.length === 1) {
            const s = overlappingStages[0];
            return (
              <td
                key={i}
                className="relative border border-black h-[25px] p-0"
                onMouseEnter={e => showPopover(e, `${s.days} Working Days — ${w.month} Week ${w.weekNumber}\n${s.stage}`)}
                onMouseLeave={hidePopover}
              >
                <div
                  className="absolute inset-0 w-full h-full"
                  style={{ background: stageColorMap[s.key], cursor: 'pointer' }}
                />
                <div className="absolute inset-0 flex items-center justify-center font-bold text-[11px] text-gray-950 pointer-events-none">
                  {s.days}
                </div>
              </td>
            );
          }

          /* multi */
          const maxDays = Math.max(...overlappingStages.map((s) => s.days));
          return (
            <td className="relative border border-black h-[25px] p-0">
              <div className="flex h-[25px] w-full">
                {overlappingStages.map((s) => (
                  <div
                    key={s.key}
                    className="h-[25px] w-full"
                    style={{
                      flex: 1,
                      background: stageColorMap[s.key],
                      cursor: 'pointer',
                    }}
                    onMouseEnter={e =>
                      showPopover(
                        e,
                        `${s.days} Working Days — ${w.month} Week ${w.weekNumber}\n${s.stage}`
                      )
                    }
                    onMouseLeave={hidePopover}
                  />
                ))}
              </div>
              <div className="absolute inset-0 flex items-center justify-center font-bold text-[11px] text-gray-950 pointer-events-none">
                {Math.max(...overlappingStages.map((s) => s.days))}
              </div>
            </td>
          );

        })}

        <td
          className="border-x border-gray-200 sticky bg-white text-right h-[25px] p-0"
          style={{ minWidth: '50px', right: '200px' }}
        ></td>
        <td
          className="border-x border-gray-200 sticky bg-white text-right h-[25px] p-0"
          style={{ minWidth: '100px', right: '100px' }}
        ></td>
        <td
          className="border-x border-gray-200 sticky bg-white text-right h-[25px] p-0"
          style={{ minWidth: '100px', right: '0px' }}
        ></td>
      </tr>
      {/* POPOVER */}
      {popoverVisible && (
        <div
          className="fixed z-60 bg-neutral-800 text-white text-xs px-3 py-2 rounded shadow-xl border border-neutral-700 ml-7 whitespace-pre-line"
          style={{ top: popoverPosition.top, left: popoverPosition.left, pointerEvents: 'none' }}
        >
          {popoverContent}
        </div>
      )}
    </>
  );
};

export default StageRowOneLiner;
