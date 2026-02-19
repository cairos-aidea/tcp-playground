import React, { useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";

const ProjectsExternalModal = ({
    isVisible, // New prop to control visibility
    editingProject,
    formState,
    setFormState,
    handleModalOk,
    handleInputChange,
    setModalVisible,
    staffs,
    departments,
}) => {
    // Reset form checks or logic if needed when editingProject changes
    useEffect(() => { }, [editingProject]);

    const handleSelectChange = (name, value) => {
        setFormState((prev) => ({ ...prev, [name]: value }));
    };

    // staffs filter for roles 2 (Manager) and 3 (Admin) typically?
    // Adapting logic from original file: staffs.filter(staff => [2, 3].includes(staff.role_id))
    const projectOwners = staffs?.filter(staff => [2, 3].includes(staff.role_id)) || [];

    return (
        <Dialog open={isVisible} onOpenChange={setModalVisible}>
            <DialogContent className="sm:max-w-[600px] bg-white text-black">
                <DialogHeader>
                    <DialogTitle>{editingProject ? "Edit External Project" : "Add External Project"}</DialogTitle>
                    <DialogDescription>
                        {editingProject
                            ? "Update project details below."
                            : "Create a new external project. Project Code must be unique."}
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleModalOk} className="grid gap-4 py-4">

                    {/* Row 1: Code & Name */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="grid gap-2">
                            <Label htmlFor="project_code">Project Code</Label>
                            <Input
                                id="project_code"
                                name="project_code"
                                value={formState.project_code}
                                onChange={handleInputChange}
                                required
                                placeholder="Ex. 2023-001"
                            />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="project_name">Project Name</Label>
                            <Input
                                id="project_name"
                                name="project_name"
                                value={formState.project_name}
                                onChange={handleInputChange}
                                required
                                placeholder="Ex. Aidea HQ"
                            />
                        </div>
                    </div>

                    {/* Row 2: Studio & Owner */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="grid gap-2">
                            <Label htmlFor="studio">Studio/Department</Label>
                            <Select
                                value={formState.studio}
                                onValueChange={(val) => handleSelectChange("studio", val)}
                                required
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Select Studio" />
                                </SelectTrigger>
                                <SelectContent className="bg-white">
                                    {departments?.map((dept, idx) => (
                                        <SelectItem key={`dept-${dept.id}-${idx}`} value={dept.name}>
                                            {dept.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="grid gap-2">
                            <Label htmlFor="owner_id">Project Owner</Label>
                            <Select
                                value={formState.owner_id ? String(formState.owner_id) : ""}
                                onValueChange={(val) => handleSelectChange("owner_id", val)}
                                required
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Select Owner" />
                                </SelectTrigger>
                                <SelectContent className="bg-white">
                                    {projectOwners.map((staff, idx) => (
                                        <SelectItem key={`owner-${staff.id}-${idx}`} value={String(staff.id)}>
                                            {staff.name || staff.username || staff.email}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    {/* Row 3: Status (Only if editing usually, but let's allow setting it) */}
                    <div className="grid gap-2">
                        <Label htmlFor="project_status">Status</Label>
                        <Select
                            value={formState.project_status || "active"}
                            onValueChange={(val) => handleSelectChange("project_status", val)}
                        >
                            <SelectTrigger>
                                <SelectValue placeholder="Select Status" />
                            </SelectTrigger>
                            <SelectContent className="bg-white">
                                <SelectItem value="active">Active</SelectItem>
                                <SelectItem value="inactive">Inactive</SelectItem>
                                <SelectItem value="completed">Completed</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    <DialogFooter className="mt-4">
                        <Button type="button" variant="secondary" onClick={() => setModalVisible(false)}>
                            Cancel
                        </Button>
                        <Button type="submit">
                            {editingProject ? "Save Changes" : "Create Project"}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
};

export default ProjectsExternalModal;
