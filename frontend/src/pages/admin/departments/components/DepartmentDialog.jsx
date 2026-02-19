import React, { useEffect, useState } from "react";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogFooter,
    DialogClose
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";

const DepartmentDialog = ({ open, onOpenChange, department, onSave, subsidiaries, staffs }) => {
    const [formData, setFormData] = useState({
        name: "",
        subsidiary_id: "",
        department_head_id: ""
    });

    useEffect(() => {
        if (department) {
            setFormData({
                name: department.name || "",
                subsidiary_id: department.subsidiary_id ? String(department.subsidiary_id) : "",
                department_head_id: department.department_head_id ? String(department.department_head_id) : ""
            });
        } else {
            setFormData({
                name: "",
                subsidiary_id: "",
                department_head_id: ""
            });
        }
    }, [department, open]);

    const handleChange = (field, value) => {
        setFormData(prev => ({ ...prev, [field]: value }));
        // Reset head if subsidiary changes? Maybe.
        if (field === 'subsidiary_id') {
            setFormData(prev => ({ ...prev, subsidiary_id: value, department_head_id: "" }));
        }
    };

    const handleSave = () => {
        onSave(formData);
    };

    const filteredHeads = staffs.filter((u) =>
        String(u.subsidiary_id) === String(formData.subsidiary_id) &&
        (u.role_id === 2 || u.role_id === 3) &&
        (u.is_active === "yes")
    );

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>{department ? "Edit Department" : "Add Department"}</DialogTitle>
                    <DialogDescription>
                        {department ? "Update department details." : "Create a new department."}
                    </DialogDescription>
                </DialogHeader>

                <div className="grid gap-4 py-4">
                    <div className="grid gap-2">
                        <Label htmlFor="name">Department Name</Label>
                        <Input
                            id="name"
                            value={formData.name}
                            onChange={(e) => handleChange("name", e.target.value)}
                            placeholder="e.g. Engineering"
                        />
                    </div>
                    <div className="grid gap-2">
                        <Label>Subsidiary</Label>
                        <Select value={formData.subsidiary_id} onValueChange={(v) => handleChange("subsidiary_id", v)}>
                            <SelectTrigger>
                                <SelectValue placeholder="Select subsidiary" />
                            </SelectTrigger>
                            <SelectContent>
                                {subsidiaries.map(s => (
                                    <SelectItem key={s.id} value={String(s.id)}>{s.name}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="grid gap-2">
                        <Label>Department Head</Label>
                        <Select value={formData.department_head_id} onValueChange={(v) => handleChange("department_head_id", v)} disabled={!formData.subsidiary_id}>
                            <SelectTrigger>
                                <SelectValue placeholder="Select department head" />
                            </SelectTrigger>
                            <SelectContent>
                                {filteredHeads.map(u => (
                                    <SelectItem key={u.id} value={String(u.id)}>{u.first_name} {u.last_name}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
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

export default DepartmentDialog;
