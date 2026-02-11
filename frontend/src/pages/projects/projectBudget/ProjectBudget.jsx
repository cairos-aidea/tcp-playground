import React, { useMemo, useState, useEffect } from 'react';
import { useAppData } from '../../../context/AppDataContext';
import Select from "react-select";
import ReactLoading from 'react-loading';
import { api } from '../../../api/api';
import { Pencil, Lock, Save, Eye, Info, SquareX, Plus, Loader2, Archive, MessageCircleWarning } from 'lucide-react';
import ProjectBudgetConfirmModal from './components/projectBudgetConfirmModal';
import GlobalSelect from "../../../components/layouts/GlobalSelect";
import { Link } from 'react-router-dom';

const ProjectBudget = () => {
  const {
    projects,
    headerReq,
    staffs,
    fetchOtherExpenses
  } = useAppData();

  const [selectedProjectId, setSelectedProjectId] = useState(null);

  // Add state for versions and loading
  const [versions, setVersions] = useState([]);
  const [loadingVersions, setLoadingVersions] = useState(false);
  const [selectedVersionId, setSelectedVersionId] = useState("");

  // Add this state at the top, after other useState hooks
  const [otherExpenses, setOtherExpenses] = useState([]);
  const [subconExpenses, setSubconExpenses] = useState([]);
  const [budgetAllocation, setBudgetAllocation] = useState(null);

  // Add this state after other useState hooks
  const [budgetSummary, setBudgetSummary] = useState({
    contractFeeVatExcl: 0,
    netAideaFee: 0,
    targetProfitability: 0,
    targetProfitAmount: 0,
    manpowerBudget: 0,
  });

  const [originalArchitect, setOriginalArchitect] = useState(null);
  const [selectedArchitect, setSelectedArchitect] = useState(null);
  const [editingCell, setEditingCell] = useState({ idx: null, field: null });
  const [saveError, setSaveError] = useState("");
  const [expenseTypeOptions, setExpenseTypeOptions] = useState([]);

  useEffect(() => {
    async function fetchOptions() {
      try {
        const options = await fetchOtherExpenses();
        setExpenseTypeOptions(
          Array.isArray(options)
            ? options.map(opt => ({ value: opt.id, label: opt.name }))
            : []
        );
      } catch {
        setExpenseTypeOptions([]);
      }
    }

    fetchOptions();
  }, []);

  const projectCodeOptions = useMemo(() => {
    return (projects || [])
      .filter(
        p =>
          p.project_status !== "Lost Proposal" &&
          p.project_status !== "Aborted Proposal"
      )
      .map(p => ({
        value: p.id,
        label: p.project_code,
      }));
  }, [projects]);

  const projectNameOptions = useMemo(() => {
    return (projects || [])
      .filter(
        p =>
          p.project_status !== "Lost Proposal" &&
          p.project_status !== "Aborted Proposal"
      )
      .map(p => ({
        value: p.id,
        label: p.project_name,
      }));
  }, [projects]);

  // Find selected project
  const selectedProject = useMemo(
    () => projects.find(p => p.id === selectedProjectId),
    [projects, selectedProjectId]
  );

  // Handlers for each select
  const handleProjectCodeChange = option => {
    setSelectedProjectId(option ? option.value : null);
    setSelectedVersionId(""); // Reset version when project changes
  };
  const handleProjectNameChange = option => {
    setSelectedProjectId(option ? option.value : null);
    setSelectedVersionId(""); // Reset version when project changes
  };

  useEffect(() => {
    if (!selectedProjectId) {
      setVersions([]);
      setSelectedVersionId(""); // Reset version when no project is selected
      return;
    }
    setLoadingVersions(true);
    api("budget_versions", { ...headerReq, id: selectedProjectId })
      .then((result) => {
        setVersions(result || []);
        setSelectedVersionId(""); // Reset version when new versions are loaded
      })
      .catch(() => {
        setVersions([]);
        setSelectedVersionId(""); // Reset version on error
      })
      .finally(() => {
        setLoadingVersions(false);
      });
  }, [selectedProjectId, headerReq]);

  // Helper to get the current version (selected or latest)
  const currentVersion = useMemo(() => {
    if (versions.length === 0) return null;
    if (selectedVersionId) {
      return versions.find(v => String(v.id) === String(selectedVersionId)) || null;
    }
    // If no version selected, use latest
    return [...versions].sort((a, b) => b.id - a.id)[0];
  }, [versions, selectedVersionId]);

  // When versions are loaded, auto-select latest version if any and none is selected
  useEffect(() => {
    if (versions.length > 0 && !selectedVersionId) {
      const latest = [...versions].sort((a, b) => b.id - a.id)[0];
      setSelectedVersionId(latest.id);
    }
    // Only run when versions change, not when selectedVersionId changes
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [versions]);

  // Populate otherExpenses when currentVersion changes
  useEffect(() => {
    if (currentVersion && Array.isArray(currentVersion.budget_other_expenses)) {
      setOtherExpenses(
        currentVersion.budget_other_expenses
          .filter(e => !e.deleted_at) // <-- Only include non-deleted
          .map(e => ({
            id: e.id,
            expense_type: e.expense_type,
            budget_allocated: e.budget_allocated,
            is_draft: e.is_draft || true,
          }))
      );
    } else {
      setOtherExpenses([]);
    }
  }, [currentVersion]);

  // Fetch subcon expenses and budget allocation when project changes
  useEffect(() => {
    if (!selectedProjectId) {
      setSubconExpenses([]);
      setBudgetAllocation(null);
      return;
    }
    // Assuming these are available in the project object
    const project = projects.find(p => p.id === selectedProjectId);
    setSubconExpenses(project?.budget_subcon_expenses || []);
    setBudgetAllocation(project?.budget_allocation || null);
  }, [selectedProjectId, projects]);

  // Calculate sums
  const sumOtherExpenses = otherExpenses.reduce(
    (sum, exp) => sum + (parseFloat(exp.budget_allocated) || 0), 0
  );
  const sumSubconExpenses = subconExpenses.reduce(
    (sum, exp) => sum + (parseFloat(exp.budget_allocated) || 0), 0
  );
  const directCost = sumOtherExpenses + sumSubconExpenses;

  // Handler for editing a cell
  // const handleExpenseChange = (idx, field, value) => {
  //   setOtherExpenses(expenses =>
  //     expenses.map((exp, i) =>
  //       i === idx ? { ...exp, [field]: value } : exp
  //     )
  //   );
  // };

  const handleExpenseChange = (idx, field, value) => {
    setOtherExpenses(expenses =>
      expenses.map((exp, i) =>
        i === idx
          ? {
            ...exp,
            [field]: field === "expense_type"
              ? value?.label || ""
              : value
          }
          : exp
      )
    );
  };

  // Handler for adding a new row
  const handleAddExpense = () => {
    setOtherExpenses(expenses => [
      ...expenses,
      { id: null, expense_type: '', budget_allocated: '' }
    ]);
  };

  // Architect options from staffs
  const architectOptions = useMemo(
    () =>
      (staffs || [])
        .filter(staff => staff.is_active === "yes")
        .map(staff => ({
          value: staff.id,
          label: staff.name,
        })),
    [staffs]
  );

  useEffect(() => {
    if (!currentVersion) {
      setSelectedArchitect(null);
      setOriginalArchitect(null);
      return;
    }
    // Only for latest version
    const isLatest = currentVersion && versions.length > 0 && currentVersion.id === Math.max(...versions.map(v => v.id));
    if (isLatest) {
      setSelectedArchitect(
        currentVersion.project_architect
          ? { value: currentVersion.project_architect.id, label: currentVersion.project_architect.name }
          : null
      );
      setOriginalArchitect(
        currentVersion.project_architect
          ? { value: currentVersion.project_architect.id, label: currentVersion.project_architect.name }
          : null
      );
    } else {
      setSelectedArchitect(null);
      setOriginalArchitect(null);
    }
  }, [currentVersion, versions]);

  // Handler for architect change (only updates state)
  const handleArchitectChange = (option) => {
    setSelectedArchitect(option);

    // Update architect in versions state for latest version only
    if (currentVersion && versions.length > 0 && currentVersion.id === Math.max(...versions.map(v => v.id))) {
      setVersions(vers =>
        vers.map(v =>
          v.id === currentVersion.id
            ? {
              ...v,
              project_architect: option
                ? { id: option.value, name: option.label }
                : originalArchitect
                  ? { id: originalArchitect.value, name: originalArchitect.label }
                  : null,
              project_architect_id: option ? option.value : originalArchitect?.value || null,
            }
            : v
        )
      );
    }
  };

  // Calculate budget summary when budgetAllocation, directCost, or sums change
  useEffect(() => {
    if (!budgetAllocation) {
      setBudgetSummary({
        contractFeeVatExcl: 0,
        netAideaFee: 0,
        targetProfitability: 0,
        targetProfitAmount: 0,
        manpowerBudget: 0,
      });
      return;
    }
    const contractFee = parseFloat(budgetAllocation.contract_fee) || 0;
    const vatPercentage = parseFloat(budgetAllocation.vat_percentage) || 0;
    const targetProfitability = parseFloat(budgetAllocation.target_profitability) || 0;

    const contractFeeVatExcl = vatPercentage > 0 ? contractFee / (1 + vatPercentage / 100) : contractFee;
    const netAideaFee = contractFeeVatExcl - directCost;
    const targetProfitAmount = netAideaFee * (targetProfitability / 100);
    const manpowerBudget = netAideaFee - targetProfitAmount;

    setBudgetSummary({
      contractFeeVatExcl,
      netAideaFee,
      targetProfitability,
      targetProfitAmount,
      manpowerBudget,
    });
  }, [budgetAllocation, directCost]);


  // Determine if current version is the latest or if there are no versions yet
  const isLatestVersion =
    versions.length === 0 ||
    (versions.length === 1 && currentVersion) ||
    (versions.length > 1 && currentVersion && currentVersion.id === Math.max(...versions.map(v => v.id)));

  const latestVersionNumber = versions.length > 0
    ? Math.max(...versions.map(v => Number(v.version_number) || 0))
    : 0;

  // Add this function before the return statement
  const handleSave = async () => {
    // If this is the very first budget (no versions yet), require project_architect
    if (versions.length === 0 && !selectedArchitect) {
      setSaveError("Project Architect is required for the first project budget.");
      return;
    }
    setSaveError(""); // Clear previous error

    // Project Details
    const projectDetails = {
      project_id: selectedProjectId,
      client_id: selectedProject?.client?.id,
      project_studio_id: selectedProject?.project_studio?.id,
      project_manager_id: selectedProject?.owner?.id,
      project_architect_id: selectedArchitect ? selectedArchitect.value : (originalArchitect ? originalArchitect.value : null),
      recent_budget_version_id: selectedVersionId,
      new_budget_version_number: latestVersionNumber + 1
    };

    // Other Expenses
    const otherExpensesPayload = otherExpenses.map(exp => ({
      id: exp.id,
      expense_type: exp.expense_type,
      budget_allocated: exp.budget_allocated,
    }));

    // Final payload
    const payload = {
      project_details: projectDetails,
      other_expenses: otherExpensesPayload,
      // subcon_expenses: subconExpensesPayload,
      // project_budget: projectBudget,
      // etf, // Placeholder
    };

    api('project_budget_create', headerReq, payload)
      .then(response => {
        if (response && response.finalized_version && response.current_version) {
          // Use architect from response if available, otherwise fallback to staffs
          const getArchitect = (version) => {
            if (version.project_architect && version.project_architect.id && version.project_architect.name) {
              return version.project_architect;
            }
            if (version.project_architect_id) {
              const staff = staffs.find(s => s.id === version.project_architect_id);
              return staff ? { id: staff.id, name: staff.name } : null;
            }
            return null;
          };

          const finalized = {
            ...response.finalized_version,
            project_manager: response.finalized_version.project_manager
              ? response.finalized_version.project_manager
              : staffs.find(s => s.id === response.finalized_version.project_manager_id)
                ? {
                  id: response.finalized_version.project_manager_id,
                  name: staffs.find(s => s.id === response.finalized_version.project_manager_id).name,
                }
                : null,
            project_architect: getArchitect(response.finalized_version),
          };
          const current = {
            ...response.current_version,
            project_manager: response.current_version.project_manager
              ? response.current_version.project_manager
              : staffs.find(s => s.id === response.current_version.project_manager_id)
                ? {
                  id: response.current_version.project_manager_id,
                  name: staffs.find(s => s.id === response.current_version.project_manager_id).name,
                }
                : null,
            project_architect: getArchitect(response.current_version),
          };

          setVersions(prevVersions => [
            ...prevVersions.filter(v => v.version_number !== 0),
            finalized,
            current
          ]);
          setSelectedVersionId(current.id);
        }
        setShowConfirmModal(false);
      })
      .catch(error => {
        // Optionally show an error message (implement as needed)
        // e.g., setErrorMessage('Save failed!');
        // console.error('Save failed:', error);
      })
      .finally(() => {
      });
  };

  // Add this function before your return statement
  const handleExpenseBlur = async (idx, field) => {
    setEditingCell({ idx: null, field: null });
    const exp = otherExpenses[idx];
    if (!exp) return;

    // Only create if both fields are filled and it's new
    if (!exp.id && exp.expense_type && exp.budget_allocated) {
      try {
        const payload = {
          expense_type: exp.expense_type,
          budget_allocated: exp.budget_allocated,
          budget_version_id: selectedVersionId,
          project_id: selectedProjectId
        };

        api('budget_other_expense_create', headerReq, payload)
          .then(created => {
            if (created && created.id) {
              setOtherExpenses(oes =>
                oes.map((e, i) => (i === idx ? { ...created } : e))
              );
              // Update the versions state so the new expense is included in the current version
              setVersions(vers =>
                vers.map(v =>
                  v.id === (created.budget_version_id || selectedVersionId)
                    ? {
                      ...v,
                      budget_other_expenses: [
                        ...(v.budget_other_expenses || []),
                        created
                      ]
                    }
                    : v
                )
              );
            }
          });
      } catch (e) {
        // Optionally handle error
      }
    }
    // Update if it has an id (existing row)
    else if (exp.id) {
      try {
        const payload = {
          id: exp.id,
          expense_type: exp.expense_type,
          budget_allocated: exp.budget_allocated,
        };
        api('budget_other_expense_update', { ...headerReq, id: exp.id }, payload)
          .then(updated => {
            if (updated && updated.id) {
              setOtherExpenses(oes =>
                oes.map((e, i) => (i === idx ? { ...updated } : e))
              );
              // Update the versions state so the updated expense is reflected in the current version
              setVersions(vers =>
                vers.map(v =>
                  v.id === (updated.budget_version_id || selectedVersionId)
                    ? {
                      ...v,
                      budget_other_expenses: (v.budget_other_expenses || []).map(e =>
                        e.id === updated.id ? updated : e
                      )
                    }
                    : v
                )
              );
            }
          });
      } catch (e) {
        // Optionally handle error
      }
    }
  };

  // Handler for deleting an expense row
  const [deletingIdx, setDeletingIdx] = useState(null); // Add this state

  const handleDeleteExpense = async (idx) => {
    const exp = otherExpenses[idx];
    if (exp && exp.id) {
      setDeletingIdx(idx); // Set loading state
      try {
        await api('budget_other_expense_delete', { ...headerReq, id: exp.id });
        setOtherExpenses(expenses => expenses.filter((_, i) => i !== idx));
        // Also update the versions state so deleted row is removed from the current version
        setVersions(vers =>
          vers.map(v =>
            v.id === currentVersion.id
              ? {
                ...v,
                budget_other_expenses: v.budget_other_expenses.filter(e => e.id !== exp.id)
              }
              : v
          )
        );
      } catch (e) {
        // Optionally handle error
      } finally {
        setDeletingIdx(null); // Clear loading state
      }
    } else {
      // Just remove from state if it has no ID (not saved yet)
      setOtherExpenses(expenses => expenses.filter((_, i) => i !== idx));
    }
  };

  const [showConfirmModal, setShowConfirmModal] = useState(false);

  const currentVersionDraft = useMemo(() => {
    return versions.find(v => Number(v.version_number) === 0) || null;
  }, [versions]);

  const isCurrentVersionSelected = selectedVersionId && (
    versions.find(v => String(v.id) === String(selectedVersionId))?.version_number === 0
  );

  return (
    <div className="flex flex-col h-screen bg-slate-50">
      <div className="container-fluid h-full">
        <div className="w-full sticky top-0 z-10 bg-white border-b">
          <div className="flex h-14 items-center justify-between px-6">
            <h1 className="text-xl font-semibold text-gray-700">Project Budget</h1>

            {isLatestVersion && selectedProjectId && (
              <button
                onClick={() => setShowConfirmModal(true)}
                className="inline-flex items-center gap-2 rounded-full bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700 shadow-sm hover:shadow"
              >
                <Lock size={16} />
                Lock Version {latestVersionNumber + 1}
              </button>
            )}
          </div>
        </div>

        {/* Main content */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-2 h-[calc(100vh-6rem)] overflow-y-auto">
          <div className="col-span-12 overflow-x-auto h-full flex flex-col">
            <div className="col-span-12 h-full flex flex-col gap-2 p-4 overflow-auto">
              <div className="bg-white rounded-xl border border-slate-200 p-5 md:p-6 shadow-sm mb-4">
                <h3 className="text-base md:text-lg font-semibold text-slate-800 mb-4">
                  Project Details
                </h3>
                {/* Selection Section */}
                <div className="mb-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* Project Code */}
                    <div className="flex flex-col gap-2">
                      <label className="text-sm font-medium text-slate-700">
                        Project Code
                      </label>
                      <Select
                        className="text-sm"
                        options={projectCodeOptions}
                        placeholder="Select Project Code"
                        value={projectCodeOptions.find(opt => opt.value === selectedProjectId) || null}
                        onChange={handleProjectCodeChange}
                        isClearable
                      />
                    </div>

                    {/* Project Name */}
                    <div className="flex flex-col gap-2">
                      <label className="text-sm font-medium text-slate-700">
                        Project Name
                      </label>
                      <Select
                        className="text-sm"
                        options={projectNameOptions}
                        placeholder="Select Project Name"
                        value={projectNameOptions.find(opt => opt.value === selectedProjectId) || null}
                        onChange={handleProjectNameChange}
                        isClearable
                      />
                    </div>

                    {/* Version Selector */}
                    <div className="flex flex-col gap-2">
                      <label className="text-sm font-medium text-slate-700">
                        Project Budget Version
                      </label>

                      <Select
                        className="text-sm"
                        options={
                          versions.length === 0
                            ? []
                            : [...versions]
                              .sort((a, b) => b.id - a.id)
                              .map(v => ({
                                label:
                                  v.version_number === 0
                                    ? "Current Version"
                                    : `Version ${v.version_number}`,
                                value: v.id,
                              }))
                        }
                        placeholder={
                          versions.length === 0 ? "No versions available" : "Select Version"
                        }
                        value={
                          versions.length === 0
                            ? null
                            : (() => {
                              const selected = versions.find(
                                v => String(v.id) === String(selectedVersionId)
                              );
                              return selected
                                ? {
                                  label:
                                    selected.version_number === 0
                                      ? "Current Version"
                                      : `Version ${selected.version_number}`,
                                  value: selectedVersionId,
                                }
                                : null;
                            })()
                        }
                        onChange={option =>
                          setSelectedVersionId(option ? option.value : "")
                        }
                        isClearable
                        isDisabled={!selectedProjectId || loadingVersions}
                      />
                    </div>
                  </div>
                </div>
                {/* Reference Section */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                  {/* Client */}
                  <div className="flex flex-col gap-1">
                    <label className="text-sm font-medium text-slate-700">Client</label>
                    <span className="px-3 py-2 rounded-md bg-slate-50 text-sm text-slate-900">
                      {selectedProject?.client?.name || (
                        <span className="italic text-slate-400">
                          No client available
                        </span>
                      )}
                    </span>
                  </div>

                  {/* Studio */}
                  <div className="flex flex-col gap-1">
                    <label className="text-sm font-medium text-slate-700">
                      Project Studio
                    </label>
                    <span className="px-3 py-2 rounded-md bg-slate-50 text-sm text-slate-900">
                      {selectedProject?.project_studio?.name || (
                        <span className="italic text-slate-400">
                          No studio available
                        </span>
                      )}
                    </span>
                  </div>

                  {/* Manager */}
                  <div className="flex flex-col gap-1">
                    <label className="text-sm font-medium text-slate-700 flex items-center gap-2">
                      Project Manager
                      {versions.length > 0 &&
                        selectedProject?.owner?.name &&
                        currentVersion?.project_manager?.name &&
                        selectedProject.owner.name !==
                        currentVersion.project_manager.name && (
                          <span className="text-xs text-amber-600 flex items-center gap-1">
                            <Info size={14} />
                            New assignment
                          </span>
                        )}
                    </label>

                    <span className="px-3 py-2 rounded-md bg-slate-50 text-sm text-slate-900">
                      {versions.length === 0
                        ? selectedProject?.owner?.name ||
                        selectedProject?.project_manager?.name || (
                          <span className="italic text-slate-400">
                            No manager available
                          </span>
                        )
                        : currentVersion?.project_manager?.name || (
                          <span className="italic text-slate-400">
                            No manager available
                          </span>
                        )}
                    </span>
                  </div>

                  {/* Architect */}
                  <div className="flex flex-col gap-1">
                    <label className="text-sm font-medium text-slate-700">
                      Project Architect
                    </label>

                    {isLatestVersion ? (
                      <Select
                        className="text-sm"
                        options={architectOptions}
                        value={selectedArchitect}
                        onChange={handleArchitectChange}
                        placeholder="Select Architect"
                        isClearable
                      />
                    ) : (
                      <span className="px-3 py-2 rounded-md bg-slate-50 text-sm text-slate-900">
                        {versions.length === 0
                          ? selectedProject?.project_architect?.name || ""
                          : versions.find(v => String(v.id) === String(selectedVersionId))
                            ?.project_architect?.name ||
                          [...versions]
                            .sort((a, b) => b.id - a.id)[0]
                            ?.project_architect?.name ||
                          ""}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Loading for budget versions */}
              {loadingVersions ? (
                <div className="flex flex-col items-center justify-center py-16">
                  <ReactLoading type="bars" color="#94a3b8" height={24} width={56} />
                </div>
              ) : budgetAllocation ? (
                <>
                  <div className="grid grid-cols-12 gap-4 mb-4">
                    {/* 2nd row: 3 cards, each 1/3 width */}
                    <div className="col-span-12 md:col-span-4">
                      <div className="bg-white rounded-lg border border-slate-200 p-6 h-full">
                        <h3 className="text-base md:text-lg font-semibold text-slate-800 mb-4">
                          Budget Allocation
                        </h3>

                        <div className="space-y-5">
                          <div>
                            <div className="flex justify-between items-center py-2">
                              <span className="text-sm text-slate-600">
                                Contract Fee (VAT Inc.)
                              </span>
                              <span className="text-base font-semibold text-slate-800 tabular-nums">
                                ₱{Number(budgetAllocation.contract_fee ?? 0).toLocaleString(undefined, {
                                  minimumFractionDigits: 2,
                                  maximumFractionDigits: 2,
                                })}
                              </span>
                            </div>

                            <div className="flex justify-between items-center py-2">
                              <span className="text-sm text-slate-600">VAT Rate</span>
                              <span className="text-sm font-medium text-slate-700">
                                {Number(budgetAllocation.vat_percentage ?? 0).toFixed(2)}%
                              </span>
                            </div>

                            <div className="flex justify-between items-center py-2">
                              <span className="text-sm text-slate-600">
                                Contract Fee (VAT Excl.)
                              </span>
                              <span className="text-sm font-medium text-slate-800 tabular-nums">
                                ₱{Number(budgetSummary.contractFeeVatExcl ?? 0).toLocaleString(undefined, {
                                  minimumFractionDigits: 2,
                                  maximumFractionDigits: 2,
                                })}
                              </span>
                            </div>

                            <div className="flex justify-between py-2">
                              <span className="text-sm text-slate-600">
                                Direct Cost (VAT Inc.)
                              </span>
                              <span className="text-sm font-medium tabular-nums">
                                ₱{directCost.toLocaleString(undefined, {
                                  minimumFractionDigits: 2,
                                  maximumFractionDigits: 2,
                                })}
                              </span>
                            </div>

                            <div className="flex justify-between py-2">
                              <span className="text-sm text-slate-600">Net Aidea Fee</span>
                              <span className="text-sm font-semibold text-slate-800 tabular-nums">
                                ₱{budgetSummary.netAideaFee.toLocaleString(undefined, {
                                  minimumFractionDigits: 2,
                                  maximumFractionDigits: 2,
                                })}
                              </span>
                            </div>

                            <div className="flex justify-between py-2">
                              <span className="text-sm text-slate-600">Target Profitability</span>
                              <span className="text-sm font-medium">
                                {budgetSummary.targetProfitability.toFixed(2)}%
                              </span>
                            </div>

                            <div className="flex justify-between py-2">
                              <span className="text-sm text-slate-600">
                                Target Profit Amount
                              </span>
                              <span className="text-sm font-medium tabular-nums">
                                ₱{budgetSummary.targetProfitAmount.toLocaleString(undefined, {
                                  minimumFractionDigits: 2,
                                  maximumFractionDigits: 2,
                                })}
                              </span>
                            </div>

                            <div className="border-t">
                              <div className="flex justify-between items-center py-2">
                                <span className="text-sm font-semibold text-gray-700">Manpower Budget</span>
                                <span className="text-base font-bold text-slate-700 tabular-nums">
                                  ₱{budgetSummary.manpowerBudget.toLocaleString(undefined, {
                                    minimumFractionDigits: 2,
                                    maximumFractionDigits: 2,
                                  })}
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="col-span-12 md:col-span-4">
                      <div className="bg-white rounded-xl border border-slate-200 p-5 md:p-6 shadow-sm h-full flex flex-col">
                        <h3 className="text-base md:text-lg font-semibold text-slate-800 mb-4">Subcon Expenses</h3>
                        <div className="flex-1 min-h-0 overflow-y-auto max-h-[320px] divide-y divide-gray-200">
                          {subconExpenses.length === 0 ? (
                            <div className="py-3 text-gray-400 text-sm italic">No subcon expenses.</div>
                          ) : (
                            subconExpenses.map((exp, idx) => (
                              <div key={exp.id || idx} className="flex items-center justify-between py-2">
                                <div className="flex items-center">
                                  <div>
                                    <span className="text-sm font-medium text-gray-500">
                                      {exp.trade || exp.consultant_type || "Subcon"}
                                    </span>
                                    <div className="text-xxs text-gray-500">
                                      {exp.subcon_name || exp.consultant_type || "Subcon"}
                                    </div>
                                  </div>
                                </div>
                                <span className="text-lg font-bold text-slate-700">
                                  ₱{Number(exp.budget_allocated ?? 0).toLocaleString(undefined, {
                                    minimumFractionDigits: 2,
                                    maximumFractionDigits: 2
                                  })}
                                </span>
                              </div>
                            ))
                          )
                          }
                        </div>
                        {/* Sticky footer for total */}
                        <div className="bg-white border-t border-gray-200 mt-4 pt-3 pb-2 z-10 flex-shrink-0">
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-semibold text-gray-700">Total</span>
                            <span className="text-lg font-bold text-slate-700">
                              ₱{sumSubconExpenses.toLocaleString(undefined, {
                                minimumFractionDigits: 2, maximumFractionDigits: 2
                              })}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Other Expenses */}
                    <div className="col-span-12 md:col-span-4">
                      <div className="bg-white rounded-xl border border-slate-200 p-5 md:p-6 shadow-sm h-full flex flex-col">
                        <h3 className="text-base md:text-lg font-semibold text-slate-800 mb-4">Other Expenses</h3>
                        <div className="flex-1 min-h-0 overflow-y-auto max-h-[320px] divide-y divide-gray-200">
                          {otherExpenses.length === 0 && !isLatestVersion ? (
                            <div className="py-3 text-gray-400 text-sm italic">No other expenses.</div>
                          ) : (
                            <>
                              {otherExpenses.map((exp, idx) => {
                                const isNew = !exp.id;
                                // Editable if current version is selected OR if no versions exist but budgetAllocation is present
                                const isEditable = isCurrentVersionSelected && (isNew || exp.is_draft === 1)
                                  || (versions.length === 0 && budgetAllocation);
                                return (
                                  <div key={exp.id || idx} className="flex items-center justify-between py-3 px-1 group">
                                    <div className="flex flex-col">
                                      {isEditable ? (
                                        editingCell.idx === idx && editingCell.field === "expense_type" ? (
                                          <GlobalSelect
                                            options={expenseTypeOptions}
                                            value={expenseTypeOptions.find(opt => opt.label === exp.expense_type) || null}
                                            onChange={option => handleExpenseChange(idx, "expense_type", option)}
                                            onBlur={() => handleExpenseBlur(idx, "expense_type")}
                                            placeholder="Select Expense Type"
                                            autoFocus
                                            className="w-50 text-xs font-medium text-gray-900 italic"
                                            menuPortalTarget={document.body}
                                            menuPosition="fixed"
                                            styles={{ menuPortal: base => ({ ...base, zIndex: 99999 }) }}
                                          />
                                        ) : (
                                          <span
                                            className="flex items-center text-sm font-medium text-gray-900 cursor-pointer hover:underline"
                                            onClick={() => setEditingCell({ idx, field: "expense_type" })}
                                            tabIndex={0}
                                            onKeyDown={e => { if (e.key === "Enter" || e.key === " ") setEditingCell({ idx, field: "expense_type" }); }}
                                          >
                                            {exp.expense_type || <span className="text-gray-400 italic">Expense Type</span>}
                                          </span>
                                        )
                                      ) : (
                                        <span className="flex items-center text-xs font-medium text-gray-500">{exp.expense_type || "Subcon"}</span>
                                      )}
                                    </div>
                                    <div className="flex items-center relative group-hover:gap-6 transition-all duration-300">
                                      {isEditable ? (
                                        editingCell.idx === idx && editingCell.field === "budget_allocated" ? (
                                          <input type="number" min="0" step="0.01" autoFocus
                                            className="form-input w-40 px-2 py-1 mr-6 border border-blue-400 rounded text-lg font-bold text-slate-700 text-right"
                                            value={exp.budget_allocated} onChange={e => handleExpenseChange(idx, "budget_allocated", e.target.value)}
                                            onBlur={() => handleExpenseBlur(idx, "budget_allocated")}
                                            onKeyDown={e => { if (e.key === "Enter" || e.key === "Tab") { handleExpenseBlur(idx, "budget_allocated"); } }}
                                          />
                                        ) : (
                                          <span
                                            className="text-lg font-bold text-slate-700 transition-all duration-300 translate-x-[-1.5rem]"
                                            onClick={() => setEditingCell({ idx, field: "budget_allocated" })}
                                            tabIndex={0}
                                            onKeyDown={e => { if (e.key === "Enter" || e.key === " ") setEditingCell({ idx, field: "budget_allocated" }); }}
                                          >
                                            {exp.budget_allocated
                                              ? `₱${Number(exp.budget_allocated).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                                              : <span className="text-gray-400">0.00</span>}
                                          </span>
                                        )
                                      ) : (
                                        <span className="text-lg font-bold text-slate-700">
                                          ₱{Number(exp.budget_allocated ?? 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                        </span>
                                      )}
                                      {/* Conditional delete button */}
                                      {isEditable && (
                                        <button type="button"
                                          className="absolute right-0 text-gray-400 hover:text-red-500 opacity-100 transition-all duration-300"
                                          onClick={() => handleDeleteExpense(idx)}
                                          aria-label="Delete"
                                          disabled={deletingIdx === idx}
                                        >
                                          {deletingIdx === idx ? (
                                            <Loader2 className="animate-spin w-4 h-4" />
                                          ) : (
                                            <SquareX size={16} />
                                          )}
                                        </button>
                                      )}
                                    </div>
                                  </div>
                                );
                              })}
                              {/* Conditional Add Expense button */}
                              {(isCurrentVersionSelected || (versions.length === 0 && budgetAllocation)) && (
                                <div className="py-3 flex justify-center">
                                  <button className="text-gray-500 hover:text-blue-600 flex items-center gap-2 text-sm transition" onClick={handleAddExpense}>
                                    <Plus className="w-4 h-4" />
                                    Add Expense
                                  </button>
                                </div>
                              )}
                            </>
                          )}
                        </div>

                        {/* Sticky footer for total */}
                        <div className="bg-white border-t border-gray-200 mt-4 pt-3 pb-2 z-10 flex-shrink-0">
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-semibold text-gray-700">Total</span>
                            <span className="text-lg font-bold text-slate-700">
                              ₱{sumOtherExpenses.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </>
              ) : (
                <div className="col-span-12">
                  <div className="p-6 h-full flex items-center justify-center">
                        <p className="text-gray-300 italic">No project budget available.</p>
                      </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        {budgetAllocation && (
          <footer className="sticky  bg-white bottom-0 border-t border-slate-200 px-6 py-2 z-10">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-2 text-xs text-slate-600">
                {currentVersion && currentVersion.created_at && (
                  <span>
                    <span className="font-medium">Version Created:</span> {new Date(currentVersion.created_at).toLocaleString()}
                  </span>
                )}
              </div>
              <button
                onClick={() => window.open("https://wkf.ms/48dUIJq", "_blank")}
                className="inline-flex items-center gap-2 rounded-full bg-red-50 px-4 py-2.5 text-sm font-medium text-red-600 hover:bg-red-100 transition-colors border border-red-100"
              >
                <MessageCircleWarning size={16} />
                Report a Problem
              </button>
            </div>
          </footer>
        )}
      </div>
      {/* Confirm Modal */}
      {showConfirmModal && (
        <ProjectBudgetConfirmModal
          isVisible={showConfirmModal}
          setModalVisible={setShowConfirmModal}
          handleSave={handleSave}
          projectVersion={latestVersionNumber + 1}
          projectId={selectedProjectId}
          projectName={projectNameOptions.find(opt => opt.value === selectedProjectId)?.label || ""}
          projectCode={projectCodeOptions.find(opt => opt.value === selectedProjectId)?.label || ""}
        />
      )}
    </div>
  );
};

export default ProjectBudget;
