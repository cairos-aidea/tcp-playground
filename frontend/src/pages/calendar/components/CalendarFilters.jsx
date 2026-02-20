import React, { useState } from 'react';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
    Command,
    CommandInput,
    CommandList,
    CommandEmpty,
    CommandGroup,
    CommandItem,
} from "@/components/ui/command";
import { cn } from "@/lib/utils";
import { Check, ChevronsUpDown } from "lucide-react";

// Reusable searchable combobox styled to match shadcn Select triggers
const FilterCombobox = ({ value, onSelect, options, placeholder, width = "w-[160px]", displayFn }) => {
    const [open, setOpen] = useState(false);

    const selectedOption = value ? (options || []).find(op => String(op.value) === String(value)) : null;
    const displayText = selectedOption
        ? (displayFn ? displayFn(selectedOption) : selectedOption.label)
        : null;

    return (
        <div className={cn(width, "shrink-0")}>
            <Popover open={open} onOpenChange={setOpen}>
                <PopoverTrigger asChild>
                    <button
                        role="combobox"
                        aria-expanded={open}
                        className={cn(
                            "flex h-8 w-full items-center justify-between gap-1 rounded-md border border-input bg-background px-3 py-1 text-[11px] shadow-xs transition-colors",
                            "hover:bg-accent hover:text-accent-foreground",
                            "focus:outline-none focus:ring-1 focus:ring-ring",
                            "disabled:cursor-not-allowed disabled:opacity-50",
                            !displayText && "text-muted-foreground"
                        )}
                    >
                        <span className="truncate">{displayText || placeholder}</span>
                        <ChevronsUpDown className="h-3 w-3 shrink-0 opacity-50" />
                    </button>
                </PopoverTrigger>
                <PopoverContent className="p-0" style={{ width: 'var(--radix-popover-trigger-width)', minWidth: '200px' }}>
                    <Command>
                        <CommandInput placeholder={`Search...`} className="h-8 text-xs" />
                        <CommandList>
                            <CommandEmpty className="py-3 text-center text-xs">No results found.</CommandEmpty>
                            <CommandGroup>
                                {/* Clear / None option */}
                                <CommandItem
                                    value="__none__"
                                    onSelect={() => {
                                        onSelect(null);
                                        setOpen(false);
                                    }}
                                    className="text-[11px] text-muted-foreground"
                                >
                                    <Check className={cn("mr-2 h-3 w-3", !value ? "opacity-100" : "opacity-0")} />
                                    {placeholder}
                                </CommandItem>
                                {(options || []).map(op => (
                                    <CommandItem
                                        key={op.value}
                                        value={op.search || op.project_code || op.label || String(op.value)}
                                        onSelect={() => {
                                            onSelect(String(op.value));
                                            setOpen(false);
                                        }}
                                        className="text-[11px]"
                                    >
                                        <Check className={cn("mr-2 h-3 w-3", String(value) === String(op.value) ? "opacity-100" : "opacity-0")} />
                                        {displayFn ? displayFn(op) : op.label}
                                    </CommandItem>
                                ))}
                            </CommandGroup>
                        </CommandList>
                    </Command>
                </PopoverContent>
            </Popover>
        </div>
    );
};

const CalendarFilters = ({ filters, setFilters, filterOptions }) => {
    const {
        externalProjectOptions,
        externalProjectStages,
        internalProjectOptions,
        departmentalTaskOptions,
        uniqueActivityOptions
    } = filterOptions;

    const handleFilterChange = (key, value) => {
        setFilters(prev => ({ ...prev, [key]: value }));
    };

    // Get project options based on type
    const projectOptions = filters.type === 'external' ? externalProjectOptions : internalProjectOptions;
    
    // Get stage options for selected project
    const stageOptions = filters.projectId ? externalProjectStages(filters.projectId) : [];

    return (
        <div className="flex flex-nowrap items-center gap-2">
                {/* Status Filter */}
                <div className="w-[110px] shrink-0">
                    <Select
                        value={filters.status}
                        onValueChange={(val) => handleFilterChange('status', val)}
                    >
                        <SelectTrigger className="h-8 text-[11px] bg-background">
                            <SelectValue placeholder="Status" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Status</SelectItem>
                            <SelectItem value="approved">Approved</SelectItem>
                            <SelectItem value="pending">Pending</SelectItem>
                            <SelectItem value="declined">Declined</SelectItem>
                        </SelectContent>
                    </Select>
                </div>

                {/* Type Filter */}
                <div className="w-[110px] shrink-0">
                    <Select
                        value={filters.type}
                        onValueChange={(val) => {
                            setFilters(prev => ({
                                ...prev, 
                                type: val,
                                projectId: null, 
                                stageId: null, 
                                activity: "" 
                            }));
                        }}
                    >
                        <SelectTrigger className="h-8 text-[11px] bg-background">
                            <SelectValue placeholder="Type" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Types</SelectItem>
                            <SelectItem value="external">External</SelectItem>
                            <SelectItem value="internal">Internal</SelectItem>
                            <SelectItem value="departmental">Departmental</SelectItem>
                        </SelectContent>
                    </Select>
                </div>

                {/* Project Filter (External/Internal) */}
                {(filters.type === 'external' || filters.type === 'internal') && (
                    <FilterCombobox
                        value={filters.projectId}
                        onSelect={(val) => {
                            handleFilterChange('projectId', val);
                            handleFilterChange('stageId', null);
                        }}
                        options={(projectOptions || []).map(op => ({
                            ...op,
                            search: `${op.project_code} ${op.project_label || op.label}`,
                        }))}
                        placeholder="Select Project"
                        width="w-[160px]"
                        displayFn={(op) => (
                            <><span className="font-semibold">{op.project_code}</span>{op.project_label && <span className="ml-1 opacity-70 truncate">{op.project_label}</span>}</>
                        )}
                    />
                )}

                {/* Stage Filter (External Only) */}
                {filters.type === 'external' && filters.projectId && (
                    <FilterCombobox
                        value={filters.stageId}
                        onSelect={(val) => handleFilterChange('stageId', val)}
                        options={stageOptions}
                        placeholder="Select Stage"
                        width="w-[140px]"
                    />
                )}

                {/* Task Name (Departmental Only) */}
                {filters.type === 'departmental' && (
                    <FilterCombobox
                        value={filters.departmentalTaskId}
                        onSelect={(val) => handleFilterChange('departmentalTaskId', val)}
                        options={departmentalTaskOptions}
                        placeholder="Select Task"
                        width="w-[160px]"
                    />
                )}

                {/* Activity Filter */}
                <FilterCombobox
                    value={filters.activity}
                    onSelect={(val) => handleFilterChange('activity', val || '')}
                    options={uniqueActivityOptions}
                    placeholder="Activity"
                    width="w-[140px]"
                />

                {/* Overtime Filter */}
                <div className="w-[110px] shrink-0">
                    <Select
                        value={filters.isOvertime ? "yes" : "no"}
                        onValueChange={(val) => handleFilterChange('isOvertime', val === "yes")}
                    >
                        <SelectTrigger className="h-8 text-[11px] bg-background">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="no">No Overtime</SelectItem>
                            <SelectItem value="yes">Overtime</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
            </div>
    );
};

export default CalendarFilters;
