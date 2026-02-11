import { CheckSquare, XSquare, RefreshCw, CircleCheck } from 'lucide-react';

const ApprovalTable = ({
  data,
  selectedTimeCharges,
  handleRowSelect,
  handleSelectAll,
  requestSort,
  renderSortIndicator,
  formatDate,
  openModal,
  sortConfig
}) => {
  const getSortedData = () => {
    if (!sortConfig.key) return data;
    return [...data].sort((a, b) => {
      let aValue, bValue;
      switch (sortConfig.key) {
        case 'employee':
          aValue = a.user.first_name + ' ' + a.user.last_name;
          bValue = b.user.first_name + ' ' + b.user.last_name;
          break;
        case 'project':
          aValue = a.time_charge_type === 1 || 2 ? a.project_label : '';
          bValue = b.time_charge_type === 1 || 2 ? b.project_label : '';
          break;
        case 'stage':
          aValue = a.time_charge_type === 1 || 2 ? a.stage_label : '';
          bValue = b.time_charge_type === 1 || 2 ? b.stage_label : '';
          break;
        case 'activity':
          aValue = a.time_charge_type === 1 || 2 ? a.activity : '';
          bValue = b.time_charge_type === 1 || 2 ? b.activity : '';
          break;
        case 'duration':
          aValue = parseInt(a.duration_hrs) * 60 + parseInt(a.duration_min);
          bValue = parseInt(b.duration_hrs) * 60 + parseInt(b.duration_min);
          break;
        case 'is_ot':
          aValue = a.is_ot;
          bValue = b.is_ot;
          break;
        default:
          aValue = a[sortConfig.key];
          bValue = b[sortConfig.key];
      }
      if (aValue < bValue) return sortConfig.direction === 'ascending' ? -1 : 1;
      if (aValue > bValue) return sortConfig.direction === 'ascending' ? 1 : -1;
      return 0;
    });
  };

  const sortedData = Array.isArray(getSortedData()) ? getSortedData() : [];

  const pendingIds = Array.isArray(data) ? data.filter(item => item.status === 'pending').map(item => item.id) : [];
  const allChecked = pendingIds.length > 0 && (selectedTimeCharges?.length || 0) === pendingIds.length && pendingIds.every(id => (selectedTimeCharges || []).includes(id));

  return (
    <table className="table-auto w-full text-sm text-left text-gray-900">
      <thead className="bg-gray-100 sticky top-0  text-sm font-bold">
        <tr>
          <th className="p-4">
            <input
              type="checkbox"
              checked={allChecked}
              onChange={handleSelectAll}
              className="h-4 w-4 text-primary border-gray-300 focus:ring-primary rounded cursor-pointer"
            />
          </th>
          {[
            { label: 'Date', key: 'time_charge_date' },
            { label: 'Employee', key: 'employee' },
            { label: 'Project', key: 'project' },
            { label: 'Stage', key: 'stage' },
            { label: 'Activity', key: 'activity' },
            { label: 'Duration', key: 'duration' },
            { label: 'OT', key: 'is_ot' },
            { label: 'Remarks', key: 'remarks' },
            { label: 'Status', key: 'status' },
          ].map(col => (
            <th key={col.key} onClick={() => requestSort(col.key)} className="cursor-pointer p-4">
              <div className="flex items-center">
                {col.label} {renderSortIndicator(col.key)}
              </div>
            </th>
          ))}
          <th className="p-4">Actions</th>
        </tr>
      </thead>
      <tbody>
        {sortedData.length > 0 ? (
          sortedData.map((timeCharge, idx) => {
            const initials = `${timeCharge.user?.first_name?.[0]?.toUpperCase() || ''}${timeCharge.user?.last_name?.[0]?.toUpperCase() || ''}`;
            const startTime = timeCharge.start_time;
            const endTime = timeCharge.end_time;
            // Helper to format time to 12-hour format
            const formatTo12Hour = (timeStr) => {
              if (!timeStr) return '';
              const [hour, minute] = timeStr.split(':');
              let h = parseInt(hour, 10);
              const ampm = h >= 12 ? 'PM' : 'AM';
              h = h % 12 || 12;
              return `${h}:${minute} ${ampm}`;
            };

            return (
              <tr key={timeCharge.id} className={`hover:bg-gray-100 ${idx % 2 === 1 ? 'bg-gray-50' : 'bg-white'} transition`}>
                <td className="p-4">
                  {timeCharge.status === 'pending' && (
                    <input
                      type="checkbox"
                      checked={selectedTimeCharges.includes(timeCharge.id)}
                      onChange={() => handleRowSelect(timeCharge.id)}
                      className="h-4 w-4 text-primary border-gray-300 focus:ring-primary rounded cursor-pointer"
                    />
                  )}
                </td>
                <td className="p-2">{formatDate(timeCharge.time_charge_date)}</td>
                <td className="p-2">
                  <div className="flex items-center">
                    {timeCharge.user?.profile ? (
                      <img className="w-10 h-10 rounded-full" src={`data:image/png;base64,${timeCharge.user.profile}`} alt="User" />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center">
                        <span className="text-gray-950 font-bold text-lg">{initials}</span>
                      </div>
                    )}
                    <div className="ps-3">
                      <div className="font-semibold">{timeCharge.user.first_name} {timeCharge.user.last_name}</div>
                      <div className="text-xs text-gray-500">{timeCharge.user.email}</div>
                    </div>
                  </div>
                </td>
                <td className="p-2">
                  <div className="flex items-center">
                    <div className="ps-3">

                      {/* project_code */}
                      <div className="font-semibold">
                        {timeCharge.time_charge_type ? timeCharge.project_code : ''}
                      </div>

                      {/* project_label with conditional styles */}
                      <div
                        className={
                          timeCharge.time_charge_type === 1
                            ? "text-xs"
                            : [2, 3].includes(timeCharge.time_charge_type)
                              ? "text-sm font-semibold"
                              : ""
                        }
                      >
                        {timeCharge.time_charge_type ? timeCharge.project_label : ''}
                      </div>

                    </div>
                  </div>
                </td>
                <td className="p-2 text-sm">{timeCharge.time_charge_type ? timeCharge.stage_label : ''}</td>
                <td className="p-2">{timeCharge.time_charge_type ? timeCharge.activity : ''}</td>
                <td className="p-2">
                  <div className="flex items-center">
                    <div className="ps-3">
                      <div className="text-sm font-mono text-gray-900">{timeCharge.duration_hrs}h {timeCharge.duration_min}m</div>
                      <div className="text-xs text-gray-400">
                        {startTime && endTime ? `${formatTo12Hour(startTime.split(' ')[1])} - ${formatTo12Hour(endTime.split(' ')[1])}` : ''}
                      </div>
                    </div>
                  </div>
                </td>
                <td className="p-2 text-center">
                  {timeCharge.is_ot ? (
                    <div className="flex justify-center">
                      <span className="inline-flex items-center justify-center bg-gray-500 rounded-full w-5 h-5">
                        <CircleCheck color="white" size={18} />
                      </span>
                    </div>
                  ) : ''}
                </td>
                <td className="p-2 text-xs paragraph">{timeCharge.remarks}</td>
                <td className="p-2">
                  <span className={`px-3 py-1 rounded-full text-white font-semibold text-sm w-full text-center
                    ${timeCharge.status === 'pending' ? 'bg-yellow-400 text-yellow-900' : ''}
                    ${timeCharge.status === 'approved' ? 'bg-green-500' : ''}
                    ${timeCharge.status === 'declined' ? 'bg-red-500' : ''}`}>
                    {timeCharge.status}
                  </span>
                </td>
                <td className="p-2">
                  {timeCharge.status === 'pending' ? (
                    <div className="flex gap-2">
                      <button onClick={() => openModal('approve', timeCharge)} className="bg-primary text-white rounded-full px-3 py-2">
                        <CheckSquare size={18} />
                      </button>
                      <button onClick={() => openModal('decline', timeCharge)} className="bg-gray-300 text-gray-950 rounded-full px-3 py-2">
                        <XSquare size={18} />
                      </button>
                    </div>
                  ) : (
                    <button onClick={() => openModal('reopen', timeCharge)} className="bg-orange-300 text-gray-950 rounded-full px-3 py-2">
                      <RefreshCw size={18} />
                    </button>
                  )}
                </td>
              </tr>
            );
          })
        ) : (
          <tr>
            <td colSpan="10" className="text-center py-4 text-gray-500">No time charges found</td>
          </tr>
        )}
      </tbody>
    </table>
  );
};

export default ApprovalTable;
