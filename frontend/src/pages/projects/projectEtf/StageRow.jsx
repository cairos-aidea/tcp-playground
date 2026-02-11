import React, { useState } from 'react';
import { Eye, EyeClosed, ArrowRight } from 'lucide-react';
import { api } from '../../../api/api';

export const StageRow = ({
  stage,
  index,
  weeks,
  stages,
  onStageChange,
  getOverlapWorkingDays,
  headerReq,
  hiddenStages,
  onToggleStageVisibility,
  showDateRange
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  // Local state for all stage edits in modal
  const [stageEdits, setStageEdits] = useState([]);

  // Helper to save all edits as a single payload array
  const saveAllStageEdits = () => {
    // Only include stages with changed start or end
    const changedStages = stageEdits
      .map((edit, idx) => {
        const orig = stages[idx];
        if (
          (edit.start !== orig.start || edit.end !== orig.end) &&
          edit.start &&
          edit.end &&
          new Date(edit.start) <= new Date(edit.end)
        ) {
          return {
            id: orig.stage_id,
            start_date: edit.start,
            end_date: edit.end,
          };
        }
        return null;
      })
      .filter(Boolean);

    if (changedStages.length > 0) {
      api('etf_stage_date_update', { ...headerReq }, changedStages)
        .then(() => {
          // Update parent state for each changed stage
          changedStages.forEach((payload, idx) => {
            const stageIdx = stages.findIndex(s => s.stage_id === payload.id);
            if (stageIdx !== -1) {
              onStageChange(stageIdx, 'start', payload.start_date);
              onStageChange(stageIdx, 'end', payload.end_date);
            }
          });
        })
        .catch((error) => console.error('Failed to update stage dates:', error));
    }
  };

  const stageIdOrName = stage.stage_id ? stage.stage_id : stage.stage;
  const isHidden = hiddenStages.includes(stageIdOrName);

  // --- Rendered Table Row ---
  const row = (
    <tr className="h-[25px]">

      {/* LEFT FIXED COLUMN */}
      <td
        colSpan={1}
        className="sticky left-0 z-10 bg-white h-[25px] p-0"
      >
        <div className="flex items-center gap-2 w-full border-r border-gray-400 h-[25px] p-0">

          <input
            type="text"
            name="stage"
            className="w-52 min-w-52 border border-white rounded text-xs text-gray-900 h-[25px] px-1"
            value={stage.stage}
            readOnly
            disabled
          />

          {!showDateRange && (
            <div className="relative w-44 h-[25px] flex justify-center items-center p-0">
              <button
                type="button"
                className="w-full bg-gray-50 border border-gray-300 text-gray-900 text-xs rounded px-1 h-[25px] flex items-center gap-1 text-left overflow-hidden"
                onClick={() => {
                  setStageEdits(stages.map(s => ({ start: s.start || '', end: s.end || '' })));
                  setIsModalOpen(true);
                }}
              >
                {stage.start && stage.end ? (
                  <>
                    <span className="truncate">{stage.start}</span>
                    <ArrowRight size={12} className="text-gray-400" />
                    <span className="truncate">{stage.end}</span>
                  </>
                ) : (
                  'Select'
                )}
              </button>
            </div>
          )}

          <button
            onClick={() => onToggleStageVisibility(stageIdOrName)}
            className={`mx-1 rounded transition-colors h-[25px] flex items-center ${isHidden
                ? 'text-gray-400 hover:text-gray-600 hover:bg-gray-100'
                : 'text-blue-500 hover:text-blue-700 hover:bg-blue-50'
              }`}
          >
            {isHidden ? <EyeClosed size={14} /> : <Eye size={14} />}
          </button>

        </div>
      </td>


      {/* WEEKS LOOP */}
      {weeks.map((w, i) => {
        const isLastWeekOfMonth =
          i === weeks.length - 1 || w.month !== weeks[i + 1]?.month;

        const overlappingStages = stages
          .map((s, sIdx) => ({
            ...s,
            idx: sIdx,
            days: getOverlapWorkingDays(
              { start: s.start, end: s.end },
              { start: w.start, end: w.end }
            ),
          }))
          .filter((s) => s.days > 0);

        const hiddenBg = isHidden ? 'bg-gray-100 text-gray-300' : ' ';
        const overlapIdx = overlappingStages.findIndex((s) => s.idx === index);

        // EMPTY CELL
        if (overlapIdx === -1) {
          return (
            <td
              key={i}
              className={`border-r h-[25px] p-0 ${isLastWeekOfMonth ? 'border-gray-800' : 'border-gray-200'
                } ${hiddenBg}`}
            />
          );
        }

        // SINGLE OVERLAP CELL
        if (overlappingStages.length === 1) {
          return (
            <td
              key={i}
              className={`border-r h-[25px] p-0 font-semibold text-center ${isLastWeekOfMonth ? 'border-gray-800' : 'border-gray-200'
                } ${hiddenBg} ${!isHidden ? 'bg-green-50 text-green-700' : ''}`}
            >
              {overlappingStages[0].days}
            </td>
          );
        }

        // MULTI-OVERLAP CELL
        return (
          <td
            key={i}
            className={`border-r h-[25px] p-0 ${isLastWeekOfMonth ? 'border-gray-800' : 'border-gray-200'
              } ${hiddenBg}`}
            style={{ position: 'relative', overflow: 'visible' }}
          >
            <div
              className="flex h-[25px] w-full"
              style={{ position: 'relative' }}
            >
              {overlappingStages.map((s, sIdx) => {
                const isCurrent = s.idx === index;
                const isMiddle =
                  overlapIdx === sIdx && overlappingStages.length > 1;

                return (
                  <div
                    key={s.idx}
                    className="flex items-center justify-center text-xs font-medium h-[25px] w-full"
                    style={{
                      flex: 1,
                      background: isCurrent ? '#bbf7d0' : '#f3f4f6',
                      color: isCurrent ? '#15803d' : '#6b7280',
                      opacity: isHidden ? 0.5 : 1,
                      borderLeft:
                        isMiddle && sIdx !== 0
                          ? '2px dashed #9ca3af'
                          : undefined,
                      borderRight:
                        isMiddle &&
                          sIdx !== overlappingStages.length - 1
                          ? '2px dashed #9ca3af'
                          : undefined,
                    }}
                    title={s.stage}
                  >
                    {isCurrent ? s.days : ''}
                  </div>
                );
              })}
            </div>
          </td>
        );
      })}


      {/* RIGHT SUMMARY COLUMNS */}
      <td
        className="border-x border-gray-200 sticky bg-white text-right h-[25px] p-0"
        style={{ minWidth: '50px', right: '200px' }}
      />
      <td
        className="border-x border-gray-200 sticky bg-white text-right h-[25px] p-0"
        style={{ minWidth: '100px', right: '100px' }}
      />
      <td
        className="border-x border-gray-200 sticky bg-white text-right h-[25px] p-0"
        style={{ minWidth: '100px', right: '0px' }}
      />
    </tr>

  );

  // --- Modal rendered outside table row ---
  const modal = isModalOpen ? (
    <div className="fixed inset-0 z-50 bg-black/30 backdrop-blur-sm flex items-end justify-center sm:items-center">
      <div className="bg-white rounded-t-2xl sm:rounded-xl w-full max-w-2xl p-8 shadow-xl animate-slide-up relative">
        <button
          onClick={() => {
            saveAllStageEdits();
            setIsModalOpen(false);
          }}
          className="absolute top-4 right-4 text-gray-500 hover:text-gray-700 transition"
          aria-label="Close"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        <h3 className="text-2xl font-semibold text-gray-900 mb-4">Edit All Stage Date Ranges</h3>
        <div className="overflow-x-auto">
          <table className="min-w-full border text-xs">
            <thead>
              <tr className="bg-gray-100">
                <th className="px-3 py-2 border-b text-left">Stage</th>
                <th className="px-3 py-2 border-b text-left">Start Date</th>
                <th className="px-3 py-2 border-b text-left">End Date</th>
              </tr>
            </thead>
            <tbody>
              {stageEdits.map((s, sIdx) => (
                <tr key={stages[sIdx].stage_id || stages[sIdx].stage} className="border-b">
                  <td className="px-3 py-2 font-medium text-gray-900">{stages[sIdx].stage || stages[sIdx].stage_name}</td>
                  <td className="px-3 py-2">
                    <input
                      type="date"
                      className="border border-gray-300 rounded px-2 py-1 text-xs focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      value={s.start || ''}
                      onChange={e => {
                        const val = e.target.value;
                        setStageEdits(edits => edits.map((item, idx) => idx === sIdx ? { ...item, start: val } : item));
                      }}
                    />
                  </td>
                  <td className="px-3 py-2">
                    <input
                      type="date"
                      className="border border-gray-300 rounded px-2 py-1 text-xs focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      value={s.end || ''}
                      onChange={e => {
                        const val = e.target.value;
                        setStageEdits(edits => edits.map((item, idx) => idx === sIdx ? { ...item, end: val } : item));
                      }}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="flex justify-end mt-8 space-x-3">
          <button
            className="px-4 py-2 text-base bg-gray-200 rounded hover:bg-gray-300"
            onClick={() => {
              saveAllStageEdits();
              setIsModalOpen(false);
            }}
          >
            Close & Save
          </button>
        </div>
      </div>
    </div>
  ) : null;

  return (
    <>
      {row}
      {modal}
    </>
  );
};
