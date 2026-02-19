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

const ProjectsInternalModal = ({
  editingProject,
  formState,
  setFormState,
  handleModalOk,
  handleInputChange,
  setModalVisible,
  subsidiaries,
}) => {
  // Reset form when modal opens
  useEffect(() => {
    if (!editingProject) {
      // Optional: reset form if needed logic here, mostly handled by parent
    }
  }, [editingProject]);

  const handleSelectChange = (name, value) => {
    setFormState((prev) => ({ ...prev, [name]: value }));
  };

  return (
    <Dialog open={true} onOpenChange={setModalVisible}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{editingProject ? "Edit Project" : "Add Project"}</DialogTitle>
          <DialogDescription>
            Make changes to the project details here. Click save when you're done.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleModalOk} className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="project_code" className="text-right">
              Code
            </Label>
            <Input
              id="project_code"
              name="project_code"
              value={formState.project_code}
              onChange={handleInputChange}
              className="col-span-3"
              required
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="project_name" className="text-right">
              Name
            </Label>
            <Input
              id="project_name"
              name="project_name"
              value={formState.project_name}
              onChange={handleInputChange}
              className="col-span-3"
              required
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="subsidiary_id" className="text-right">
              Subsidiary
            </Label>
            <div className="col-span-3">
              <Select
                value={formState.subsidiary_id ? String(formState.subsidiary_id) : ""}
                onValueChange={(val) => handleSelectChange("subsidiary_id", val)}
                required
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select subsidiary" />
                </SelectTrigger>
                <SelectContent>
                  {subsidiaries?.map((s) => (
                    <SelectItem key={s.id} value={String(s.id)}>
                      {s.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="project_status" className="text-right">
              Status
            </Label>
            <div className="col-span-3">
              <Select
                value={formState.project_status}
                onValueChange={(val) => handleSelectChange("project_status", val)}
                required
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Active">Active</SelectItem>
                  <SelectItem value="Inactive">Inactive</SelectItem>
                  <SelectItem value="Closed">Closed</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="secondary" onClick={() => setModalVisible(false)}>
              Cancel
            </Button>
            <Button type="submit">
              {editingProject ? "Save changes" : "Create project"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default ProjectsInternalModal;
