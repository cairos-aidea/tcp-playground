import React from "react";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

const ProjectsExternalDeleteModal = ({ isVisible, setModalVisible, handleDelete, project }) => {
    return (
        <Dialog open={isVisible} onOpenChange={setModalVisible}>
            <DialogContent className="sm:max-w-[425px] bg-white">
                <DialogHeader>
                    <DialogTitle>Delete Project</DialogTitle>
                    <DialogDescription>
                        Are you sure you want to delete <strong>{project?.project_name}</strong>?
                        <br /><br />
                        This action cannot be undone and will also delete all associated stages.
                    </DialogDescription>
                </DialogHeader>
                <DialogFooter className="sm:justify-end gap-2">
                    <Button
                        type="button"
                        variant="outline"
                        onClick={() => setModalVisible(false)}
                    >
                        Cancel
                    </Button>
                    <Button
                        type="button"
                        variant="destructive"
                        onClick={() => {
                            handleDelete(project.id, project.project_code);
                            setModalVisible(false);
                        }}
                    >
                        Delete Project
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};

export default ProjectsExternalDeleteModal;
