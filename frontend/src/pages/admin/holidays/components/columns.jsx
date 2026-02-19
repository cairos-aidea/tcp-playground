import { ArrowUpDown, MoreHorizontal, Pencil, Trash } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export const columns = (onEdit, onDelete) => [
    {
        accessorKey: "holiday_title",
        header: ({ column }) => {
            return (
                <Button
                    variant="ghost"
                    onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
                >
                    Holiday Title
                    <ArrowUpDown className="ml-2 h-4 w-4" />
                </Button>
            )
        },
        cell: ({ row }) => <span className="font-medium">{row.getValue("holiday_title")}</span>,
    },
    {
        accessorKey: "holiday_type",
        header: "Type",
        cell: ({ row }) => {
            const type = row.getValue("holiday_type");
            const variant = type === 'regular' ? 'default' : 'secondary';
            return <Badge variant={variant} className="capitalize">{type}</Badge>
        }
    },
    {
        accessorKey: "date",
        header: "Date",
        cell: ({ row }) => <span className="text-sm text-muted-foreground">{row.getValue("date")}</span>
    },
    {
        accessorKey: "isFixedDate",
        header: "Fixed Date",
        cell: ({ row }) => (
            <Checkbox checked={!!row.getValue("isFixedDate")} disabled />
        )
    },
    {
        id: "actions",
        cell: ({ row }) => {
            const holiday = row.original;
            return (
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0">
                            <span className="sr-only">Open menu</span>
                            <MoreHorizontal className="h-4 w-4" />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Actions</DropdownMenuLabel>
                        <DropdownMenuItem onClick={() => onEdit(holiday)}>
                            <Pencil className="mr-2 h-4 w-4" /> Edit Holiday
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem className="text-destructive" onClick={() => onDelete(holiday)}>
                            <Trash className="mr-2 h-4 w-4" /> Delete
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            );
        },
    },
];
