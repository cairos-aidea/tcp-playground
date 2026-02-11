import React from 'react';
import Select from 'react-select';
import { X, UserRoundX } from 'lucide-react';

const getRankShort = (rank) => {
  if (!rank) return '?';
  const words = rank.trim().split(' ');
  return words.length === 1
    ? rank.slice(0, 2)
    : words
      .map((w, i) =>
        i === 0 ? w[0].toUpperCase() : w.replace(/\D/g, '') || w[0].toUpperCase()
      )
      .join('');
};

export const SubsidiaryRow = ({
  person,
  index,
  allPersons,
  weeks,
  stages,
  allocations,
  setAllocations,
  selectedCells,
  selectedProject,
  staffs,
  departments,
  onPersonChange,
  onRemove,
  onCellMouseDown,
  onCellMouseOver,
  getCellKey,
  getOverlapWorkingDays,
  getPersonTotals,
  hiddenStages = [],
  phase
}) => {
  const totals = getPersonTotals(person.id, hiddenStages, phase);
  const isDisabled = !person.id;
  const projectSubsidiaryId = selectedProject ? selectedProject.project_studio.subsidiary_id : null;
  const projectStudioId = selectedProject ? selectedProject.project_studio.id : null;

  const filteredStaffs = React.useMemo(() => {
    if (!projectSubsidiaryId) return staffs;
    return staffs.filter((s) => s.subsidiary_id !== projectSubsidiaryId);
  }, [staffs, projectSubsidiaryId]);

  const groupedStaffOptions = React.useMemo(() => {
    let studioName = '';
    if (selectedProject && selectedProject.project_studio && selectedProject.project_studio.name) {
      studioName = selectedProject.project_studio.name;
    }

    const selectedEmployeeIds = new Set(
      (allPersons || [])
        .filter(p => p.id !== person.id && p.employee_id)
        .map(p => p.employee_id)
    );

    const availableStaffs = filteredStaffs.filter(
      s => !selectedEmployeeIds.has(s.employee_id)
    );

    const deptGroups = {};
    availableStaffs.forEach((s) => {
      let groupKey = '';
      if (projectStudioId && s.studio_id === projectStudioId) {
        groupKey = studioName || 'Studio';
      } else {
        const deptObj = departments.find((d) => d.id === s.department_id);
        groupKey = deptObj ? deptObj.name : s.department_id;
      }
      if (!deptGroups[groupKey]) deptGroups[groupKey] = [];
      deptGroups[groupKey].push(s);
    });

    const getLastName = (name) => {
      if (!name) return '';
      const parts = name.trim().split(' ');
      return parts.length > 1 ? parts[parts.length - 1].toLowerCase() : parts[0].toLowerCase();
    };

    return Object.entries(deptGroups).map(([groupLabel, staffArr]) => {
      const sortedStaffArr = [...staffArr].sort((a, b) => {
        const aLast = getLastName(a.name);
        const bLast = getLastName(b.name);
        return aLast.localeCompare(bLast);
      });

      const getRankShort = (rank) => {
        if (!rank) return '?';
        const words = rank.trim().split(' ');
        return words.length === 1
          ? rank.slice(0, 2)
          : words
            .map((w, i) =>
              i === 0 ? w[0].toUpperCase() : w.replace(/\D/g, '') || w[0].toUpperCase()
            )
            .join('');
      };

      return {
        label: groupLabel,
        options: sortedStaffArr.map((s) => {
          const deptObj = departments.find((d) => d.id === s.department_id);
          const deptName = deptObj ? deptObj.name : s.department_id;
          // Show rank as plain text, not a circle
          return {
            value: s.employee_id,
            label: (
              <span className="flex items-center gap-2 text-xs">
                <span className="font-semibold text-gray-700 text-xs">{getRankShort(s.rank)}</span>
                <span className="truncate">{s.name}</span>
              </span>
            ),
          };
        }),
      };
    });
  }, [filteredStaffs, departments, projectStudioId, selectedProject]);

  // Determine row background color based on even/odd index
  const rowBg = index % 2 === 0 ? 'bg-white' : 'bg-gray-50';

  return (
    <tr className={rowBg}>
      <td
        colSpan={1}
        className={`sticky left-0 ${rowBg}`}
      >
        <div className="flex items-center w-full border-r border-gray-400">
          <div className="flex-1">
            {person.has_actual === 'yes' ? (
              <span className="flex items-center justify-between w-full text-xs font-semibold text-gray-700 px-2">
                <span className="flex items-center gap-2">
                  <span className="font-semibold text-gray-700 text-xs">
                    {getRankShort(person.rank)}
                  </span>
                  <span className="font-normal text-gray-700 text-xs">
                    {person.name}
                  </span>
                </span>

                {person.is_active === 'no' ? (
                  <UserRoundX className="text-gray-500" size={16} />
                ) : (
                  // <UserRoundCheck className="text-green-600" size={16}/>
                  <></>
                )}
              </span>
            ) : (
              <Select
                className="text-xs text-left"
                value={
                  filteredStaffs
                    .filter((s) => s.employee_id === person.employee_id)
                    .map((s) => {
                      return {
                        value: s.employee_id,
                        label: (
                          <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <span className="font-semibold text-gray-700 text-xs">{getRankShort(s.rank)}</span>
                            {`${s.name}`}
                          </span>
                        ),
                      };
                    })[0] || null
                }
                onChange={(option) => {
                  const staff = filteredStaffs.find((s) => s.employee_id === option?.value);
                  if (staff) {
                    onPersonChange(index, {
                      id: staff.id,
                      name: staff.name,
                      employee_id: staff.employee_id,
                      rank: staff.rank,
                      department_id: staff.department_id,
                    });
                  }
                }}
                options={groupedStaffOptions}
                placeholder="Select staff"
                menuPortalTarget={document.body}
                menuPlacement="auto"
                menuPosition="fixed"
                isSearchable={true}
                filterOption={(option, inputValue) => {
                  let labelText = '';
                  if (option.data && option.data.label && option.data.label.props && option.data.label.props.children) {
                    labelText = option.data.label.props.children
                      .filter((c) => typeof c === 'string')
                      .join(' ')
                      .toLowerCase();
                  }
                  return labelText.includes(inputValue.toLowerCase());
                }}
                styles={{
                  menuPortal: (base) => ({ ...base, zIndex: 999 }),
                  control: (base, state) => ({
                    ...base,
                    padding: 2,
                    minHeight: '100%',
                    height: '100%',
                    borderRadius: 0,
                    borderStyle: 'none',
                    borderWidth: 0,
                    boxSizing: 'border-box',
                    backgroundColor: index % 2 === 0 ? 'white' : '#f9fafb', // bg-white / bg-gray-100
                  }),
                  dropdownIndicator: (base) => ({
                    ...base,
                    padding: 2,
                  }),
                  input: (base) => ({
                    ...base,
                    margin: 0,
                    padding: 2,
                  }),
                  menu: (base, state) => ({
                    ...base,
                    ...(state.selectProps.menuPlacement === 'top' && {
                      bottom: '100%',
                      top: 'auto',
                    }),
                  }),
                }}
              />
            )}
          </div>
          <button
            onClick={() => onRemove(index, phase)}
            className="text-red-500 hover:text-red-700 hover:bg-red-50 rounded transition-colors mx-2"
            title="Remove person"
          >
            <X size={16} />
          </button>
        </div>
      </td>

      {(() => {
        // Helper to parse cellKey: expects format personId-stageId-weekKey-type
        function parseCellKey(cellKey) {
          const parts = cellKey.split('-');
          // personId-stageId-weekKey-type
          return {
            personId: parts[0],
            stageId: parts[1],
            weekKey: parts[2],
            type: parts[3],
          };
        }

        // Build a map of out-of-range allocations for this person, by weekKey
        const outOfRangeAllocations = {};
        Object.entries(allocations).forEach(([cellKey, value]) => {
          if (!value || value === '') return;
          const { personId, stageId, weekKey, type } = parseCellKey(cellKey);
          if (type !== 'subsidiary' || String(person.id) !== String(personId)) return;
          // Find the stage
          const stage = stages.find(s => String(s.stage_id || s.stage) === String(stageId));
          if (!stage) return;
          // Find the week
          const week = weeks.find(w => `${w.year}_${w.month}_${w.weekNum}` === weekKey);
          if (!week) return; // Only show in visible weeks
          // Check if this week is outside the stage's start/end
          const weekStart = new Date(week.start);
          const weekEnd = new Date(week.end);
          const stageStart = stage.start ? new Date(stage.start) : null;
          const stageEnd = stage.end ? new Date(stage.end) : null;
          let isOutOfRange = false;
          if (stageStart && weekEnd < stageStart) isOutOfRange = true;
          if (stageEnd && weekStart > stageEnd) isOutOfRange = true;
          if (isOutOfRange) {
            if (!outOfRangeAllocations[weekKey]) outOfRangeAllocations[weekKey] = [];
            outOfRangeAllocations[weekKey].push({ cellKey, value, stage });
          }
        });

        const today = new Date();
        today.setHours(0, 0, 0, 0);
        return weeks.map((w, i) => {
          const isLastWeekOfMonth = i === weeks.length - 1 || w.month !== weeks[i + 1]?.month;
          const isLastMonthOfYear = i === weeks.length - 1 || w.month === 11 && (weeks[i + 1]?.month !== 11 || !weeks[i + 1]);
          const weekKey = `${w.year}_${w.month}_${w.weekNum}`;
          const overlappingStages = stages.filter((stage) => {
            const days = getOverlapWorkingDays(
              { start: stage.start, end: stage.end },
              { start: w.start, end: w.end }
            );
            return days > 0;
          });
          const baseWidth = 24;
          const splitWidth = 24;
          const weekEnd = new Date(w.end);
          weekEnd.setHours(0, 0, 0, 0);

          const yearMonthOfEnd = weekEnd.getFullYear() * 12 + weekEnd.getMonth();
          const yearMonthToday = today.getFullYear() * 12 + today.getMonth();

          const isPastMonth = yearMonthOfEnd < yearMonthToday;

          // Render normal overlapping stages cells
          const cells = overlappingStages.length > 0 ? (
            <div className="flex h-full">
              {overlappingStages.map((stage, stageIdx) => {
                const stageIdOrName = stage.stage_id ? stage.stage_id : stage.stage;
                const cellKey = getCellKey(
                  person.id,
                  stageIdOrName,
                  weekKey,
                  'subsidiary'
                );
                const isSelected = selectedCells.includes(cellKey);
                const isStageHidden = hiddenStages.includes(stageIdOrName);
                return (
                  <input
                    data-cell-key={cellKey}
                    key={cellKey}
                    type="text"
                    className={`border-0 focus:ring-1 focus:ring-blue-500 text-right px-1 h-full w-full outline-none transition-colors ${isSelected
                      ? 'bg-yellow-100 ring-1 ring-yellow-500'
                      : isDisabled || isStageHidden || isPastMonth
                        ? 'text-gray-400 cursor-not-allowed'
                        : ''
                      }`}
                    style={{
                      width: overlappingStages.length === 1 ? `${baseWidth}px` : `${splitWidth}px`,
                      minWidth: overlappingStages.length === 1 ? `${baseWidth}px` : `${splitWidth}px`,
                      borderRight: stageIdx < overlappingStages.length - 1 ? '1.5px dashed #d1d5db' : undefined,
                      fontSize: '11px',
                      color: isStageHidden ? 'transparent' : undefined,
                      textShadow: isStageHidden ? '0 0 5px rgba(0,0,0,0.3)' : undefined,
                      backgroundColor:
                        isSelected
                          ? '#FEF3C7' // yellow-100
                          : isDisabled || isStageHidden || isPastMonth
                            ? '#F3F4F6' // gray-100
                            : index % 2 === 0
                              ? 'white'       // rowBg = bg-white
                              : '#f9fafb',    // rowBg = bg-gray-200
                    }}
                    value={allocations[cellKey] ?? ''}
                    onChange={(e) => {
                      if (isDisabled) return;

                      let raw = e.target.value.replace(/[^0-9.]/g, '');

                      // keep only 1 dot
                      const firstDot = raw.indexOf(".");
                      if (firstDot !== -1) {
                        raw = raw.slice(0, firstDot + 1) + raw.slice(firstDot + 1).replace(/\./g, '');
                      }

                      const parts = raw.split(".");
                      let intRaw = parts[0].slice(0, 3);       // up to 3 digits
                      let decPart = parts[1] ? parts[1].slice(0, 2) : '';

                      // DO NOT strip zeros anymore
                      const formatted =
                        decPart !== "" ? `${intRaw}.${decPart}` : intRaw;

                      setAllocations(prev => ({
                        ...prev,
                        [cellKey]: formatted
                      }));
                    }}

                    onPaste={(e) => {
                      e.preventDefault();

                      const pastedText = e.clipboardData.getData('text').replace(/[^0-9.]/g, '');
                      const parts = pastedText.split('.');
                      const intPart = parts[0].replace(/^0+/, '').slice(0, 3); // Remove leading zeros
                      const decPart = parts[1] ? parts[1].slice(0, 2) : '';
                      const formatted = intPart + (decPart ? '.' + decPart : '');

                      if (!isDisabled) {
                        setAllocations(prev => ({ ...prev, [cellKey]: formatted }));
                      }
                    }}
                    placeholder=""
                    title={`${person.name || 'Unassigned'} - ${stage.stage} (${allocations[cellKey] ?? 0} hrs)`}
                    autoComplete="off"
                    tabIndex={isDisabled || isStageHidden || isPastMonth ? -1 : 0}
                    onMouseDown={isDisabled || isStageHidden || isPastMonth ? undefined : () => onCellMouseDown(cellKey, phase)}
                    onMouseOver={isDisabled || isStageHidden || isPastMonth ? undefined : () => onCellMouseOver(cellKey, phase)}
                    disabled={isDisabled || isStageHidden || isPastMonth}
                  />
                );
              })}
            </div>
          ) :
            <div className="flex items-center justify-center w-full h-full" style={{ minHeight: '20px' }}>
              <svg width="20" height="20" viewBox="0 0 20 20">
                <line x1="2" y1="2" x2="18" y2="18" stroke="#d1d5db" strokeWidth="1" />
                <line x1="18" y1="2" x2="2" y2="18" stroke="#d1d5db" strokeWidth="1" />
              </svg>
            </div>
            ;

          // Render out-of-range allocations in a special cell (red font)
          const outOfRange = outOfRangeAllocations[weekKey] || [];
          const outOfRangeCell = outOfRange.length > 0 ? (
            <div className="flex flex-row h-full justify-center">
              {outOfRange.map(({ cellKey, value, stage }, idx) => (
                <div
                  key={cellKey}
                  className="border-0 bg-gray-100 h-full w-full outline-none flex justify-center items-center cursor-not-allowed"
                  style={{
                    color: 'red',
                    fontSize: '11px',
                    width: overlappingStages.length === 1 ? `${baseWidth}px` : `${splitWidth}px`,
                    minWidth: overlappingStages.length === 1 ? `${baseWidth}px` : `${splitWidth}px`,
                    borderRight: idx < outOfRange.length - 1 ? '1.5px dashed #d1d5db' : undefined,
                  }}
                  title={`${person.name || 'Unassigned'} - ${stage.stage || stage.stage_id} (${value} hrs)`}
                >
                  {value}
                </div>
              ))}
            </div>
          ) : null;

          // If both normal and out-of-range, render both (side by side)
          // baseWidth and splitWidth are always 24px
          return (
            <td
              key={i}
              className={`border-r ${isLastMonthOfYear ? 'border-r-2 border-gray-900' : isLastWeekOfMonth ? 'border-gray-800' : 'border-gray-200'}`}
              style={{
                minWidth:
                  overlappingStages.length === 1 && outOfRange.length === 0
                    ? `24px`
                    : `${24 * Math.max(1, overlappingStages.length + outOfRange.length)}px`,
                height: '20px',
                padding: 0,
                verticalAlign: 'top',
              }}
            >
              <div className="flex h-full">
                {cells}
                {outOfRangeCell}
              </div>
            </td>
          );
        });
      })()}

      <td
        className={`px-2 border-r border-gray-200 sticky ${rowBg} text-right text-xs`}
        style={{ minWidth: '100px', right: '100px' }}
      >
        {Number(totals.total).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
      </td>
      {/* <td
        className={`px-2 border-r border-gray-200 sticky ${rowBg} text-right text-xs`}
        style={{ minWidth: '100px', right: '100px' }}
      >
        ₱{Number(totals.pcb).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
      </td> */}
      <td
        className={`px-2 border-r border-gray-200 sticky ${rowBg} text-right text-xs`}
        style={{ minWidth: '100px', right: '0px' }}
      >
        ₱{Number(totals.pca).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
      </td>
    </tr>
  );
};
