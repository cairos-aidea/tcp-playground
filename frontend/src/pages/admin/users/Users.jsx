import React, { useState, useMemo, useEffect } from "react";
import { useAppData } from '../../../context/AppDataContext';
import { api } from "../../../api/api";
import PageContainer from "@/components/ui/PageContainer";
import { DataTable } from "@/components/ui/data-table";
import { columns } from "./components/columns";
import UserSheet from "./components/UserSheet";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";
import ReactLoading from "react-loading";

const Users = () => {
  const {
    isLoading,
    staffs,
    setStaffs,
    subsidiaries,
    departments,
    headerReq
  } = useAppData();

  const [search, setSearch] = useState("");
  const [selectedUser, setSelectedUser] = useState(null);
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Helper: Get names
  const getSubsidiaryName = (id) => subsidiaries.find((s) => s.id === Number(id))?.name || "";
  const getDepartmentName = (id) => departments.find((d) => d.id === Number(id))?.name || "";

  // Prepare data with derived fields
  const processedStaffs = useMemo(() => {
    return staffs.map(user => ({
      ...user,
      subsidiary_name: getSubsidiaryName(user.subsidiary_id),
      department_name: getDepartmentName(user.department),
      // Add full name for easier searching if needed, though we search fields below
    }));
  }, [staffs, subsidiaries, departments]);

  // Filter data
  const filteredStaffs = useMemo(() => {
    if (!search) return processedStaffs.filter(u => u.is_active === "yes");
    const lowerSearch = search.toLowerCase();
    return processedStaffs.filter(
      (u) =>
        (u.is_active === "yes") && (
          u.first_name?.toLowerCase().includes(lowerSearch) ||
          u.last_name?.toLowerCase().includes(lowerSearch) ||
          u.email?.toLowerCase().includes(lowerSearch) ||
          u.subsidiary_name?.toLowerCase().includes(lowerSearch) ||
          u.department_name?.toLowerCase().includes(lowerSearch) ||
          u.role_id?.toString().includes(lowerSearch)
        )
    );
  }, [processedStaffs, search]);

  const handleEditUser = (user) => {
    setSelectedUser(user);
    setIsSheetOpen(true);
  };

  const handleSaveUser = (id, updatedData) => {
    setIsSaving(true);
    // Ensure correct types
    const apiPayload = {
      ...updatedData,
      role_id: Number(updatedData.role_id),
      subsidiary_id: Number(updatedData.subsidiary_id),
      department: Number(updatedData.department),
    };

    api("staff_update", { ...headerReq, id }, apiPayload)
      .then(() => {
        setStaffs((prev) =>
          prev.map((user) =>
            user.id === id ? { ...user, ...apiPayload } : user
          )
        );
        setIsSheetOpen(false);
        setIsSaving(false);
      })
      .catch((err) => {
        console.error("Update failed", err);
        setIsSaving(false);
        // Toast notification would be good here
      });
  };

  useEffect(() => {
    document.title = "Users | Aidea Time Charging";
  }, []);

  return (
    <PageContainer>
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h2 className="text-2xl font-bold tracking-tight">Users</h2>
            <p className="text-muted-foreground">Manage system users, roles, and assignments.</p>
          </div>
          <div className="relative w-full sm:w-72">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search users..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-8"
            />
          </div>
        </div>

        {isLoading ? (
          <div className="flex h-[400px] items-center justify-center">
            <ReactLoading type="bars" color="#888888" />
          </div>
        ) : (
          <DataTable
            columns={columns(handleEditUser)}
            data={filteredStaffs}
          />
        )}

        <UserSheet
          isOpen={isSheetOpen}
          onClose={() => setIsSheetOpen(false)}
          user={selectedUser}
          onSave={handleSaveUser}
          subsidiaries={subsidiaries}
          departments={departments}
          isLoading={isSaving}
        />
      </div>
    </PageContainer>
  );
};

export default Users;