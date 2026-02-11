import React, { useState, useEffect, useMemo, useRef } from 'react';
import DeleteModal from "./DeleteModal";
import { useAppData } from '../../../context/AppDataContext';
import { api } from '../../../api/api';
import { TableHeader } from './TableHeader';
import { ManpowerRow } from './ManpowerRow';
import { SubsidiaryRow } from './SubsidiaryRow';
import { SectionHeader } from './SectionHeader';
import { ProjectBudgetOverview } from "./ProjectBudgetOverview";
import { BEC_RATE, STAGE_COLORS } from './constants';
import ReactLoading from "react-loading";
import { countWorkingDays, getOverlapWorkingDays, getDateRange, getWeekOfMonth, getWeeksSplitByMonth, getUserFriendlyWeeks, getCellKey } from '../../../utilities/projects/etfHelpers';
import ETFSelection from './ETFSelection';
import { ArrowLeft, Menu } from 'lucide-react';

const ETF = () => {
  const prevAllocationsRef = useRef({});
  const debounceTimerRef = useRef(null);
  const isInitialLoad = useRef(true);
  const loadingBarRef = useRef(null);
  const [isProjectLoading, setIsProjectLoading] = useState(false);
  const {
    projects,
    staffs,
    departments,
    headerReq,
    rankOrder
  } = useAppData();

  const [selectedCells, setSelectedCells] = useState([]);
  const [dragStartCell, setDragStartCell] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const [hiddenStages, setHiddenStages] = useState([]);
  const [selectedProjectId, setSelectedProjectId] = useState(null);
  const [etfStages, setEtfStages] = useState([]);
  const [manpowerList, setManpowerList] = useState([]);
  const [subsidiaryManpowerList, setSubsidiaryManpowerList] = useState([]);
  const [weeks, setWeeks] = useState([]);
  const [userFriendlyWeeks, setUserFriendlyWeeks] = useState([]);
  const [allocations, setAllocations] = useState({});
  const [manpowerBudget, setManpowerBudget] = useState(null);
  const [budget, setBudget] = useState(null);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [timeCharges, setTimeCharges] = useState([]);

  const resetProjectState = () => {
    setSelectedProjectId(null);
    setEtfStages([]);
    setManpowerList([]);
    setSubsidiaryManpowerList([]);
    setAllocations({});
    setBudget(null);
    setManpowerBudget(null);
    setWeeks([]);
    setUserFriendlyWeeks([]);
    setHiddenStages([]);
    setIsProjectLoading(false);
  };

  const [isStageModalOpen, setIsStageModalOpen] = useState(false);
  const [stageEdits, setStageEdits] = useState([]);

  const handleOpenStageModal = () => {
    setStageEdits(etfStages.map(s => ({ start: s.start || '', end: s.end || '' })));
    setIsStageModalOpen(true);
  };

  const saveAllStageEdits = (stageEdits, stages, onStageChange) => {
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
          changedStages.forEach((payload) => {
            const stageIdx = stages.findIndex(s => s.stage_id === payload.id);
            if (stageIdx !== -1) {
              onStageChange(stageIdx, 'start', payload.start_date);
              onStageChange(stageIdx, 'end', payload.end_date);
            }
          });
          {
            api("etf_time_charges", { ...headerReq, id: selectedProjectId })
              .then((etfTimeChargesRes) => {
                setTimeCharges(etfTimeChargesRes || []);
                const allocationsMap = {};
                if (Array.isArray(etfTimeChargesRes)) {
                  etfTimeChargesRes.forEach(item => {
                    const isSubsidiary = item.is_subsidiary_manpower === 1;
                    const type = isSubsidiary ? 'subsidiary' : 'manpower';
                    const stageObj = {
                      stage_id: item.stage_id,
                      stage: `Stage ${item.stage_id}`,
                      start: item.start_date,
                      end: item.end_date,
                    };
                    const startDate = new Date(item.start_date);
                    const endDate = new Date(item.end_date);
                    const dateRange = getDateRange(startDate, endDate);
                    const weekGroups = {};
                    dateRange.forEach(date => {
                      const key = `${date.getFullYear()}_${date.getMonth()}_${getWeekOfMonth(date)}`;
                      weekGroups[key] = weekGroups[key] || [];
                      weekGroups[key].push(date);
                    });
                    Object.entries(weekGroups).forEach(([weekKey, dates]) => {
                      const workingDays = countWorkingDays(dates);
                      if (workingDays > 0) {
                        allocationsMap[getCellKey(item.user_id, stageObj, weekKey, type)] = item.etf_hours;
                      }
                    });
                  });
                }
                setAllocations(allocationsMap);
              });
          }
        })
        .catch((error) => console.error('Failed to update stage dates:', error)
        );
    }
  };

  const processManpowerList = (data = []) => {
    const seen = new Set();
    const unique = data.reduce((acc, item) => {
      // Allow same user_id if phase is different
      const key = `${item.user_id}_${item.phase || ''}`;
      if (!seen.has(key)) {
        seen.add(key);
        seen.add(item.user_id);
        acc.push({
          id: item.user.id,
          name: item.user.name,
          employee_id: item.user.employee_id,
          rank: item.user.rank,
          department_id: item.user.department_id,
          is_active: item.user.is_active,
          phase: item.phase || null,
        });
      }
      return acc;
    }, []);

    const getLastNameStart = (name = "") => {
      const parts = name.trim().split(" ");
      const last = parts.length > 1 ? parts[parts.length - 1] : parts[0];
      return last[0]?.toUpperCase() || "";
    };

    unique.sort((a, b) => {
      const rankA = rankOrder.indexOf(a.rank);
      const rankB = rankOrder.indexOf(b.rank);
      if (rankA !== rankB) return rankA - rankB;
      return getLastNameStart(a.name).localeCompare(getLastNameStart(b.name));
    });

    return unique;
  };

  const buildAllocations = (data = [], type) => {
    const allocations = {};
    data.forEach(item => {
      const startDate = new Date(item.start_date);
      const endDate = new Date(item.end_date);
      const stageObj = {
        stage_id: item.stage_id,
        stage: `Stage ${item.stage_id}`,
        start: item.start_date,
        end: item.end_date,
      };

      const dateRange = getDateRange(startDate, endDate);
      const weekGroups = {};

      dateRange.forEach(date => {
        const key = `${date.getFullYear()}_${date.getMonth()}_${getWeekOfMonth(date)}`;
        weekGroups[key] = weekGroups[key] || [];
        weekGroups[key].push(date);
      });

      Object.entries(weekGroups).forEach(([weekKey, dates]) => {
        const workingDays = countWorkingDays(dates);
        if (workingDays > 0) {
          allocations[getCellKey(item.user.id, stageObj, weekKey, type)] = item.etf_hours;
        }
      });
    });
    return allocations;
  };

  const completeLoading = () => {
    setIsProjectLoading(false);
    if (loadingBarRef.current) loadingBarRef.current.complete();
  };

  useEffect(() => {
    document.title = "ETF | Aidea Time Charging";
    if (!selectedProjectId) return;

    const hasValue = (v) => v !== undefined && v !== null;

    setIsProjectLoading(true);
    Promise.all([
      api("project_etf_versions", { ...headerReq, id: selectedProjectId }),
      api("project_budget", { ...headerReq, id: selectedProjectId }),
      api("etf_time_charges", { ...headerReq, id: selectedProjectId })
    ])
      .then(([etfRes, budgetRes, etfTimeChargesRes]) => {
        // Format ETF versions: version 0 as 'CURRENT VERSION', others as locked
        const formattedVersions = (etfRes || []).map(v => ({
          ...v,
          display: v.version_number === 0 ? 'CURRENT VERSION' : `Version ${v.version_number}`,
          editable: v.version_number === 0
        }));

        // Set default version to 0 if available, else first available
        let defaultVersion = null;
        if (formattedVersions.length > 0 && formattedVersions.some(v => v.version_number === 0)) {
          defaultVersion = 0;
        } else if (formattedVersions.length > 0) {
          defaultVersion = formattedVersions[0].version_number;
        }

        // Set stages according to selected version
        let stages = [];
        let phaseSheetsObj = {};
        if (formattedVersions.length > 0) {
          const foundVersion = formattedVersions.find(v => v.version_number === defaultVersion);
          if (foundVersion && Array.isArray(foundVersion.stages)) {
            stages = foundVersion.stages.map(stage => ({
              phase: stage.phase ?? null,
              stage: stage.stage_name,
              start: stage.start_date,
              end: stage.end_date,
              stage_id: stage.id,
            }));
            stages.sort((a, b) => {
              const aStart = new Date(a.start).getTime();
              const bStart = new Date(b.start).getTime();
              if (aStart !== bStart) return aStart - bStart;
              const aEnd = new Date(a.end).getTime();
              const bEnd = new Date(b.end).getTime();
              return aEnd - bEnd;
            });
            // Group stages by phase
            const allPhases = stages.map(s => s.phase);
            const hasPhases = allPhases.some(p => p !== null);
            if (hasPhases) {
              stages.forEach(stage => {
                if (!phaseSheetsObj[stage.phase]) phaseSheetsObj[stage.phase] = [];
                phaseSheetsObj[stage.phase].push(stage);
              });
              // Set etfStages to all stages (across all phases)
              setEtfStages(stages);
            } else {
              // No phases, treat as single sheet
              phaseSheetsObj["No Phase"] = stages;
              setEtfStages(stages);
            }
          }
        }

        // Set budget
        if (budgetRes && hasValue(budgetRes.manpower_budget)) {
          setBudget(budgetRes);
          setManpowerBudget(Number(budgetRes.manpower_budget));
        } else {
          setBudget(null);
          setManpowerBudget(null);
        }

        // Overwrite allocations for past weeks with etf_time_charges data
        setTimeCharges(etfTimeChargesRes || []);

        const today = new Date();
        today.setHours(0, 0, 0, 0);

        if (defaultVersion !== null && selectedProject) {
          api('project_etfs', {
            ...headerReq,
            id: selectedProject.id,
            version: defaultVersion
          })
            .then(res => {

              if (!res || res.length === 0) {
                // If no project_etfs, build lists and allocations from etf_time_charges
                let baseManpowerList = [];
                let baseSubsidiaryList = [];
                let allocationsMap = {};
                if (Array.isArray(etfTimeChargesRes)) {
                  etfTimeChargesRes.forEach(item => {
                    const isSubsidiary = item.is_subsidiary_manpower === 1;
                    // Build allocations for past weeks
                    const startDate = new Date(item.start_date);
                    const endDate = new Date(item.end_date);
                    const type = isSubsidiary ? 'subsidiary' : 'manpower';
                    const stageObj = {
                      stage_id: item.stage_id,
                      stage: `Stage ${item.stage_id}`,
                      start: item.start_date,
                      end: item.end_date,
                    };
                    const dateRange = getDateRange(startDate, endDate);
                    const weekGroups = {};
                    dateRange.forEach(date => {
                      const key = `${date.getFullYear()}_${date.getMonth()}_${getWeekOfMonth(date)}`;
                      weekGroups[key] = weekGroups[key] || [];
                      weekGroups[key].push(date);
                    });
                    Object.entries(weekGroups).forEach(([weekKey, dates]) => {
                      // Find the week end date
                      const weekEnd = new Date(Math.max(...dates.map(d => d.getTime())));
                      weekEnd.setHours(0, 0, 0, 0);
                      // Only allow if weekEnd < today AND NOT the week containing today
                      // Get week start and end
                      const weekStart = new Date(Math.min(...dates.map(d => d.getTime())));
                      weekStart.setHours(0, 0, 0, 0);
                      // If today is between weekStart and weekEnd (inclusive), skip
                      if (today >= weekStart && today <= weekEnd) return;
                      if (weekEnd < today) {
                        const workingDays = countWorkingDays(dates);
                        if (workingDays > 0) {
                          allocationsMap[getCellKey(item.user_id, stageObj, weekKey, type)] = item.etf_hours;
                        }
                      }
                    });
                  });
                }
                setManpowerList(baseManpowerList.map(item => ({ ...item })));
                setSubsidiaryManpowerList(baseSubsidiaryList.map(item => ({ ...item })));
                setAllocations(allocationsMap);
                completeLoading();
                return;
              }

              isInitialLoad.current = true;

              const manpowerData = res.filter(i => i.is_subsidiary_manpower === 0);
              const subsidiaryData = res.filter(i => i.is_subsidiary_manpower === 1);

              // Helper to check if user has actual data in timeCharges
              const userHasActual = (userId, isSubsidiary) => {
                if (!Array.isArray(etfTimeChargesRes)) return false;
                return etfTimeChargesRes.some(
                  (item) => String(item.user_id) === String(userId) && item.is_subsidiary_manpower === (isSubsidiary ? 1 : 0)
                );
              };

              let baseManpowerList = processManpowerList(manpowerData).map((p) => ({
                ...p,
                has_actual: userHasActual(p.id, false) ? 'yes' : 'no',
              }));
              let baseSubsidiaryList = processManpowerList(subsidiaryData).map((p) => ({
                ...p,
                has_actual: userHasActual(p.id, true) ? 'yes' : 'no',
              }));

              setManpowerList(baseManpowerList);
              setSubsidiaryManpowerList(baseSubsidiaryList);

              // Build allocations from project_etfs
              let allocationsMap = {
                ...buildAllocations(manpowerData, "manpower"),
                ...buildAllocations(subsidiaryData, "subsidiary"),
              };

              // Overwrite allocations for past weeks with etf_time_charges
              if (Array.isArray(etfTimeChargesRes)) {
                etfTimeChargesRes.forEach(item => {
                  const startDate = new Date(item.start_date);
                  const endDate = new Date(item.end_date);
                  const type = item.is_subsidiary_manpower === 1 ? 'subsidiary' : 'manpower';
                  const stageObj = {
                    stage_id: item.stage_id,
                    stage: `Stage ${item.stage_id}`,
                    start: item.start_date,
                    end: item.end_date,
                  };
                  const dateRange = getDateRange(startDate, endDate);
                  const weekGroups = {};
                  dateRange.forEach(date => {
                    const key = `${date.getFullYear()}_${date.getMonth()}_${getWeekOfMonth(date)}`;
                    weekGroups[key] = weekGroups[key] || [];
                    weekGroups[key].push(date);
                  });
                  Object.entries(weekGroups).forEach(([weekKey, dates]) => {
                    // Find the week end date
                    const weekEnd = new Date(Math.max(...dates.map(d => d.getTime())));
                    weekEnd.setHours(0, 0, 0, 0);
                    // Only allow if weekEnd < today AND NOT the week containing today
                    // Get week start and end
                    const weekStart = new Date(Math.min(...dates.map(d => d.getTime())));
                    weekStart.setHours(0, 0, 0, 0);
                    // If today is between weekStart and weekEnd (inclusive), skip
                    if (today >= weekStart && today <= weekEnd) return;
                    if (weekEnd < today) {
                      const workingDays = countWorkingDays(dates);
                      if (workingDays > 0) {
                        allocationsMap[getCellKey(item.user_id, stageObj, weekKey, type)] = item.etf_hours;
                      }
                    }
                  });
                });
              }

              setAllocations(allocationsMap);
              completeLoading();
            })
            .catch(err => {
              console.error(err);
              setEtfStages([]);
              setManpowerList([]);
              setSubsidiaryManpowerList([]);
              setAllocations({});
              completeLoading();
            });
        } else {
          setManpowerList([]);
          setSubsidiaryManpowerList([]);
          setAllocations({});
          completeLoading();
        }
      })
      .catch(err => {
        console.error("Failed to fetch project data:", err);
        resetProjectState();
        completeLoading();
      });
  }, [selectedProjectId]);

  const projectOptions = useMemo(() => {
    return (projects || [])
      .filter(
        p =>
          p.project_status !== "Lost Proposal" &&
          p.project_status !== "Aborted Proposal"
      )
      .map(p => ({
        value: p.id,
        label: `${p.project_code} - ${p.project_name}`,
      }));
  }, [projects]);

  const handleProjectChange = option => {
    // If the selected project is the same as current, do nothing
    if ((option && option.value === selectedProjectId) || (!option && !selectedProjectId)) {
      return;
    }
    if (!option) {
      resetProjectState();
      return;
    }
    setIsProjectLoading(true);
    setSelectedProjectId(option.value);
  };

  const handleSelectProject = (option) => {
    handleProjectChange(option);
  };

  const selectedProject = useMemo(
    () => projects.find(p => p.id === selectedProjectId),
    [projects, selectedProjectId]
  );

  // const addNewManpower = () => {
  //   const newPerson = {
  //     name: `Manpower ${manpowerList.length + 1}`,
  //   };
  //   setManpowerList([...manpowerList, newPerson]);
  // };

  // const addNewSubsidiaryManpower = () => {
  //   const newPerson = {
  //     name: `Subsidiary Manpower ${subsidiaryManpowerList.length + 1}`,
  //   };
  //   setSubsidiaryManpowerList([...subsidiaryManpowerList, newPerson]);
  // };

  // const handleRemoveManpower = (index) => {
  //   setDeleteTarget({ type: "manpower", index });
  //   setDeleteModalOpen(true);
  // };

  // const handleRemoveSubsidiaryManpower = (index) => {
  //   setDeleteTarget({ type: "subsidiary", index });
  //   setDeleteModalOpen(true);
  // };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    let user = null;
    let isSubsidiary = 0;
    let phase = null;
    if (deleteTarget.type === "manpower") {
      user = manpowerList[deleteTarget.index];
      isSubsidiary = 0;
      phase = user?.phase || null;
    } else if (deleteTarget.type === "subsidiary") {
      user = subsidiaryManpowerList[deleteTarget.index];
      isSubsidiary = 1;
      phase = user?.phase || null;
    }
    if (user && user.id) {
      try {
        await api("etf_delete", headerReq, {
          user_id: user.id,
          is_subsidiary_manpower: isSubsidiary,
          project_id: selectedProjectId
        });
        setAllocations(prev => {
          const updated = { ...prev };
          Object.keys(updated).forEach(key => {
            const parts = key.split("-");
            if (String(parts[0]) === String(user.id)) {
              delete updated[key];
            }
          });
          return updated;
        });
      } catch (err) {
        console.error("Failed to delete ETF:", err);
      }
    }
    if (deleteTarget.type === "manpower") {
      setManpowerList((list) => {
        // Remove the manpower at the given index
        const updated = list.filter((_, i) => i !== deleteTarget.index);
        // Remove the index property from all remaining items (if any), preserve phase
        return updated.map(({ index, phase, ...rest }) => ({ ...rest, phase }));
      });
    } else if (deleteTarget.type === "subsidiary") {
      setSubsidiaryManpowerList((list) => {
        // Remove the subsidiary manpower at the given index
        const updated = list.filter((_, i) => i !== deleteTarget.index);
        // Remove the index property from all remaining items (if any), preserve phase
        return updated.map(({ index, phase, ...rest }) => ({ ...rest, phase }));
      });
    }
    setDeleteModalOpen(false);
    setDeleteTarget(null);
  };

  const getCellCoords = (cellKey) => {
    const parts = cellKey.split("-");
    let isSubsidiary = false;
    if (parts[parts.length - 1] === "subsidiary") {
      isSubsidiary = true;
      parts.pop();
    }
    const [person, stage, ...weekArr] = parts;
    const weekKey = weekArr.join("-");
    return { person, stage, weekKey, isSubsidiary };
  }

  const handleCellMouseDown = (cellKey, phase) => {
    setSelectedCells([cellKey]);
    setDragStartCell(cellKey);
    setIsDragging(true);
  }

  const handleCellMouseOver = (cellKey, phase) => {
    if (isDragging && dragStartCell) {
      const firstCoords = getCellCoords(dragStartCell);
      const allCellKeys = firstCoords.isSubsidiary
        ? getAllSubsidiaryManpowerCellKeys()
        : getAllManpowerCellKeys();

      const rect = getSelectionRect(dragStartCell, cellKey, allCellKeys, phase);
      setSelectedCells(rect);

      const tableContainer = document.querySelector('.overflow-auto');
      if (tableContainer) {
        const cellElem = tableContainer.querySelector(`[data-cell-key="${cellKey}"]`);
        if (cellElem) {
          cellElem.scrollIntoView({ behavior: 'auto', block: 'nearest', inline: 'nearest' });
        }
      }
    }
  };

  const handleCellMouseUp = () => {
    setIsDragging(false);
    setDragStartCell(null);
  };

  const getAllManpowerCellKeys = () => {
    const keys = [];
    const uniquePersons = Array.from(new Set(manpowerList.map(p => p.id)));
    uniquePersons.forEach((personId) => {
      weeks.forEach((w) => {
        const weekKey = `${w.year}_${w.month}_${w.weekNum}`;
        etfStages.forEach((stage) => {
          const days = getOverlapWorkingDays(
            { start: stage.start, end: stage.end },
            { start: w.start, end: w.end }
          );
          if (days > 0) {
            keys.push(getCellKey(personId, stage, weekKey, 'manpower'));
          }
        });
      });
    });
    return keys;
  };

  const getAllSubsidiaryManpowerCellKeys = () => {
    const keys = [];
    const uniqueSubsidiaries = Array.from(new Set(subsidiaryManpowerList.map(p => p.id)));
    uniqueSubsidiaries.forEach((personId) => {
      weeks.forEach((w) => {
        const weekKey = `${w.year}_${w.month}_${w.weekNum}`;
        etfStages.forEach((stage) => {
          const days = getOverlapWorkingDays(
            { start: stage.start, end: stage.end },
            { start: w.start, end: w.end }
          );
          if (days > 0) {
            keys.push(getCellKey(personId, stage, weekKey, 'subsidiary'));
          }
        });
      });
    });
    return keys;
  };

  // Flexible: can filter by phaseName if provided, else all cells
  const getSelectionRect = (cellKeyA, cellKeyB, allCellKeys, phaseName = null) => {
    // If phaseName is provided, filter allCellKeys to only those in that phase
    let filteredCellKeys = allCellKeys;
    let allowedStageIds = null;
    let allowedPersons = null;
    if (phaseName !== null && typeof phaseName !== 'undefined') {
      // Get stageIds and persons for this phase
      allowedStageIds = etfStages
        .filter(s => (s.phase || 'No Phase') === phaseName)
        .map(s => String(s.stage_id));
      allowedPersons = [
        ...manpowerList.filter(p => (p.phase || 'No Phase') === phaseName).map(p => String(p.id)),
        ...subsidiaryManpowerList.filter(p => (p.phase || 'No Phase') === phaseName).map(p => String(p.id)),
      ];
      filteredCellKeys = allCellKeys.filter(k => {
        const { stage, person } = getCellCoords(k);
        return allowedStageIds.includes(String(stage)) && allowedPersons.includes(String(person));
      });
    }

    const coordsA = getCellCoords(cellKeyA);
    const coordsB = getCellCoords(cellKeyB);

    if (coordsA.isSubsidiary !== coordsB.isSubsidiary) return [cellKeyA];

    const persons = Array.from(new Set(filteredCellKeys.map(k => getCellCoords(k).person)));
    const weekKeys = Array.from(new Set(filteredCellKeys.map(k => getCellCoords(k).weekKey)));

    const rowA = persons.indexOf(coordsA.person);
    const rowB = persons.indexOf(coordsB.person);
    const colA = weekKeys.indexOf(coordsA.weekKey);
    const colB = weekKeys.indexOf(coordsB.weekKey);
    if (rowA === -1 || rowB === -1 || colA === -1 || colB === -1) return [cellKeyA];

    const minRow = Math.min(rowA, rowB);
    const maxRow = Math.max(rowA, rowB);
    const minCol = Math.min(colA, colB);
    const maxCol = Math.max(colA, colB);

    // Only select cells that are within the rectangular selection
    const selectedCellKeys = filteredCellKeys.filter(k => {
      const { person, weekKey, stage } = getCellCoords(k);
      const r = persons.indexOf(person);
      const c = weekKeys.indexOf(weekKey);

      // Filter out cells that belong to hidden stages
      if (hiddenStages.includes(stage)) return false;
      // If allowedStageIds is set, only allow those stageIds
      if (allowedStageIds && !allowedStageIds.includes(String(stage))) return false;
      // If allowedPersons is set, only allow those persons
      if (allowedPersons && !allowedPersons.includes(String(person))) return false;
      return r >= minRow && r <= maxRow && c >= minCol && c <= maxCol;
    });

    // console.log('Selection rect from', cellKeyA, 'to', cellKeyB, 'selected cells:', selectedCellKeys);

    return selectedCellKeys;
  };

  const handleTableCopy = (e) => {
    if (!selectedCells.length) return;
    const allCellKeys = selectedCells[0].includes('subsidiary')
      ? getAllSubsidiaryManpowerCellKeys()
      : getAllManpowerCellKeys();

    const persons = Array.from(new Set(allCellKeys.map(k => getCellCoords(k).person)));
    const weekKeys = Array.from(new Set(allCellKeys.map(k => getCellCoords(k).weekKey)));

    const rectCells = getSelectionRect(selectedCells[0], selectedCells[selectedCells.length - 1], allCellKeys);

    const rectCoords = rectCells.map(getCellCoords);
    const minRow = Math.min(...rectCoords.map(c => persons.indexOf(c.person)));
    const maxRow = Math.max(...rectCoords.map(c => persons.indexOf(c.person)));
    const minCol = Math.min(...rectCoords.map(c => weekKeys.indexOf(c.weekKey)));
    const maxCol = Math.max(...rectCoords.map(c => weekKeys.indexOf(c.weekKey)));

    const rows = [];
    for (let r = minRow; r <= maxRow; r++) {
      const row = [];
      for (let c = minCol; c <= maxCol; c++) {
        const cellKey = allCellKeys.find(k => {
          const coords = getCellCoords(k);
          return persons.indexOf(coords.person) === r && weekKeys.indexOf(coords.weekKey) === c;
        });
        row.push(cellKey ? (allocations[cellKey] ?? '') : '');
      }
      rows.push(row);
    }

    e.preventDefault();
    e.clipboardData.setData('text/plain', rows.map(row => row.join('\t')).join('\n'));
  };

  const handleTablePaste = (e) => {
    if (!selectedCells.length) return;
    const allCellKeys = selectedCells[0].includes('subsidiary')
      ? getAllSubsidiaryManpowerCellKeys()
      : getAllManpowerCellKeys();

    const persons = Array.from(new Set(allCellKeys.map(k => getCellCoords(k).person)));
    const weekKeys = Array.from(new Set(allCellKeys.map(k => getCellCoords(k).weekKey)));

    const rectCells = getSelectionRect(selectedCells[0], selectedCells[selectedCells.length - 1], allCellKeys);

    const rectCoords = rectCells.map(getCellCoords);
    const minRow = Math.min(...rectCoords.map(c => persons.indexOf(c.person)));
    const minCol = Math.min(...rectCoords.map(c => weekKeys.indexOf(c.weekKey)));

    e.preventDefault();
    const text = e.clipboardData.getData('text/plain');
    const rows = text.split('\n').map(row => row.split('\t'));

    setAllocations(prev => {
      const updated = { ...prev };
      for (let r = 0; r < rows.length; r++) {
        for (let c = 0; c < rows[r].length; c++) {
          const personIdx = minRow + r;
          const weekIdx = minCol + c;
          if (personIdx < persons.length && weekIdx < weekKeys.length) {
            const cellKey = allCellKeys.find(k => {
              const coords = getCellCoords(k);
              return persons.indexOf(coords.person) === personIdx && weekKeys.indexOf(coords.weekKey) === weekIdx;
            });
            if (cellKey) {
              updated[cellKey] = rows[r][c];
            }
          }
        }
      }
      return updated;
    });
  };

  useEffect(() => {
    // Only run for user edits, not initial load
    if (isInitialLoad.current) {
      prevAllocationsRef.current = { ...allocations };
      isInitialLoad.current = false;
      return;
    }

    // Detect changes in allocations
    const prev = prevAllocationsRef.current;
    const changes = [];
    Object.entries(allocations).forEach(([cellKey, value]) => {
      if (prev[cellKey] !== value) {
        changes.push({ cellKey, value });
      }
    });

    // Debounce logging of changes
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }
    if (changes.length > 0) {
      debounceTimerRef.current = setTimeout(() => {
        const etfPayload = changes.map(({ cellKey, value }) => {
          const [person, stageId, weekKey, type] = cellKey.split("-");
          const [year, month, weekNum] = weekKey.split("_").map(Number);

          const weekObj = weeks.find(
            (w) => w.year === year && w.month === month && w.weekNum === weekNum
          );

          // Convert to GMT+0800
          let start_date = null;
          let end_date = null;
          const toGMT8 = (dateObj) => {
            if (!dateObj) return null;
            const offsetMs = 8 * 60 * 60 * 1000; // GMT+8 offset in ms
            const gmt8Date = new Date(dateObj.getTime() + offsetMs);
            const pad = (n) => n.toString().padStart(2, '0');
            const yyyy = gmt8Date.getUTCFullYear();
            const mm = pad(gmt8Date.getUTCMonth() + 1);
            const dd = pad(gmt8Date.getUTCDate());
            return `${yyyy}-${mm}-${dd}`;
          };

          if (weekObj) {
            const weekStart = new Date(weekObj.start);
            const weekEnd = new Date(weekObj.end);
            const monthStart = new Date(weekStart.getFullYear(), weekStart.getMonth(), 1);
            const monthEnd = new Date(weekStart.getFullYear(), weekStart.getMonth() + 1, 0);

            start_date = weekStart < monthStart ? monthStart : weekStart;
            end_date = weekEnd > monthEnd ? monthEnd : weekEnd;

            start_date = toGMT8(start_date);
            end_date = toGMT8(end_date);
          }

          // Determine is_actual: if from etf_time_charges, is_actual = 1; if from project_etfs, is_actual = 0
          // We assume allocations from etf_time_charges have a key present in timeCharges, otherwise from project_etfs
          let is_actual = 0;
          if (Array.isArray(timeCharges)) {
            // Try to match by user_id, stage_id, weekKey, type
            const found = timeCharges.find((item) => {
              const itemUser = String(item.user_id);
              const itemStage = String(item.stage_id);
              const itemType = item.is_subsidiary_manpower === 1 ? 'subsidiary' : 'manpower';
              // Build all weekKeys for this item
              const startDate = new Date(item.start_date);
              const endDate = new Date(item.end_date);
              const dateRange = getDateRange(startDate, endDate);
              const weekGroups = {};
              dateRange.forEach(date => {
                const key = `${date.getFullYear()}_${date.getMonth()}_${getWeekOfMonth(date)}`;
                weekGroups[key] = true;
              });
              return (
                itemUser === String(person) &&
                itemStage === String(stageId) &&
                itemType === type &&
                weekGroups[weekKey]
              );
            });
            if (found) is_actual = 1;
          }

          return {
            user_id: person,
            stage_id: stageId,
            // week_key: weekKey,
            type,
            start_date,
            end_date,
            etf_hours: value,
            is_actual
          };
        });

        api('etf_save', headerReq, etfPayload)
          .then(res => {
          })
          .catch(err => {
          });
      }, 700);
    }
    prevAllocationsRef.current = { ...allocations };
  }, [allocations]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (!selectedCells.length) return;

      const isNumericKey = /^[0-9.]$/.test(e.key);

      // Escape clears selection
      if (e.key === 'Escape') {
        setSelectedCells([]);
        return;
      }

      // Backspace/Delete
      if ((e.key === 'Backspace' || e.key === 'Delete') && selectedCells.length > 1) {
        e.preventDefault();

        setAllocations(prev => {
          const updated = { ...prev };

          selectedCells.forEach(cellKey => {
            const current = updated[cellKey] ?? '';
            const inputElem = document.querySelector(`[data-cell-key="${cellKey}"] input, [data-cell-key="${cellKey}"] textarea`);

            if (inputElem) {
              const start = inputElem.selectionStart;
              const end = inputElem.selectionEnd;
              let newValue = current;

              // Delete selection first
              if (start !== end) {
                newValue = current.slice(0, start) + current.slice(end);
                inputElem.value = newValue;
                inputElem.setSelectionRange(start, start);
              }
              // Backspace
              else if (e.key === 'Backspace' && start > 0) {
                newValue = current.slice(0, start - 1) + current.slice(start);
                inputElem.value = newValue;
                inputElem.setSelectionRange(start - 1, start - 1);
              }
              // Delete
              else if (e.key === 'Delete' && start < current.length) {
                newValue = current.slice(0, start) + current.slice(start + 1);
                inputElem.value = newValue;
                inputElem.setSelectionRange(start, start);
              }

              updated[cellKey] = newValue;
            } else {
              updated[cellKey] = '';
            }
          });

          return updated;
        });

        return;
      }

      // Numeric input including decimal
      if (isNumericKey) {
        e.preventDefault();

        setAllocations(prev => {
          const updated = { ...prev };

          const formatValue = (val, keyPressed = null) => {
            val = val.replace(/[^0-9.]/g, '');
            const firstDot = val.indexOf('.');
            if (firstDot !== -1) {
              val = val.slice(0, firstDot + 1) + val.slice(firstDot + 1).replace(/\./g, '');
            }

            const parts = val.split('.');
            const intPart = parts[0].slice(0, 3);
            const decPart = parts[1] ? parts[1].slice(0, 2) : '';

            let result = intPart;
            if (val.includes('.') && (intPart.length > 0 || decPart.length > 0 || keyPressed === '.')) {
              result += '.';
            }
            if (decPart.length > 0) {
              result += decPart;
            }

            if (result === '' || result === '.') return '';
            return result;
          };

          selectedCells.forEach(cellKey => {
            const current = updated[cellKey] ?? '';
            const inputElem = document.querySelector(`[data-cell-key="${cellKey}"] input, [data-cell-key="${cellKey}"] textarea`);

            if (inputElem) {
              const cursorPos = inputElem.selectionStart;
              let newValue = current.slice(0, cursorPos) + e.key + current.slice(cursorPos);
              newValue = formatValue(newValue, e.key);

              inputElem.value = newValue;
              const newCursor = e.key === '.' && current.includes('.') ? cursorPos : cursorPos + 1;
              inputElem.setSelectionRange(newCursor, newCursor);

              updated[cellKey] = newValue;
            } else {
              updated[cellKey] = formatValue(current + e.key, e.key);
            }
          });

          return updated;
        });

        return;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedCells]);

  useEffect(() => {
    const handleDocumentMouseDown = (e) => {
      const table = document.querySelector('table');
      if (!table) return;
      if (!table.contains(e.target)) {
        setSelectedCells([]);
      }
    };
    document.addEventListener('mousedown', handleDocumentMouseDown);
    return () => {
      document.removeEventListener('mousedown', handleDocumentMouseDown);
    };
  }, []);

  useEffect(() => {
    if (isDragging) {
      window.addEventListener('mouseup', handleCellMouseUp);
    } else {
      window.removeEventListener('mouseup', handleCellMouseUp);
    }
    return () => window.removeEventListener('mouseup', handleCellMouseUp);
  }, [isDragging]);

  const getPersonBecRate = (personId) => {
    const staff = staffs?.find((s) => s.id === personId);
    if (!staff) return 0;
    // Try to find BEC_RATE for the selected year, fallback to 2024 if not found
    const year = (selectedProject && selectedProject.year) || 2025;
    let rateObj = BEC_RATE.find((r) => r.rank === staff.rank && r.year === year);
    if (!rateObj) {
      rateObj = BEC_RATE.find((r) => r.rank === staff.rank && r.year === 2025);
    }
    return rateObj ? rateObj.rate : 0;
  };

  const getPersonTotals = (personId, hiddenStages = [], phaseName = null) => {
    // Use allocations with keys remapped to match etfStages
    // const mappedAllocations = updateAllocationsToEtfStages(allocations, etfStages, timeCharges);
    const mappedAllocations = { ...allocations };

    // If phaseName is provided, filter only those stage_ids
    let stageIds = null;
    if (phaseName !== null && typeof phaseName !== 'undefined') {
      stageIds = etfStages
        .filter(s => (s.phase || 'No Phase') === phaseName)
        .map(s => String(s.stage_id));
    }

    // Include all allocations for stages that are not hidden (in-range and out-of-range)
    const entries = Object.entries(mappedAllocations).filter(([key]) => {
      if (!key.startsWith(personId + "-")) return false;
      const parts = key.split('-');
      const stageId = parts[1];
      // Exclude hidden stages
      if (hiddenStages.map(String).includes(String(stageId))) return false;
      // If phaseName provided, only include those stageIds
      if (stageIds && !stageIds.includes(String(stageId))) return false;
      return true;
    });

    const total = entries.reduce((sum, [, val]) => sum + (Number(val) || 0), 0);
    const becRateValue = getPersonBecRate(personId);
    const bec = becRateValue;
    let pcb = 0, pca = 0;

    pca = total * bec;

    // Calculate consumed_budget (allocations from previous months)
    // and plan_cost (allocations from current month onwards)
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth();

    let consumedSum = 0;
    let planSum = 0;

    entries.forEach(([key, val]) => {
      const parts = key.split('-');
      const weekKey = parts[2];
      const [year, month] = weekKey.split('_').map(Number);
      if (year < currentYear || (year === currentYear && month < currentMonth)) {
        consumedSum += Number(val) || 0;
      } else {
        planSum += Number(val) || 0;
      }
    });

    const consumed_budget = consumedSum * bec;
    const plan_cost = planSum * bec;

    return { total, bec, pcb, pca, consumed_budget, plan_cost, phase: phaseName };
  };

  // Compute grand totals per phase to avoid double-counting users in multiple phases
  const getGrandTotals = () => {
    // Get all unique phases from etfStages
    const phases = Array.from(
      new Set(etfStages.map(s => (s.phase || 'No Phase')))
    );

    // For each phase, get people in that phase only
    let total = { pcb: 0, pca: 0, consumed_budget: 0, plan_cost: 0 };
    phases.forEach(phaseName => {
      // Filter people in this phase only (by phase property in manpower/subsidiary lists)
      const peopleInPhase = [
        ...manpowerList.filter(p => (p.phase || 'No Phase') === phaseName).map(p => p.id),
        ...subsidiaryManpowerList.filter(p => (p.phase || 'No Phase') === phaseName).map(p => p.id)
      ];
      // For each person in this phase, compute totals for this phase only
      peopleInPhase.forEach(personId => {
        const t = getPersonTotals(personId, hiddenStages, phaseName);
        total.pcb += t.pcb;
        total.pca += t.pca;
        total.consumed_budget += t.consumed_budget || 0;
        total.plan_cost += t.plan_cost || 0;
      });
    });
    return total;
  };

  useEffect(() => {
    if (etfStages.length === 0) {
      setWeeks([]);
      setUserFriendlyWeeks([]);
      return;
    }
    const minStart = new Date(
      Math.min(...etfStages.map((s) => new Date(s.start).getTime()))
    );
    const maxEnd = new Date(
      Math.max(...etfStages.map((s) => new Date(s.end).getTime()))
    );
    const rawWeeks = getWeeksSplitByMonth(minStart, maxEnd);
    setWeeks(rawWeeks);
    setUserFriendlyWeeks(getUserFriendlyWeeks(rawWeeks));
  }, [etfStages]);

  const handleStageDateChange = (idx, field, value) => {
    setEtfStages((stages) => {
      const updated = [...stages];
      updated[idx] = { ...updated[idx], [field]: value };
      return updated;
    });
  };

  const sortedWeeks = userFriendlyWeeks.sort((a, b) => {
    if (a.year !== b.year) return a.year - b.year;
    return a.month - b.month;
  });

  const allPeople = [
    ...manpowerList.map((p) => p.id),
    ...subsidiaryManpowerList.map((p) => p.id),
  ];
  const grandTotals = getGrandTotals(allPeople);

  if (!selectedProjectId) {
    return (
      <ETFSelection
        isOpen={!selectedProjectId}
        onSelectProject={handleSelectProject}
      />
    );
  }

  return (
    <div className="flex flex-col h-screen">
      <div className="container-fluid h-full">
        {/* Top menu bar */}
        <div className="w-full flex items-center justify-between bg-white border-b border-gray-200 px-3 py-1 sticky top-0 z-40 min-h-0 h-[38px]">
          {/* Menu actions on the right */}
          <div className="flex gap-1 items-center">
            {/* <span>
              <Menu size={14} />
            </span> */}
            <span
              className={`text-xs text-primary px-2 py-1 rounded cursor-pointer hover:bg-gray-100 transition ${isProjectLoading ? 'opacity-50 pointer-events-none' : ''}`}
              onClick={() => resetProjectState()}
            >
              <ArrowLeft size={14} />
            </span>
            <div className="border-l border-gray-300"></div>
            <span
              className={`text-xs text-primary px-2 py-1 rounded cursor-pointer hover:bg-gray-100 transition ${isProjectLoading ? 'opacity-50 pointer-events-none' : ''}`}
              onClick={handleOpenStageModal}
            >
              Project Stages
            </span>
          </div>
          {/* Menu items on the left */}
          <div className="flex gap-4 items-center">
            <span
              className={`text-xs text-primary px-2 py-1 border-l border-gray-300 transition ${isProjectLoading ? 'opacity-50 pointer-events-none' : ''}`}
            >
              {selectedProject
                ? `${selectedProject.project_code} - ${selectedProject.project_name}`
                : "No Project Selected"}
            </span>
          </div>
        </div>

        <div className="w-full sticky top-[0] h-[80px] z-50 p-1 m-0 flex items-stretch">
          <ProjectBudgetOverview
            budgetRes={budget}
            consumedBudget={grandTotals.consumed_budget}
            planCost={grandTotals.plan_cost}
            isProjectLoading={isProjectLoading}
          />
        </div>

        <div className="grid grid-cols-12 h-[calc(100vh-118px)]">
          <div className="col-span-12 h-full flex flex-col relative overflow-x-auto overflow-y-auto">
            {(isProjectLoading) ? (
              <div className="flex items-center justify-center h-[calc(100vh-118px)] flex-col gap-4">
                <ReactLoading type="bars" color="#888888" />
              </div>
            ) : (
              <div className="h-full items-center justify-center ">
                <div className="max-h-full">
                  {/* Table */}
                  <table
                    className="text-xs sm:text-sm text-center border-separate border-spacing-[0px] min-w-[800px]"
                    onPaste={handleTablePaste}
                    onCopy={handleTableCopy}
                  >

                    {/* Group etfStages by phase */}
                    {(() => {
                      const phaseMap = {};
                      etfStages.forEach((stage) => {
                        const phase = stage.phase || 'No Phase';
                        if (!phaseMap[phase]) phaseMap[phase] = [];
                        phaseMap[phase].push(stage);
                      });
                      const phases = Object.keys(phaseMap);

                      // Helper to filter persons by phase
                      const getPersonsForPhase = (list, phaseStages, phaseName = null) => {
                        // Only include persons whose .phase matches this phaseName
                        return list.filter(person => (person.phase || 'No Phase') === phaseName);
                      };

                      return phases.map((phase, phaseIdx) => {
                        const phaseStages = phaseMap[phase];
                        // Weeks for this phase: all weeks in the table (sortedWeeks)
                        const manpowerForPhase = getPersonsForPhase(manpowerList, phaseStages, phase);
                        const subsidiaryForPhase = getPersonsForPhase(subsidiaryManpowerList, phaseStages, phase);

                        // Add functions that add to the correct phase
                        const addNewManpowerForPhase = () => {
                          setManpowerList((list) => {
                            // Only count people in this phase for naming
                            const phaseCount = list.filter(p => (p.phase || 'No Phase') === phase).length;
                            const newPerson = { name: `Manpower ${phaseCount + 1}`, phase };
                            return [...list, newPerson];
                          });
                        };

                        const addNewSubsidiaryManpowerForPhase = () => {
                          setSubsidiaryManpowerList((list) => {
                            const phaseCount = list.filter(p => (p.phase || 'No Phase') === phase).length;
                            const newPerson = { name: `Subsidiary Manpower ${phaseCount + 1}`, phase };
                            return [...list, newPerson];
                          });
                        };

                        const handleRemoveManpower = (idx, phase) => {
                          setManpowerList((list) => {
                            // Find the idx-th person in this phase
                            const phaseList = list.filter(p => (p.phase || 'No Phase') === phase);
                            const personToDelete = phaseList[idx];
                            const globalIndex = list.findIndex(p => p === personToDelete);
                            setDeleteTarget({ type: "manpower", index: globalIndex });
                            setDeleteModalOpen(true);
                            return list;
                          });
                        };

                        const handleRemoveSubsidiaryManpower = (idx, phase) => {
                          setSubsidiaryManpowerList((list) => {
                            const phaseList = list.filter(p => (p.phase || 'No Phase') === phase);
                            const personToDelete = phaseList[idx];
                            const globalIndex = list.findIndex(p => p === personToDelete);
                            setDeleteTarget({ type: "subsidiary", index: globalIndex });
                            setDeleteModalOpen(true);
                            return list;
                          });
                        };

                        return (
                          <React.Fragment key={phaseIdx}>
                            <TableHeader
                              projectOptions={projectOptions}
                              handleProjectChange={handleProjectChange}
                              selectedProjectId={selectedProjectId}
                              isProjectLoading={isProjectLoading}
                              weeks={sortedWeeks}
                              stages={phaseStages}
                              hiddenStages={hiddenStages}
                              onStageChange={handleStageDateChange}
                              getOverlapWorkingDays={getOverlapWorkingDays}
                              headerReq={headerReq}
                              selectedProject={selectedProject}
                              saveAllStageEdits={saveAllStageEdits}
                              onClearProject={() => {
                                resetProjectState();
                              }}
                              onOpenStageModal={handleOpenStageModal}
                              phase={phase}
                              phaseIdx={phaseIdx}
                            />

                            <tbody className="bg-white divide-y divide-gray-200">
                              <SectionHeader
                                title={`Manpower Allocation`}
                                colSpan={1}
                                color="gray"
                                weeks={sortedWeeks}
                              />

                              {manpowerForPhase.map((person, idx) => (
                                <ManpowerRow
                                  key={`${person.id ?? 'noid'}-${idx}`}
                                  person={person}
                                  index={idx}
                                  allPersons={manpowerForPhase}
                                  weeks={weeks}
                                  stages={phaseStages}
                                  allocations={allocations}
                                  setAllocations={setAllocations}
                                  selectedCells={selectedCells}
                                  selectedProject={selectedProject}
                                  staffs={staffs}
                                  departments={departments}
                                  isFirst={idx === 0}
                                  isLast={idx === manpowerForPhase.length - 1}
                                  onPersonChange={(idx, personData) => {
                                    setManpowerList((list) => {
                                      // Find the idx-th person in this phase
                                      const phaseList = list.filter(p => (p.phase || 'No Phase') === phase);
                                      const personToUpdate = phaseList[idx];
                                      const globalIndex = list.findIndex(p => p === personToUpdate);
                                      const updated = [...list];
                                      updated[globalIndex] = { ...updated[globalIndex], ...personData };
                                      return updated;
                                    });
                                  }}
                                  onRemove={handleRemoveManpower}
                                  onCellMouseDown={handleCellMouseDown}
                                  onCellMouseOver={handleCellMouseOver}
                                  getCellKey={getCellKey}
                                  getOverlapWorkingDays={getOverlapWorkingDays}
                                  getPersonTotals={getPersonTotals}
                                  hiddenStages={hiddenStages}
                                  phase={phase}
                                />
                              ))}

                              <SectionHeader
                                title="Add Manpower"
                                colSpan={1}
                                color="white"
                                onAdd={addNewManpowerForPhase}
                                addButtonText="Add New Manpower"
                                weeks={sortedWeeks}
                              />

                              <SectionHeader
                                title={`Subsidiary Manpower Allocation`}
                                colSpan={1}
                                color="gray"
                                weeks={sortedWeeks}
                              />

                              {subsidiaryForPhase.map((person, idx) => (
                                <SubsidiaryRow
                                  key={`${person.id ?? 'noid'}-${idx}`}
                                  person={person}
                                  index={idx}
                                  allPersons={subsidiaryForPhase}
                                  weeks={weeks}
                                  stages={phaseStages}
                                  allocations={allocations}
                                  setAllocations={setAllocations}
                                  selectedCells={selectedCells}
                                  selectedProject={selectedProject}
                                  staffs={staffs}
                                  departments={departments}
                                  onPersonChange={(idx, personData) => {
                                    setSubsidiaryManpowerList((list) => {
                                      const phaseList = list.filter(p => (p.phase || 'No Phase') === phase);
                                      const personToUpdate = phaseList[idx];
                                      const globalIndex = list.findIndex(p => p === personToUpdate);
                                      const updated = [...list];
                                      updated[globalIndex] = { ...updated[globalIndex], ...personData };
                                      return updated;
                                    });
                                  }}
                                  onCellMouseDown={handleCellMouseDown}
                                  onCellMouseOver={handleCellMouseOver}
                                  getCellKey={getCellKey}
                                  getOverlapWorkingDays={getOverlapWorkingDays}
                                  getPersonTotals={getPersonTotals}
                                  onRemove={handleRemoveSubsidiaryManpower}
                                  hiddenStages={hiddenStages}
                                  phase={phase}
                                />
                              ))}

                              <SectionHeader
                                title="Add Subsidiary Manpower"
                                colSpan={1}
                                color="white"
                                onAdd={addNewSubsidiaryManpowerForPhase}
                                addButtonText="Add Subsidiary Manpower"
                                weeks={sortedWeeks}
                              />
                            </tbody>
                          </React.Fragment>
                        );
                      });
                    })()}

                    <tr className="bg-gray-50 font-bold border-gray-300 sticky bottom-0 z-20">
                      <td
                        colSpan={1}
                        className="sticky left-0 bg-gray-100 px-2 py-3 font-semibold text-gray-900 text-sm whitespace-nowrap text-left"
                        style={{ minWidth: '200px', maxWidth: '200px' }}
                      >
                      </td>

                      {sortedWeeks.map((week, i) => (
                        <td
                          key={i}
                          className="bg-gray-100"
                          style={{ minWidth: '22px' }}
                        />
                      ))}

                      <td
                        className="sticky border-r border-gray-300 bg-gradient-to-r from-gray-100 to-gray-50 text-[12px] font-bold whitespace-nowrap"
                        style={{ minWidth: '100px', width: '100px', maxWidth: '100px', right: '100px' }}
                      >
                        TOTAL
                      </td>
                      <td
                        className={`sticky border-r border-gray-300 bg-gradient-to-r from-gray-100 to-gray-50 text-[12px] font-bold whitespace-nowrap ${manpowerBudget !== null ? (grandTotals.pca <= manpowerBudget ? 'text-green-600' : 'text-red-600') : ''}`}
                        style={{ minWidth: '100px', width: '100px', maxWidth: '100px', right: '0px' }}
                      >
                        ₱{grandTotals.pca.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </td>
                    </tr>
                  </table>

                  <DeleteModal
                    open={deleteModalOpen}
                    onClose={() => { setDeleteModalOpen(false); setDeleteTarget(null); }}
                    onConfirm={confirmDelete}
                    message={deleteTarget && deleteTarget.name ? `Are you sure you want to delete "${deleteTarget.name}"? This action cannot be undone.` : "Are you sure you want to delete this item? This action cannot be undone."}
                  />

                  {isStageModalOpen && (
                    <div className="fixed inset-0 z-50 bg-black/30 backdrop-blur-sm flex items-end justify-center sm:items-center">
                      <div className="bg-white rounded-t-2xl sm:rounded-xl w-full max-w-3xl p-8 shadow-xl animate-slide-up relative">
                        <button
                          onClick={() => setIsStageModalOpen(false)}
                          className="absolute top-4 right-4 text-gray-500 hover:text-gray-700 transition"
                          aria-label="Close"
                        >
                          <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                        <h3 className="text-2xl font-semibold text-gray-900 mb-6">Edit All Stage Date Ranges</h3>
                        <div className="overflow-x-auto">
                          <table className="min-w-full border text-xs text-gray-700">
                            <thead>
                              <tr className="bg-gray-100">
                                {etfStages.some(s => s.phase !== null && typeof s.phase !== 'undefined') && (
                                  <th className="px-4 py-3 text-left font-medium">Phase</th>
                                )}
                                <th className="px-4 py-3 text-left font-medium">Stage</th>
                                <th className="px-4 py-3 text-left font-medium">Start Date</th>
                                <th className="px-4 py-3 text-left font-medium">End Date</th>
                                <th className="px-4 py-3 text-left font-medium">Status</th>
                              </tr>
                            </thead>
                            <tbody>
                              {/* Sort stages by phase (alphabetically, 'No Phase' last) */}
                              {(() => {
                                // Determine the phase of the first stage, then group all stages of that phase first, then the rest by id order
                                let sortedStages = [];
                                if (etfStages.length > 0) {
                                  // Find the phase of the first stage (by id order)
                                  const firstStage = etfStages.reduce((min, s, idx) => {
                                    if (!min || (s.stage_id < min.stage_id)) return { ...s, _idx: idx };
                                    return min;
                                  }, null);
                                  const firstPhase = firstStage && (firstStage.phase || 'No Phase');

                                  // Get all stages of the first phase, sorted by stage_id
                                  const firstPhaseStages = etfStages
                                    .map((stage, idx) => ({ ...stage, _idx: idx }))
                                    .filter(s => (s.phase || 'No Phase') === firstPhase)
                                    .sort((a, b) => a.stage_id - b.stage_id);

                                  // Get all other stages, sorted by phase then stage_id
                                  const otherStages = etfStages
                                    .map((stage, idx) => ({ ...stage, _idx: idx }))
                                    .filter(s => (s.phase || 'No Phase') !== firstPhase)
                                    .sort((a, b) => {
                                      const phaseA = a.phase || 'No Phase';
                                      const phaseB = b.phase || 'No Phase';
                                      if (phaseA < phaseB) return -1;
                                      if (phaseA > phaseB) return 1;
                                      return a.stage_id - b.stage_id;
                                    });

                                  sortedStages = [...firstPhaseStages, ...otherStages];
                                } else {
                                  sortedStages = etfStages.map((stage, idx) => ({ ...stage, _idx: idx }));
                                }
                                return sortedStages.map((stageObj) => {
                                  const sIdx = stageObj._idx;
                                  const s = stageEdits[sIdx];
                                  const startDate = s.start ? new Date(s.start) : null;
                                  const endDate = s.end ? new Date(s.end) : null;
                                  const isValid = startDate && endDate && endDate >= startDate;
                                  // Track color index per phase
                                  let colorIdx = 0;
                                  // If previous phase is different, reset colorIdx
                                  if (
                                    sIdx === 0 ||
                                    (sortedStages[sIdx].phase || 'No Phase') !== (sortedStages[sIdx - 1]?.phase || 'No Phase')
                                  ) {
                                    colorIdx = 0;
                                  } else {
                                    // Count how many previous stages in same phase
                                    colorIdx = sortedStages
                                      .slice(0, sIdx)
                                      .filter(
                                        st =>
                                          (st.phase || 'No Phase') === (sortedStages[sIdx].phase || 'No Phase')
                                      ).length;
                                  }
                                  // Use colorIdx for color selection
                                  const stageColor =
                                    STAGE_COLORS[`stage${colorIdx + 1}`] || "rgba(187,247,208,0.65)";
                                  return (
                                    <tr key={etfStages[sIdx]?.stage_id || etfStages[sIdx]?.stage} className="border-b hover:bg-gray-50">
                                      {etfStages.some(s => s.phase !== null && typeof s.phase !== 'undefined') && (
                                        <td className="px-4 py-3 text-left">
                                          <span>{etfStages[sIdx]?.phase || 'No Phase'}</span>
                                        </td>
                                      )}
                                      <td className="px-4 py-3 text-left">
                                        <div className="flex items-center justify-left gap-3">
                                          <span
                                            className="inline-block w-4 h-4 rounded"
                                            style={{ background: stageColor, border: '1px solid #888' }}
                                            title="Stage color"
                                          />
                                          <span>{etfStages[sIdx]?.stage || etfStages[sIdx]?.stage_name}</span>
                                        </div>
                                      </td>
                                      <td className="px-4 py-3 text-center">
                                        <div className="flex items-center justify-left">
                                          <input
                                            type="date"
                                            className="border border-gray-300 rounded-md p-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition duration-200 text-center"
                                            value={s.start || ''}
                                            onChange={e => {
                                              const val = e.target.value;
                                              setStageEdits(edits =>
                                                edits.map((item, idx) => (idx === sIdx ? { ...item, start: val } : item))
                                              );
                                            }}
                                          />
                                        </div>
                                      </td>
                                      <td className="px-4 py-3 text-center">
                                        <div className="flex items-center justify-left">
                                          <input
                                            type="date"
                                            className="border border-gray-300 rounded-md p-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition duration-200 text-center"
                                            value={s.end || ''}
                                            onChange={e => {
                                              const val = e.target.value;
                                              setStageEdits(edits =>
                                                edits.map((item, idx) => (idx === sIdx ? { ...item, end: val } : item))
                                              );
                                            }}
                                          />
                                        </div>
                                      </td>
                                      <td className="px-4 py-3 text-center">
                                        <div className="flex items-center justify-left">
                                          {startDate && endDate ? (
                                            isValid ? (
                                              <span className="w-5 h-5 text-green-600 font-semibold mx-auto">✔</span>
                                            ) : (
                                              <span className="w-5 h-5 text-red-600 font-semibold mx-auto">✖</span>
                                            )
                                          ) : (
                                            <span className="text-gray-400">-</span>
                                          )}
                                        </div>
                                      </td>
                                    </tr>
                                  );
                                });
                              })()}
                            </tbody>
                          </table>
                        </div>
                        <div className="flex justify-end mt-8 space-x-3">
                          <button
                            className="px-6 py-3 bg-gray-200 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            onClick={() => {
                              // Check all status before saving
                              const allValid = stageEdits.every(s => {
                                if (!s.start || !s.end) return true;
                                return new Date(s.end) >= new Date(s.start);
                              });
                              if (!allValid) {
                                alert('Cannot save: Some stages have end date earlier than start date.');
                                return;
                              }
                              saveAllStageEdits(stageEdits, etfStages, handleStageDateChange);
                              setIsStageModalOpen(false);
                            }}
                            disabled={stageEdits.some(s => s.start && s.end && new Date(s.end) < new Date(s.start))}
                          >
                            Close & Save
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default ETF;
