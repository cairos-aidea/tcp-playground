import * as React from "react";
import { ChevronLeft, ChevronRight, ChevronDown } from "lucide-react";
import { DayPicker, getDefaultClassNames } from "react-day-picker";
import { cn } from "@/lib/utils";
import { buttonVariants } from "@/components/ui/button";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";

// Custom dropdown component for month/year selection
function CalendarDropdown({ value, onChange, options, className, "aria-label": ariaLabel }) {
    const selectedOption = options?.find((option) => option.value === value);

    const handleValueChange = (newValue) => {
        if (onChange) {
            const syntheticEvent = {
                target: { value: newValue }
            };
            onChange(syntheticEvent);
        }
    };

    return (
        <div
            className="relative z-10"
            onClick={(e) => e.stopPropagation()}
            onPointerDown={(e) => e.stopPropagation()}
        >
            <Select
                value={String(value)}
                onValueChange={handleValueChange}
            >
                <SelectTrigger
                    className={cn(
                        "h-8 w-auto min-w-[70px] gap-1 border-input bg-background px-2 text-sm font-medium shadow-sm hover:bg-accent/50 focus:ring-primary/20",
                        className
                    )}
                    aria-label={ariaLabel}
                >
                    <SelectValue>{selectedOption?.label}</SelectValue>
                </SelectTrigger>
                <SelectContent
                    className="max-h-[200px]"
                    position="popper"
                    sideOffset={4}
                >
                    {options?.map((option) => (
                        <SelectItem
                            key={option.value}
                            value={String(option.value)}
                            disabled={option.disabled}
                            className="text-sm cursor-pointer"
                        >
                            {option.label}
                        </SelectItem>
                    ))}
                </SelectContent>
            </Select>
        </div>
    );
}

function Calendar({
    className,
    classNames,
    showOutsideDays = true,
    captionLayout = "label", // Change default to 'dropdown' if needed for year selection
    buttonVariant = "ghost",
    formatters,
    components,
    ...props
}) {
    const defaultClassNames = getDefaultClassNames();

    return (
        <DayPicker
            showOutsideDays={showOutsideDays}
            className={cn(
                "bg-background group/calendar p-3",
                className
            )}
            captionLayout={captionLayout}
            formatters={{
                formatMonthDropdown: (date) =>
                    date.toLocaleString("default", { month: "short" }),
                ...formatters,
            }}
            classNames={{
                root: cn("w-fit", defaultClassNames.root),
                months: cn(
                    "flex gap-4 flex-col md:flex-row relative",
                    defaultClassNames.months
                ),
                month: cn("flex flex-col w-full gap-4", defaultClassNames.month),
                nav: cn(
                    "flex items-center gap-1 w-full absolute top-0 inset-x-0 justify-between z-10",
                    defaultClassNames.nav
                ),
                button_previous: cn(
                    buttonVariants({ variant: buttonVariant }),
                    "h-7 w-7 bg-transparent p-0 opacity-50 hover:opacity-100",
                    "transition-all duration-150 hover:scale-110 active:scale-95",
                    defaultClassNames.button_previous
                ),
                button_next: cn(
                    buttonVariants({ variant: buttonVariant }),
                    "h-7 w-7 bg-transparent p-0 opacity-50 hover:opacity-100",
                    "transition-all duration-150 hover:scale-110 active:scale-95",
                    defaultClassNames.button_next
                ),
                month_caption: cn(
                    "flex items-center justify-center h-9 w-full",
                    defaultClassNames.month_caption
                ),
                dropdowns: cn(
                    "w-full flex items-center text-sm font-medium justify-center h-9 gap-2",
                    defaultClassNames.dropdowns
                ),
                dropdown_root: cn(
                    "relative",
                    defaultClassNames.dropdown_root
                ),
                dropdown: cn(
                    "absolute inset-0 opacity-0",
                    defaultClassNames.dropdown
                ),
                caption_label: cn(
                    "select-none font-medium",
                    captionLayout === "label"
                        ? "text-sm"
                        : "hidden", // Hide label when using dropdowns
                    defaultClassNames.caption_label
                ),
                table: "w-full border-collapse space-y-1",
                month_grid: "w-full border-collapse",
                weekdays: "flex justify-center",
                weekday: "text-muted-foreground rounded-lg w-9 font-normal text-[0.8rem] text-center",
                week: "flex w-full mt-1.5 justify-center gap-0.5",
                day: cn(
                    "relative p-0 text-center text-sm focus-within:relative focus-within:z-20 [&:has([aria-selected])]:bg-accent [&:has([aria-selected])]:rounded-lg",
                    props.mode === "range"
                        ? "[&:has(>.day-range-end)]:rounded-r-lg [&:has(>.day-range-start)]:rounded-l-lg first:[&:has([aria-selected])]:rounded-l-lg last:[&:has([aria-selected])]:rounded-r-lg"
                        : "[&:has([aria-selected])]:rounded-lg"
                ),
                day_button: cn(
                    buttonVariants({ variant: "ghost" }),
                    "h-9 w-9 p-0 font-normal rounded-lg aria-selected:opacity-100",
                    "transition-all duration-150 ease-out",
                    "hover:scale-[1.08] active:scale-[0.94]",
                    "focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:ring-offset-1"
                ),
                range_start: "day-range-start",
                range_end: "day-range-end",
                selected:
                    "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground focus:bg-primary focus:text-primary-foreground rounded-lg shadow-sm transition-colors duration-150",
                today: "bg-accent text-accent-foreground rounded-lg ring-1 ring-primary/20",
                outside: "text-muted-foreground opacity-40 hover:opacity-60 transition-opacity duration-150",
                disabled: "text-muted-foreground opacity-30 cursor-not-allowed hover:scale-100",
                range_middle:
                    "aria-selected:bg-accent aria-selected:text-accent-foreground",
                hidden: "invisible",
                ...classNames,
            }}
            components={{
                IconLeft: ({ ...props }) => <ChevronLeft className="h-4 w-4" />,
                IconRight: ({ ...props }) => <ChevronRight className="h-4 w-4" />,
                Dropdown: CalendarDropdown, // Use custom dropdown
                ...components,
            }}
            {...props}
        />
    );
}

export { Calendar };
