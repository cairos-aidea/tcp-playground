import { useState, useRef, useEffect, useLayoutEffect } from 'react';
import { Pencil, X, ClockArrowDown, Check, EllipsisVertical } from 'lucide-react';
import { STAGE_COLORS } from "./constants";

export const TableHeader = ({ weeks, stages, hiddenStages, onStageChange, getOverlapWorkingDays, headerReq, selectedProject, saveAllStageEdits, onClearProject, onOpenStageModal, phase, phaseIdx}) => {
  // Ref for scrolling to current month/year
  const today = new Date();
  const currentMonth = today.getMonth() + 1; // JS months are 0-based
  const currentYear = today.getFullYear();
  // Find the first week that matches current month/year
  const currentWeekIdx = weeks.findIndex(w => w.year === currentYear && w.month === currentMonth);
  const currentWeekRef = useRef(null);
  // Scroll to the current week column on mount
  useEffect(() => {
    if (currentWeekRef.current) {
      currentWeekRef.current.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
    }
  }, []);
  // Modal state and handlers are now managed in ETF.jsx
  // Remove local modal state

  const yearGroups = {};
  weeks.forEach((w) => {
    yearGroups[w.year] = (yearGroups[w.year] || 0) + 1;
  });

  const monthGroups = {};
  weeks.forEach((w) => {
    const key = `${w.year}-${w.month}`;
    monthGroups[key] = monthGroups[key] || { label: w.monthName, count: 0 };
    monthGroups[key].count++;
  });

  // Define colors to cycle through for years
  const yearColors = [
    'bg-gray-400 text-white',
    'bg-gray-200 text-gray-950',
  ];

  const defaultColors = Object.values(STAGE_COLORS);

  const getStageColor = (idx) => {
    return defaultColors[idx % defaultColors.length];
  }

  const stageColorMap = {};
  stages.forEach((s, idx) => {
    const key = s.stage_id || s.stage;
    stageColorMap[key] = getStageColor(idx);
  });

  const [popoverVisible, setPopoverVisible] = useState(false);
  const [popoverContent, setPopoverContent] = useState("");
  const [popoverPosition, setPopoverPosition] = useState({ top: 0, left: 0 });
  const popoverTimeout = useRef();
  const [popoverPending, setPopoverPending] = useState(false);
  const popoverRef = useRef(null);

  const showPopover = (e, content) => {
    if (popoverTimeout.current) clearTimeout(popoverTimeout.current);
    setPopoverContent(content);

    const rect = e.currentTarget.getBoundingClientRect();

    // Store the element position temporarily
    setPopoverPosition({ top: rect.top + window.scrollY, left: rect.left + window.scrollX });

    // Show popover after it's rendered
    setPopoverPending(true);
  };

  useLayoutEffect(() => {
    if (popoverPending && popoverRef.current) {
      const popoverEl = popoverRef.current;
      const popoverHeight = popoverEl.offsetHeight;
      const popoverWidth = popoverEl.offsetWidth;

      // Adjust top so the popover sits above the cell
      setPopoverPosition(pos => ({
        top: pos.top - popoverHeight - 10,
        left: pos.left - popoverWidth / 2 + 12, // 12 = half cell width (adjust as needed)
      }));

      setPopoverVisible(true);
      setPopoverPending(false);
    }
  }, [popoverPending]);

  const hidePopover = () => {
    popoverTimeout.current = setTimeout(() => setPopoverVisible(false), 80);
  };

  return (
    <>
      {/* POPOVER (must be outside table for valid DOM nesting) */}
      {(popoverVisible || popoverPending) && (
        <div
          ref={popoverRef}
          className="fixed z-60 bg-neutral-800 text-white text-xs px-3 py-2 rounded shadow-xl border border-neutral-700 whitespace-pre-line"
          style={{ top: popoverPosition.top, left: popoverPosition.left, pointerEvents: 'none' }}
        >
          {popoverContent}

          {/* Arrow */}
          <div
            className="absolute bottom-[-6px] left-1/2 -translate-x-1/2 w-3 h-3 bg-neutral-800 rotate-45 border-t border-l border-neutral-700"
            style={{ pointerEvents: 'none' }}
          />
        </div>
      )}

      <thead className={`text-xs text-gray-700 uppercase bg-gray-100 sticky top-0 z-30`}>
        <tr>
          <th
            rowSpan={3}
            colSpan={1}
            className="sticky left-0 bg-gray-300 px-2 z-40 border-gray-300 text-gray-900"
            style={{ minWidth: '250px', maxWidth: '250px' }}
          >
            <div className="flex flex-col leading-tight">
              {phase !== 'No Phase' ? (
                <>
                  <span className="font-semibold text-sm truncate">
                    {phase}
                  </span>
                  <span className="text-xxs text-gray-500 truncate">
                    {selectedProject.project_code} - {selectedProject.project_name}
                  </span>
                </>
              ) : (
                <span className="font-semibold text-sm truncate">
                  {selectedProject.project_code} - {selectedProject.project_name}
                </span>
              )}
            </div>
          </th>

          {Object.entries(yearGroups).map(([year, count], idx) => (
            <th
              key={year}
              colSpan={count}
              className={
                `${yearColors[idx % yearColors.length]} font-bold border-r-2 border-gray-900 text-left sticky`}
              style={{ left: 250 }}
            >
              {year}
            </th>
          ))}

          <th
            rowSpan={3}
            colSpan={2}
            className=" bg-gray-300 font-bold text-gray-900 sticky border-b"
            style={{ minWidth: '200px', maxWidth: '200px', right: '0px' }}
          >
            Totals
          </th>
        </tr>

        <tr>
          {Object.entries(monthGroups).map(([key, obj], idx, arr) => {
            const [y, m] = key.split('-').map(Number);
            const isCurrent = y === currentYear && m === currentMonth;
            // Find if this is the last month of the year in the list
            const isLastMonthOfYear = (() => {
              // Find next month in arr
              const next = arr[idx + 1];
              if (!next) return true;
              const [nextY, nextM] = next[0].split('-').map(Number);
              return nextY !== y;
            })();
            return (
              <th
                key={key}
                colSpan={obj.count}
                className={`border-r border-t border-black${isLastMonthOfYear ? ' border-r-2' : ''}`}
                ref={isCurrent ? currentWeekRef : undefined}
              >
                {obj.label}
              </th>
            );
          })}

          {/* <th
            rowSpan={2}
            className="border-l border-black bg-blue-50 font-bold text-blue-900 sticky text-xxs"
            style={{ minWidth: '50px', right: '200px' }}
          >
            Hours

          </th> */}
          {/* <th
            rowSpan={2}
            className="bg-green-50 font-bold text-green-900 sticky border-b text-xxs"
            style={{ minWidth: '100px', right: '100px' }}
          >
            
          </th> */}
          {/* <th
            rowSpan={2}
            className="bg-green-50 font-bold text-green-900 sticky border-b text-xxs"
            style={{ minWidth: '100px', right: '100px' }}
          >
            PCB
          </th> */}
          {/* <th
            rowSpan={2}
            className="bg-amber-50 font-bold text-amber-900 sticky border-b text-xxs"
            style={{ minWidth: '100px', right: '0px' }}
          >
            
          </th> */}
        </tr>

        <tr>
          {weeks.map((w, i) => {
            const isLastWeekOfMonth = i === weeks.length - 1 || w.month !== weeks[i + 1]?.month;
            const isLastMonthOfYear = i === weeks.length - 1 || (w.month === 11 && (weeks[i + 1]?.month !== 11 || !weeks[i + 1]));
            const isCurrent = w.year === currentYear && w.month === currentMonth;
            return (
              <th
              key={i}
              className={`min-w-6 max-w-6 border-r border-t border-gray-800${isLastMonthOfYear ? ' border-r-2' : ''}`}
              ref={isCurrent ? currentWeekRef : undefined}
              >
              <span className="font-semibold text-gray-800 text-xxs">W{w.userWeekNum}</span>
              </th>
            );
            })}
          </tr>

          <tr className="h-[20px]">
            <td className="sticky left-0 z-10 h-[20px] px-2 py-1 font-bold text-xs text-left text-gray-700 border-r border-gray-400 min-w-32 bg-gray-200">
            <div className="flex items-center justify-between gap-2">
              <span className="uppercase text-xxs text-gray-500">
                Working Days
              </span>
              {/* <button
                type="button"
                className="text-gray-900 text-xs rounded px-1 h-[20px] flex items-center justify-center"
                // onClick={() => {
                //   setStageEdits(stages.map(s => ({ start: s.start || '', end: s.end || '' })));
                //   setIsModalOpen(true);
                // }}
                onClick={onOpenStageModal}
                aria-label="Edit all stage date ranges"
              >
                <Pencil className="w-4 h-4 text-gray-400 hover:text-blue-600" strokeWidth={2} />
              </button> */}
            </div>
          </td>

          {weeks.map((w, i) => {
            const baseWidth = 24;
            const tdStyle = { width: `${baseWidth}px`, minWidth: `${baseWidth}px`, maxWidth: `${baseWidth}px` };

            const overlappingStages = stages
              .map((s) => {
                const key = s.stage_id || s.stage;
                if (hiddenStages.includes(key)) return null;
                const days = getOverlapWorkingDays(
                  { start: s.start, end: s.end },
                  { start: w.start, end: w.end }
                );
                return days > 0 ? { ...s, key, days } : null;
              })
              .filter(Boolean);
              
            const s = overlappingStages[0];
            const isLastMonthOfYear = i === weeks.length - 1 || (w.month === 11 && (weeks[i + 1]?.month !== 11 || !weeks[i + 1]));

            /* empty */
            if (overlappingStages.length === 0) {
              return (
                <td
                  key={`empty-${i}`}
                  className={`border-t border-r border-b border-black h-[25px] p-0 bg-gray-50 ${isLastMonthOfYear ? ' border-r-2' : ''}`}
                  style={tdStyle}
                />
              );
            }

            /* single */
            if (overlappingStages.length === 1) {
              return (
                <td
                  key={i}
                  className={`relative border-t border-r border-b border-black h-[25px] p-0 ${isLastMonthOfYear ? 'border-r-2' : ''}`}
                  style={tdStyle}
                  onMouseEnter={e => showPopover(e, `${s.days} Working Days\n${s.stage}`)}
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
            return (
              <td key={`multi-${i}`} className={`relative border-t border-r border-b border-black h-[25px] p-0${isLastMonthOfYear ? ' border-r-2' : ''}`} style={tdStyle}>
                <div className="flex h-full w-full">
                  {overlappingStages.map((s) => (
                    <div
                      key={s.key}
                      className="h-full w-full"
                      style={{
                        flex: 1,
                        background: stageColorMap[s.key],
                        cursor: 'pointer',
                      }}
                      onMouseEnter={e => showPopover(e, `${s.days} Working Days\n${s.stage}`)}
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

          {/* <td
            className="border-x border-gray-200 sticky bg-white text-right h-[25px] p-0"
            style={{ minWidth: '50px', right: '200px' }}
            ></td> */}
          <td
            rowSpan={2}
            className="bg-green-200 font-bold text-green-900 sticky border-b text-xxs"
            style={{ minWidth: '100px', right: '100px' }}
          >
            Hours
          </td>
          {/* <td
              className="border-x border-gray-200 sticky bg-white text-right h-[25px] p-0"
              style={{ minWidth: '100px', right: '100px' }}
            ></td> */}
          <td
            rowSpan={2}
            className="bg-amber-200 font-bold text-amber-900 sticky border-b text-xxs"
            style={{ minWidth: '100px', right: '0px' }}
          >
            PCA
          </td>
        </tr>
      </thead>
    </>
  );
};
