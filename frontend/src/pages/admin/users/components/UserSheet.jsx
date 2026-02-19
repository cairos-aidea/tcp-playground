import React, { useEffect, useState } from "react";
import {
    Sheet,
    SheetContent,
    SheetDescription,
    SheetHeader,
    SheetTitle,
    SheetFooter,
    SheetClose
} from "@/components/ui/sheet";
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
import { Separator } from "@/components/ui/separator";

const UserSheet = ({ isOpen, onClose, user, onSave, subsidiaries, departments, isLoading }) => {
    const [formData, setFormData] = useState({
        name: "",
        email: "",
        employee_id: "",
        role_id: "",
        status: "",
        job_title: "",
        subsidiary_id: "",
        department: "",
    });

    useEffect(() => {
        if (user) {
            setFormData({
                ...user,
                subsidiary_id: user.subsidiary_id ? String(user.subsidiary_id) : "",
                department: user.department ? String(user.department) : "",
                role_id: user.role_id ? String(user.role_id) : "",
                status: user.status || "",
                job_title: user.job_title || "",
            });
        }
    }, [user]);

    const handleChange = (field, value) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    const handleSave = () => {
        onSave(user.id, formData);
    };

    const filteredDepartments = departments.filter(d =>
        !formData.subsidiary_id || String(d.subsidiary_id) === String(formData.subsidiary_id)
    );

    return (
        <Sheet open={isOpen} onOpenChange={onClose}>
            <SheetContent className="sm:max-w-[540px] overflow-y-auto">
                <SheetHeader>
                    <SheetTitle>Edit User</SheetTitle>
                    <SheetDescription>
                        Make changes to the user profile here. Click save when you're done.
                    </SheetDescription>
                </SheetHeader>

                <div className="grid gap-6 py-4">
                    <div className="flex items-center gap-4">
                        <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center overflow-hidden border">
                            {/* Placeholder or image */}
                            {user?.profile ? (
                                <img src={`data:image/png;base64,${user.profile}`} alt="Profile" className="h-full w-full object-cover" />
                            ) : (
                                <span className="text-2xl font-bold text-muted-foreground">
                                    {user?.first_name?.[0]}{user?.last_name?.[0]}
                                </span>
                            )}
                        </div>
                        <div>
                            <h3 className="font-semibold text-lg">{user?.name}</h3>
                            <p className="text-sm text-muted-foreground">{user?.email}</p>
                            <p className="text-xs text-muted-foreground font-mono mt-1">{user?.employee_id}</p>
                        </div>
                    </div>

                    <Separator />

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label>Role</Label>
                            <Select value={String(formData.role_id)} onValueChange={(v) => handleChange("role_id", v)}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Select role" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="1">Employee</SelectItem>
                                    <SelectItem value="2">Manager</SelectItem>
                                    <SelectItem value="3">Admin</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label>Status</Label>
                            <Select value={formData.status} onValueChange={(v) => handleChange("status", v)}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Select status" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="Regular">Regular</SelectItem>
                                    <SelectItem value="Probationary">Probationary</SelectItem>
                                    <SelectItem value="Contractual">Contractual</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label>Job Title</Label>
                        <Input value={formData.job_title || ""} onChange={(e) => handleChange("job_title", e.target.value)} />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label>Subsidiary</Label>
                            <Select value={String(formData.subsidiary_id || "")} onValueChange={(v) => handleChange("subsidiary_id", v)}>
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
                        <div className="space-y-2">
                            <Label>Department</Label>
                            <Select value={String(formData.department)} onValueChange={(v) => handleChange("department", v)} disabled={!formData.subsidiary_id}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Select department" />
                                </SelectTrigger>
                                <SelectContent>
                                    {filteredDepartments.map(d => (
                                        <SelectItem key={d.id} value={String(d.id)}>{d.name}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                </div>

                <SheetFooter>
                    <SheetClose asChild>
                        <Button variant="outline">Cancel</Button>
                    </SheetClose>
                    <Button onClick={handleSave} disabled={isLoading}>Save Changes</Button>
                </SheetFooter>
            </SheetContent>
        </Sheet>
    );
};

export default UserSheet;
