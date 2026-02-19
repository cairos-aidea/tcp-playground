import React, { useMemo, useState, useEffect } from 'react';
import { useAppData } from '../../../context/AppDataContext';
import Select from "react-select";
import ReactLoading from 'react-loading';
import { api } from '../../../api/api';
import { Pencil, Lock, Save, Eye, Info, SquareX, Plus, Loader2, Archive, MessageCircleWarning } from 'lucide-react';
import ProjectBudgetConfirmModal from './components/projectBudgetConfirmModal';
import GlobalSelect from "../../../components/layouts/GlobalSelect";
import PageContainer from "@/components/ui/PageContainer";
import { Card, CardHeader, CardContent, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
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
    <PageContainer>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Project Budget</h2>
          <p className="text-muted-foreground">Manage project budgets and allocations.</p>
        </div>

        {isLatestVersion && selectedProjectId && (
          <Button
            onClick={() => setShowConfirmModal(true)}
            className="gap-2"
          >
            <Lock size={16} />
            Lock Version {latestVersionNumber + 1}
          </Button>
        )}
      </div>

      <div className="space-y-6">
        {/* Project Details Card */}
        <Card>
          <CardHeader>
            <CardTitle>Project Details</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
              <div className="space-y-2">
                <Label>Project Code</Label>
                <Select
                  className="text-sm"
                  options={projectCodeOptions}
                  placeholder="Select Code"
                  value={projectCodeOptions.find(opt => opt.value === selectedProjectId) || null}
                  onChange={handleProjectCodeChange}
                  isClearable
                  styles={{ control: (base) => ({ ...base, borderColor: 'hsl(var(--input))', borderRadius: 'var(--radius)' }) }}
                />
              </div>
              <div className="space-y-2">
                <Label>Project Name</Label>
                <Select
                  className="text-sm"
                  options={projectNameOptions}
                  placeholder="Select Name"
                  value={projectNameOptions.find(opt => opt.value === selectedProjectId) || null}
                  onChange={handleProjectNameChange}
                  isClearable
                  styles={{ control: (base) => ({ ...base, borderColor: 'hsl(var(--input))', borderRadius: 'var(--radius)' }) }}
                />
              </div>
              <div className="space-y-2">
                <Label>Budget Version</Label>
                <Select
                  className="text-sm"
                  options={versions.sort((a, b) => b.id - a.id).map(v => ({
                    label: v.version_number === 0 ? "Current Version" : `Version ${v.version_number}`,
                    value: v.id
                  }))}
                  placeholder={versions.length === 0 ? "No versions" : "Select Version"}
                  value={versions.length === 0 ? null : (selectedVersionId ? {
                    label: versions.find(v => String(v.id) === String(selectedVersionId))?.version_number === 0 ? "Current Version" : `Version ${versions.find(v => String(v.id) === String(selectedVersionId))?.version_number}`,
                    value: selectedVersionId
                  } : null)}
                  onChange={option => setSelectedVersionId(option ? option.value : "")}
                  isClearable
                  isDisabled={!selectedProjectId || loadingVersions}
                  styles={{ control: (base) => ({ ...base, borderColor: 'hsl(var(--input))', borderRadius: 'var(--radius)' }) }}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="space-y-1">
                <Label className="text-muted-foreground">Client</Label>
                <div className="p-2 bg-muted rounded-md text-sm font-medium">
                  {selectedProject?.client?.name || <span className="italic text-muted-foreground">No client</span>}
                </div>
              </div>
              <div className="space-y-1">
                <Label className="text-muted-foreground">Studio</Label>
                <div className="p-2 bg-muted rounded-md text-sm font-medium">
                  {selectedProject?.project_studio?.name || <span className="italic text-muted-foreground">No studio</span>}
                </div>
              </div>
              <div className="space-y-1">
                <Label className="text-muted-foreground">Manager</Label>
                <div className="p-2 bg-muted rounded-md text-sm font-medium">
                  {currentVersion?.project_manager?.name || selectedProject?.owner?.name || <span className="italic text-muted-foreground">No manager</span>}
                </div>
              </div>
              <div className="space-y-1">
                <Label className="text-muted-foreground">Architect</Label>
                {isLatestVersion ? (
                  <Select
                    className="text-sm"
                    options={architectOptions}
                    value={selectedArchitect}
                    onChange={handleArchitectChange}
                    placeholder="Select Architect"
                    isClearable
                    styles={{ control: (base) => ({ ...base, borderColor: 'hsl(var(--input))', borderRadius: 'var(--radius)' }) }}
                  />
                ) : (
                  <div className="p-2 bg-muted rounded-md text-sm font-medium">
                    {versions.find(v => String(v.id) === String(selectedVersionId))?.project_architect?.name || <span className="italic text-muted-foreground">No architect</span>}
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {loadingVersions ? (
          <div className="flex justify-center p-8"><Loader2 className="animate-spin text-muted-foreground" /></div>
        ) : budgetAllocation ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Budget Allocation */}
            <Card className="h-full">
              <CardHeader><CardTitle className="text-lg">Allocation</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between items-center text-sm">
                  <span className="text-muted-foreground">Contract Fee (VAT Inc.)</span>
                  <span className="font-semibold">₱{Number(budgetAllocation.contract_fee ?? 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-muted-foreground">VAT Rate</span>
                  <span>{Number(budgetAllocation.vat_percentage ?? 0).toFixed(2)}%</span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-muted-foreground">Contract Fee (VAT Excl.)</span>
                  <span className="font-medium">₱{Number(budgetSummary.contractFeeVatExcl ?? 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                </div>
                <div className="flex justify-between items-center text-sm pt-2 border-t">
                  <span className="text-muted-foreground">Direct Cost</span>
                  <span className="font-medium">₱{directCost.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                </div>
                <div className="flex justify-between items-center text-sm pt-2 border-t font-semibold">
                  <span className="text-muted-foreground">Net Aidea Fee</span>
                  <span>₱{budgetSummary.netAideaFee.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                </div>
                <div className="space-y-2 pt-4 border-t">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Target Profit</span>
                    <span>{budgetSummary.targetProfitability.toFixed(2)}%</span>
                  </div>
                  <div className="flex justify-between text-sm font-semibold text-emerald-600">
                    <span>Manpower Budget</span>
                    <span>₱{budgetSummary.manpowerBudget.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Subcon Expenses */}
            <Card className="h-full flex flex-col">
              <CardHeader><CardTitle className="text-lg">Subcon Expenses</CardTitle></CardHeader>
              <CardContent className="flex-1 overflow-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Type</TableHead>
                      <TableHead className="text-right">Amount</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {subconExpenses.length === 0 ? (
                      <TableRow><TableCell colSpan={2} className="text-center text-muted-foreground italic">No expenses</TableCell></TableRow>
                    ) : (
                      subconExpenses.map((exp, idx) => (
                        <TableRow key={idx}>
                          <TableCell>
                            <div className="font-medium">{exp.trade || "Subcon"}</div>
                            <div className="text-xs text-muted-foreground">{exp.subcon_name || "Unknown"}</div>
                          </TableCell>
                          <TableCell className="text-right font-medium">
                            ₱{Number(exp.budget_allocated ?? 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </CardContent>
              <div className="p-4 border-t bg-muted/20 flex justify-between font-bold text-sm">
                <span>Total</span>
                <span>₱{sumSubconExpenses.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
              </div>
            </Card>

            {/* Other Expenses */}
            <Card className="h-full flex flex-col">
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-lg">Other Expenses</CardTitle>
                {(isCurrentVersionSelected || (versions.length === 0 && budgetAllocation)) && (
                  <Button variant="ghost" size="sm" onClick={handleAddExpense}><Plus className="h-4 w-4 mr-1" /> Add</Button>
                )}
              </CardHeader>
              <CardContent className="flex-1 overflow-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Type</TableHead>
                      <TableHead className="text-right">Amount</TableHead>
                      <TableHead className="w-[40px]"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {otherExpenses.length === 0 && !isLatestVersion ? (
                      <TableRow><TableCell colSpan={3} className="text-center text-muted-foreground italic">No expenses</TableCell></TableRow>
                    ) : (
                      otherExpenses.map((exp, idx) => {
                        const isNew = !exp.id;
                        const isEditable = isCurrentVersionSelected && (isNew || exp.is_draft === 1) || (versions.length === 0 && budgetAllocation);

                        return (
                          <TableRow key={idx}>
                            <TableCell>
                              {isEditable && editingCell.idx === idx && editingCell.field === "expense_type" ? (
                                <GlobalSelect
                                  options={expenseTypeOptions}
                                  value={expenseTypeOptions.find(opt => opt.label === exp.expense_type) || null}
                                  onChange={option => handleExpenseChange(idx, "expense_type", option)}
                                  onBlur={() => handleExpenseBlur(idx, "expense_type")}
                                  autoFocus
                                  menuPortalTarget={document.body}
                                />
                              ) : (
                                <div
                                  className={cn("text-sm cursor-pointer", isEditable && "hover:underline")}
                                  onClick={isEditable ? () => setEditingCell({ idx, field: "expense_type" }) : undefined}
                                >
                                  {exp.expense_type || <span className="text-muted-foreground italic">Select Type</span>}
                                </div>
                              )}
                            </TableCell>
                            <TableCell className="text-right">
                              {isEditable && editingCell.idx === idx && editingCell.field === "budget_allocated" ? (
                                <input
                                  type="number" min="0" step="0.01" autoFocus
                                  className="w-24 px-2 py-1 text-right border rounded text-sm"
                                  value={exp.budget_allocated}
                                  onChange={e => handleExpenseChange(idx, "budget_allocated", e.target.value)}
                                  onBlur={() => handleExpenseBlur(idx, "budget_allocated")}
                                  onKeyDown={e => { if (e.key === "Enter") handleExpenseBlur(idx, "budget_allocated"); }}
                                />
                              ) : (
                                <div
                                  className={cn("text-sm font-medium cursor-pointer", isEditable && "hover:underline")}
                                  onClick={isEditable ? () => setEditingCell({ idx, field: "budget_allocated" }) : undefined}
                                >
                                  ₱{Number(exp.budget_allocated ?? 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                </div>
                              )}
                            </TableCell>
                            <TableCell>
                              {isEditable && (
                                <Button variant="ghost" size="icon" className="h-6 w-6 text-muted-foreground hover:text-destructive" onClick={() => handleDeleteExpense(idx)} disabled={deletingIdx === idx}>
                                  {deletingIdx === idx ? <Loader2 className="h-3 w-3 animate-spin" /> : <SquareX size={14} />}
                                </Button>
                              )}
                            </TableCell>
                          </TableRow>
                        );
                      })
                    )}
                  </TableBody>
                </Table>
              </CardContent>
              <div className="p-4 border-t bg-muted/20 flex justify-between font-bold text-sm">
                <span>Total</span>
                <span>₱{sumOtherExpenses.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
              </div>
            </Card>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center p-12 text-muted-foreground border-2 border-dashed rounded-lg bg-muted/10">
            <Info className="h-10 w-10 mb-2 opacity-20" />
            <p>No budget allocation data found for this project.</p>
          </div>
        )}
      </div>

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
    </PageContainer>
  );
};

export default ProjectBudget;


