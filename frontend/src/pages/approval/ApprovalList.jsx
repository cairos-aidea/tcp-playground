import React, { useState, useEffect } from 'react';
import { CheckSquare, XSquare, Filter, ChevronDown, ChevronUp } from 'lucide-react';
import { api } from '../../api/api';
import { useAppData } from '../../context/AppDataContext';
import ActionModal from './components/ActionModal';
import FilterSidebar from './components/FilterSidebar';
import Pagination from './components/Pagination';
import ApprovalTable from './components/ApprovalTable';
import ReactLoading from "react-loading";

const ApprovalList = () => {
  const {
    projects,
    projectStages,
    staffs,
    departments,
    timeCharges,
    holidays,
    leaves,
    auth_user,
    headerReq,
    isLoading,
    fetchApproversList,
  } = useAppData();

  // Local state
  const [selectedTimeCharges, setSelectedTimeCharges] = useState([]);
  const [currentTimeCharge, setCurrentTimeCharge] = useState(null);
  const [isBulk, setIsBulk] = useState(false);
  const [pageId, setPageId] = useState(1);
  const [lastPage, setLastPage] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'ascending' });
  const [showSidebarOptions, setShowSidebarOptions] = useState('filter');
  const [filter, setFilter] = useState({
    is_ot: false,
    start_date: null,
    end_date: null,
    project_id: null,
    stage_id: null,
    staff_id: null,
    status: null
  });
  const [modal, setModal] = useState({
    type: null,
    isOpen: false
  });

  const [itemsPerPage, setItemsPerPage] = useState(25);
  // const [stats, setStats] = useState({});

  useEffect(() => {
    document.title = "Approval List | Aidea Time Charging";
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    try {
      const result = await fetchApproversList(1, filter, itemsPerPage);
      setPageId(result.current_page);
      setLastPage(result.last_page);
      setTotalRecords(result.total);
    } catch (error) {
      console.error('Error in loadInitialData:', error);
    }
  };

  const fetchApprovalList = async (page = 1, perPage = itemsPerPage) => {
    try {
      const result = await fetchApproversList(page, filter, perPage);
      setPageId(result.current_page);
      setLastPage(result.last_page);
      setTotalRecords(result.total);
      return result;
    } catch (error) {
      console.error('Error in fetchApprovalList:', error);
    }
  };

  const handleRowSelect = (id) => {
    setSelectedTimeCharges(prev => {
      const exists = prev.includes(id);
      return exists
        ? prev.filter(item => item !== id)
        : [...prev, id];
    });
  };

  const handleSelectAll = () => {
    const pendingIds = timeCharges.data
      .filter(item => item.status === 'pending')
      .map(item => item.id);

    if (
      selectedTimeCharges.length === pendingIds.length &&
      pendingIds.every(id => selectedTimeCharges.includes(id))
    ) {
      setSelectedTimeCharges([]);
    } else {
      setSelectedTimeCharges(pendingIds);
    }
  };

  const resetFilter = () => {
    setFilter({
      is_ot: false,
      start_date: null,
      end_date: null,
      project_id: null,
      stage_id: null,
      staff_id: null,
      status: null
    });
  };

  const applyFilter = () => {
    fetchApprovalList(1, itemsPerPage);
  };

  const handleAction = async (action) => {
    try {
      const payload = {
        time_charge_ids: isBulk ? selectedTimeCharges : [currentTimeCharge.id]
      };

      // console.log(payload);

      await api(action, headerReq, payload);

      // Update local state to reflect changes
      const newData = [...timeCharges.data];
      if (isBulk) {
        selectedTimeCharges.forEach(id => {
          const index = newData.findIndex(item => item.id === id);
          if (index !== -1) {
            newData[index] = {
              ...newData[index],
              status: action === 'approve' ? 'approved' :
                action === 'decline' ? 'declined' : 'pending'
            };
          }
        });
      } else {
        const index = newData.findIndex(item => item.id === currentTimeCharge.id);
        if (index !== -1) {
          newData[index] = {
            ...newData[index],
            status: action === 'approve' ? 'approved' :
              action === 'decline' ? 'declined' : 'pending'
          };
        }
      }
      // Update time charges state
      timeCharges.data = newData;
      setSelectedTimeCharges([]);
      setCurrentTimeCharge(null);
      setIsBulk(false);

      // Reset state
      setModal({ type: null, isOpen: false });
    } catch (error) {
      console.error(`Error performing ${action} action:`, error);
    }
  };

  const openModal = (type, timeCharge = null, bulk = false) => {
    setCurrentTimeCharge(timeCharge);
    setIsBulk(bulk);
    setModal({ type, isOpen: true });
  };

  const closeModal = () => {
    setModal({ type: null, isOpen: false });
    setCurrentTimeCharge(null);
    setIsBulk(false);
  };

  const requestSort = (key) => {
    setSortConfig(prev => {
      let direction = 'ascending';
      if (prev.key === key && prev.direction === 'ascending') {
        direction = 'descending';
      }
      return { key, direction };
    });
  };

  const renderSortIndicator = (key) => {
    if (sortConfig.key !== key) {
      return <ChevronDown className="sort-icon" size={14} />;
    }
    return sortConfig.direction === 'ascending'
      ? <ChevronUp className="sort-icon active" size={14} />
      : <ChevronDown className="sort-icon active" size={14} />;
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  return (
    <div className="flex flex-col h-screen bg-gray-50">
      <div className="container-fluid h-full">
        <ActionModal
          isOpen={modal.isOpen}
          type={modal.type}
          isBulk={isBulk}
          onClose={closeModal}
          onConfirm={() => handleAction(modal.type)}
          timeCharge={currentTimeCharge}
          selectedTimeCharges={selectedTimeCharges.map(id =>
            timeCharges.data.find(item => item.id === id)
          )}
        />

        <div className="w-full sticky top-0 bg-white flex justify-between items-center border-b p-3 z-10">
          <h1 className="text-xl font-semibold text-gray-700">Approval List</h1>
          {selectedTimeCharges.length > 0 && (
            <div className="flex gap-3 items-center justify-center ">
              <span className="text-sm text-gray-700 font-semibold">
                {selectedTimeCharges.length} item{selectedTimeCharges.length !== 1 ? 's' : ''} selected:
              </span>
              <div className="relative flex flex-col items-center group justify-center">
                <button
                  type="button"
                  tabIndex={0}
                  className="text-white bg-primary hover:bg-primary-hover focus:outline-none focus:ring-4 focus:ring-gray-300 font-medium rounded-full text-sm px-3 py-2"
                  onClick={() => openModal('approve', null, true)}
                  onMouseDown={e => e.preventDefault()}
                >
                  <CheckSquare size={18} />
                </button>
                <div className="absolute justifya top-full mt-2 left-1/2 -translate-x-1/2 bg-gray-800 text-white text-xs rounded px-2 py-1 opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity duration-200 whitespace-nowrap z-20">
                  Approve selected
                </div>
              </div>
              <div className="relative flex flex-col items-center group">
                <button
                  type="button"
                  tabIndex={0}
                  className="text-gray-700 bg-gray-300 hover:bg-gray-400 focus:outline-none focus:ring-4 focus:ring-gray-300 font-medium rounded-full text-sm px-3 py-2"
                  onClick={() => openModal('decline', null, true)}
                  onMouseDown={e => e.preventDefault()}
                >
                  <XSquare size={18} />
                </button>
                <div className="absolute top-full mt-2 left-1/2 -translate-x-1/2 bg-gray-800 text-white text-xs rounded px-2 py-1 opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity duration-200 whitespace-nowrap z-20">
                  Decline selected
                </div>
              </div>
            </div>
          )}
          <div className="gap-3 hidden sm:flex">
            {/* Filter Button */}
            <div
              className="flex items-center bg-gray-100 hover:bg-gray-200 rounded-full transition-all duration-300 shadow-sm cursor-pointer min-h-[40px] px-3"
              onClick={() => setShowSidebarOptions(showSidebarOptions === 'filter' ? null : 'filter')}
              tabIndex={0}
              style={{ minHeight: 40 }}
            >
              <span className="flex items-center justify-center text-gray-500">
                <Filter size={18} />
              </span>
              <div className="absolute top-full mt-2 left-1/2 -translate-x-1/2 bg-gray-800 text-white text-xs rounded px-2 py-1 opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity duration-200 whitespace-nowrap z-20">
                Filter
              </div>
            </div>

            {/* Stats Button */}
            {/* <div className="relative flex flex-col items-center group">
            <button
              type="button"
              tabIndex={0}
              className={`px-3 py-2 rounded-full border transition-colors duration-200 ${showSidebarOptions === 'stats'
                ? 'bg-gray-700 text-white border-gray-700'
                : 'bg-white text-gray-950 border-gray-400 hover:bg-gray-100 hover:text-gray-800'}`}
              onClick={() => setShowSidebarOptions(showSidebarOptions === 'stats' ? null : 'stats')}
              onMouseDown={e => e.preventDefault()}
            >
              <SquareChartGantt size={18} />
            </button>
            <div className="absolute top-full mt-2 left-1/2 -translate-x-1/2 bg-gray-800 text-white text-xs rounded px-2 py-1 opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity duration-200 whitespace-nowrap z-20">
              Show stats
            </div>
          </div> */}

            {/* Remind Button */}
            {/* <div className="relative flex flex-col items-center group">
            <button
              type="button"
              tabIndex={0}
              className={`px-3 py-2 rounded-full border transition-colors duration-200 ${showSidebarOptions === 'remind'
                ? 'bg-gray-700 text-white border-gray-700'
                : 'bg-white text-gray-950 border-gray-400 hover:bg-gray-100 hover:text-gray-800'}`}
              onMouseDown={e => e.preventDefault()}
            >
              <SendHorizontal size={18} />
            </button>
            <div className="absolute top-full mt-2 left-1/2 -translate-x-1/2 bg-gray-800 text-white text-xs rounded px-2 py-1 opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity duration-200 whitespace-nowrap z-20">
              Remind Staffs
            </div>
          </div> */}
          </div>
        </div>

        <div className="grid grid-cols-12 flex-1 overflow-hidden sm:overflow-y-auto">
          <div className={`${showSidebarOptions ? 'col-span-12 sm:col-span-10' : 'col-span-12'} h-[calc(100vh-8rem)] overflow-x-auto flex flex-col pb-20 sm:pb-0`}>
            {isLoading ? (
              <div className="flex items-center justify-center h-screen bg-gray-100">
                <ReactLoading type="bars" color="#888888" height={50} width={50} />
              </div>
            ) : (
              <div className="col-span-12 overflow-auto h-full flex flex-col pb-10 sm:pb-0">
                <ApprovalTable
                  data={timeCharges.data}
                  selectedTimeCharges={selectedTimeCharges}
                  handleRowSelect={handleRowSelect}
                  handleSelectAll={handleSelectAll}
                  requestSort={requestSort}
                  renderSortIndicator={renderSortIndicator}
                  formatDate={formatDate}
                  openModal={openModal}
                  sortConfig={sortConfig}
                />
              </div>

            )}
          </div>
          {showSidebarOptions && (
            <div className="hidden sm:block col-span-2 sticky border-l transition-all duration-300 overflow-auto h-[calc(100vh-8rem)]">
              {/* {showSidebarOptions === 'stats' && (
              <TimeChargeStats
                authUser={auth_user}
                departments={departments}
                staffs={staffs}
                holidays={holidays}
                leaves={leaves}
                headerReq={headerReq}
                setStats={setStats}
              />
            )} */}
              {showSidebarOptions === 'filter' && (
                <FilterSidebar
                  projects={projects}
                  projectStages={projectStages}
                  staffs={staffs}
                  filter={filter}
                  setFilter={setFilter}
                  applyFilter={applyFilter}
                  resetFilter={resetFilter}
                  auth_user={auth_user}
                />
              )}
            </div>
          )}
        </div>

        <div className="w-full sticky bottom-0 bg-white flex justify-center items-center border-t p-3 z-10">
          <Pagination
            currentPage={pageId}
            lastPage={lastPage}
            totalRecords={totalRecords}
            itemsPerPage={itemsPerPage}
            onPageChange={(page) => fetchApprovalList(page, itemsPerPage)}
          />
        </div>
      </div>
    </div>
  );
};

export default ApprovalList;