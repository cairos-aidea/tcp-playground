import React, { useState, useMemo, useEffect } from "react";
import { useAppData } from "../../../context/AppDataContext";
import { api } from "../../../api/api";
import PageContainer from "@/components/ui/PageContainer";
import { DataTable } from "@/components/ui/data-table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Search } from "lucide-react";
import ReactLoading from "react-loading";
import { columns } from "./components/columns";
import HolidayDialog from "./components/HolidayDialog";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";

const Holidays = () => {
  const {
    isLoading,
    headerReq,
  } = useAppData();

  const [holidays, setHolidays] = useState([]);
  const [search, setSearch] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedHoliday, setSelectedHoliday] = useState(null);
  const [deleteId, setDeleteId] = useState(null);

  useEffect(() => {
    api("holiday_list", headerReq)
      .then((res) => {
        if (Array.isArray(res)) {
          setHolidays(res);
        } else if (res?.holidays && Array.isArray(res.holidays)) {
          setHolidays(res.holidays);
        } else {
          setHolidays([]);
        }
      })
      .catch(() => {
        setHolidays([]);
      });
  }, [headerReq]);

  const filteredHolidays = useMemo(() => {
    if (!search) return holidays;
    const lowerSearch = search.toLowerCase();
    return holidays.filter(
      (h) =>
        h.holiday_title?.toLowerCase().includes(lowerSearch) ||
        h.holiday_type?.toLowerCase().includes(lowerSearch) ||
        h.date?.includes(lowerSearch)
    );
  }, [holidays, search]);

  const handleAdd = () => {
    setSelectedHoliday(null);
    setIsDialogOpen(true);
  };

  const handleEdit = (holiday) => {
    setSelectedHoliday(holiday);
    setIsDialogOpen(true);
  };

  const handleDeleteClick = (holiday) => {
    setDeleteId(holiday.id);
  };

  const confirmDelete = () => {
    if (!deleteId) return;
    api("holiday_delete", { ...headerReq, id: deleteId })
      .then(() => {
        setHolidays((prev) => prev.filter((h) => h.id !== deleteId));
        setDeleteId(null);
      })
      .catch(() => {
        alert("Deletion failed.");
      });
  };

  const handleSave = (formData) => {
    if (!formData.holiday_title || !formData.holiday_type || !formData.date) return;

    const payload = {
      holiday_title: formData.holiday_title,
      holiday_type: formData.holiday_type,
      date: formData.date,
      isFixedDate: formData.isFixedDate,
    };

    if (selectedHoliday) {
      // Update
      api("holiday_update", { ...headerReq, id: selectedHoliday.id }, payload)
        .then(() => {
          setHolidays((prev) =>
            prev.map((h) =>
              h.id === selectedHoliday.id ? { ...h, ...payload } : h
            )
          );
          setIsDialogOpen(false);
        })
        .catch(() => {
          alert("Update failed.");
        });
    } else {
      // Create
      api("holiday_create", headerReq, payload)
        .then((res) => {
          setHolidays((prev) => [
            ...prev,
            { ...payload, id: res.id },
          ]);
          setIsDialogOpen(false);
        })
        .catch(() => {
          alert("Creation failed.");
        });
    }
  };

  useEffect(() => {
    document.title = "Holidays | Aidea Time Charging";
  }, []);

  return (
    <PageContainer>
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h2 className="text-2xl font-bold tracking-tight">Holidays</h2>
            <p className="text-muted-foreground">Manage holidays and non-working days.</p>
          </div>
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <div className="relative flex-1 sm:w-64">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search holidays..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-8"
              />
            </div>
            <Button onClick={handleAdd} size="icon" variant="outline">
              <Plus className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {isLoading ? (
          <div className="flex h-[400px] items-center justify-center">
            <ReactLoading type="bars" color="#888888" />
          </div>
        ) : (
          <DataTable
            columns={columns(handleEdit, handleDeleteClick)}
            data={filteredHolidays}
          />
        )}

        <HolidayDialog
          open={isDialogOpen}
          onOpenChange={setIsDialogOpen}
          holiday={selectedHoliday}
          onSave={handleSave}
        />

        <Dialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Confirm Deletion</DialogTitle>
              <DialogDescription>
                Are you sure you want to delete this holiday? This action cannot be undone.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button variant="outline" onClick={() => setDeleteId(null)}>Cancel</Button>
              <Button variant="destructive" onClick={confirmDelete}>Delete</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </PageContainer>
  );
};

export default Holidays;