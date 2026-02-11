import React, { useState, useMemo, useEffect } from "react";
import { useAppData } from "../../../context/AppDataContext";
import { Plus } from 'lucide-react';
import { api } from "../../../api/api";
import HolidaysTable from "./components/HolidaysTable";
import HolidaysModal from "./components/HolidaysModal";
import HolidaysDeleteModal from "./components/HolidaysDeleteModal";
import Search from "../../../components/navigations/Search";
import ReactLoading from "react-loading";

const Holidays = () => {
  const {
    isLoading,
    headerReq,
  } = useAppData();

  const [holidays, setHolidays] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState("add");
  const [formHoliday, setFormHoliday] = useState({
    holiday_title: "",
    holiday_type: "",
    date: "",
    isFixedDate: false,
  });

  // For delete confirmation
  const [deleteModalVisible, setDeleteModalVisible] = useState(false);
  const [holidayIdToDelete, setHolidayIdToDelete] = useState(null);

  // Search state and handler
  const [search, setSearch] = useState("");
  const handleSearchChange = (e) => {
    setSearch(e.target.value);
  };

  useEffect(() => {
    api("holiday_list", headerReq)
      .then((res) => {
        // If the response is an array, set directly
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

  // Modal open for add
  const handleAddHoliday = () => {
    setModalMode("add");
    setFormHoliday({
      holiday_title: "",
      holiday_type: "",
      date: "",
      isFixedDate: false,
    });
    setShowModal(true);
  };

  // Modal open for edit
  const handleEditHoliday = (holiday) => {
    setModalMode("edit");
    setFormHoliday({
      holiday_title: holiday.holiday_title,
      holiday_type: holiday.holiday_type,
      date: holiday.date,
      isFixedDate: !!holiday.isFixedDate,
      id: holiday.id,
    });
    setShowModal(true);
  };

  // Save handler for modal (add or edit)
  const handleModalSave = async () => {
    if (!formHoliday.holiday_title || !formHoliday.holiday_type || !formHoliday.date) {
      return;
    }
    if (modalMode === "add") {
      const apiPayload = {
        holiday_title: formHoliday.holiday_title,
        holiday_type: formHoliday.holiday_type,
        date: formHoliday.date,
        isFixedDate: formHoliday.isFixedDate,
      };
      api("holiday_create", headerReq, apiPayload)
        .then((res) => {
          // Assume res is the new holiday object with id
          setHolidays((prev) => [...prev, { ...apiPayload, id: res.id }]);
          setShowModal(false);
        })
        .catch(() => {});
    } else if (modalMode === "edit") {
      const apiPayload = {
        holiday_title: formHoliday.holiday_title,
        holiday_type: formHoliday.holiday_type,
        date: formHoliday.date,
        isFixedDate: formHoliday.isFixedDate,
      };
      api("holiday_update", {...headerReq,id: formHoliday.id }, apiPayload)
        .then((res) => {
          setHolidays((prev) => prev.map(h => h.id === formHoliday.id ? { ...h, ...apiPayload } : h));
          setShowModal(false);
        })
        .catch(() => {});
    }
  };

  // Delete handler
  const handleDelete = (id) => {
    api("holiday_delete", {...headerReq, id })
      .then(() => {
        setHolidays(prev => prev.filter(holiday => holiday.id !== id));
      })
      .catch(() => {});
    setDeleteModalVisible(false);
    setHolidayIdToDelete(null);
  };

  useEffect(() => {
    document.title = "Holidays | Aidea Time Charging";
  }, []);

  return (
    <div className="flex flex-col h-screen bg-gray-50">
      <div className="container-fluid h-full">
        {showModal && (
          <HolidaysModal
            show={showModal}
            modalMode={modalMode}
            formHoliday={formHoliday}
            setFormHoliday={setFormHoliday}
            onClose={() => setShowModal(false)}
            onSave={handleModalSave}
          />
        )}

        {deleteModalVisible && (
          <HolidaysDeleteModal
            holidayId={holidayIdToDelete}
            setModalVisible={setDeleteModalVisible}
            onDelete={handleDelete}
          />
        )}

        <div className="w-full sticky top-0 bg-white flex justify-between items-center border-b p-3 z-10">
          {/* <Pagination
            currentPage={page}
            lastPage={totalPages}
            totalPages={totalPages}
            totalRecords={departments.length}
            onPageChange={setPage}
          /> */}
          <h1 className="text-xl font-semibold text-gray-700">Holidays</h1>
            
          <div className="flex gap-3 justify-end w-full">
            <Search
              value={search}
              onChange={handleSearchChange}
              placeholder="Search holiday"
            />
            <div
              className="flex items-center bg-gray-100 hover:bg-gray-200 rounded-full transition-all duration-300 shadow-sm cursor-pointer min-h-[40px] px-3"
              onClick={handleAddHoliday}
              style={{ minHeight: 40 }}
            >
              <span className="flex items-center justify-center text-gray-500">
                <Plus size={20} />
              </span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-12 h-[calc(100vh-8rem)] overflow-y-auto">
          <div className="col-span-12 flex flex-col overflow-x-auto h-full">
            {isLoading ? (
              <div className="flex items-center justify-center h-screen bg-gray-100 w-full">
                <ReactLoading type="bars" color="#888888" height={50} width={50} />
              </div>
            ) : (
              <div className="overflow-auto h-full flex flex-col pb-20 sm:pb-4">
                <HolidaysTable
                  holidays={holidays}
                  onEdit={handleEditHoliday}
                  onDelete={(id) => {
                    setHolidayIdToDelete(id);
                    setDeleteModalVisible(true);
                  }}
                />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Holidays;