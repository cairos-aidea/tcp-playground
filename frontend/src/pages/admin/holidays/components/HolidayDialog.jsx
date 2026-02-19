import React, { useEffect, useState } from "react";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";

const HolidayDialog = ({ open, onOpenChange, holiday, onSave }) => {
    const [formData, setFormData] = useState({
        holiday_title: "",
        holiday_type: "",
        date: "",
        isFixedDate: false
    });

    useEffect(() => {
        if (holiday) {
            setFormData({
                holiday_title: holiday.holiday_title || "",
                holiday_type: holiday.holiday_type || "",
                date: holiday.date || "",
                isFixedDate: !!holiday.isFixedDate
            });
        } else {
            setFormData({
                holiday_title: "",
                holiday_type: "",
                date: "",
                isFixedDate: false
            });
        }
    }, [holiday, open]);

    const handleChange = (field, value) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    const handleSave = () => {
        onSave(formData);
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>{holiday ? "Edit Holiday" : "Add Holiday"}</DialogTitle>
                    <DialogDescription>
                        {holiday ? "Update holiday details." : "Create a new holiday."}
                    </DialogDescription>
                </DialogHeader>

                <div className="grid gap-4 py-4">
                    <div className="grid gap-2">
                        <Label htmlFor="holiday_title">Title</Label>
                        <Input
                            id="holiday_title"
                            value={formData.holiday_title}
                            onChange={(e) => handleChange("holiday_title", e.target.value)}
                            placeholder="e.g. New Year's Day"
                        />
                    </div>
                    <div className="grid gap-2">
                        <Label>Type</Label>
                        <Select value={formData.holiday_type} onValueChange={(v) => handleChange("holiday_type", v)}>
                            <SelectTrigger>
                                <SelectValue placeholder="Select type" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="regular">Regular Holiday</SelectItem>
                                <SelectItem value="special">Special Holiday</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="grid gap-2">
                        <Label>Date</Label>
                        <Input
                            type="date"
                            value={formData.isFixedDate && formData.date ? `${new Date().getFullYear()}-${formData.date.slice(-5)}` : formData.date}
                            onChange={(e) => handleChange("date", e.target.value)}
                        />
                    </div>
                    <div className="flex items-center space-x-2">
                        <Checkbox
                            id="isFixedDate"
                            checked={formData.isFixedDate}
                            onCheckedChange={(checked) => handleChange("isFixedDate", checked)}
                        />
                        <Label htmlFor="isFixedDate">Fixed Date (Recurring)</Label>
                    </div>
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
                    <Button onClick={handleSave}>Save</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};

export default HolidayDialog;
