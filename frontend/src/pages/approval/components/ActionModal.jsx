import { CheckSquare, XSquare, RefreshCw, X, CircleCheck } from 'lucide-react';
import { formatStatus } from '../../../utilities/utils';

const ActionModal = ({
  isOpen,
  type,
  isBulk,
  onClose,
  onConfirm,
  timeCharge,
  selectedTimeCharges
}) => {
  if (!isOpen) return null;

  const renderIcon = () => {
    switch (type) {
      case 'approve':
        return <CheckSquare className="w-8 h-8 text-white" size={26} />;
      case 'decline':
        return <XSquare className="w-8 h-8 text-white" size={26} />;
      case 'reopen':
        return <RefreshCw className="w-8 h-8 text-white" size={26} />;
      default:
        return null;
    }
  };

  const getTitle = () => {
    switch (type) {
      case 'approve':
        return 'Approve Time Charges';
      case 'decline':
        return 'Decline Time Charges';
      case 'reopen':
        return 'Reopen Time Charges';
      default:
        return 'Confirm Action';
    }
  };

  const getMessage = () => {
    const action = type === 'approve'
      ? 'approve'
      : type === 'decline'
        ? 'decline'
        : 'reopen';

    return `Are you sure you want to ${action} the selected time ${isBulk ? 'charges' : 'charge'}?`;
  };

  const getActionButtonClass = () => {
    switch (type) {
      case 'approve':
        return 'bg-green-500 text-white hover:bg-green-600';
      case 'decline':
        return 'bg-red-500 text-white hover:bg-red-600';
      case 'reopen':
        return 'bg-yellow-500 text-white hover:bg-yellow-600';
      default:
        return '';
    }
  };

  const getActionButtonText = () => {
    switch (type) {
      case 'approve':
        return 'Approve';
      case 'decline':
        return 'Decline';
      case 'reopen':
        return 'Reopen';
      default:
        return 'Confirm';
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const renderTimeChargeData = () => {
    const data = isBulk ? selectedTimeCharges : [timeCharge];

    if (!data || data.length === 0 || !data[0]) return null;

    return (
      <div className="overflow-x-auto bg-white rounded-lg max-h-[60vh] overflow-y-auto">
        <table className="table-auto w-full text-sm text-left text-gray-900">
          <thead className="bg-gray-100 sticky top-0 z-10 text-sm font-bold h-12">
            <tr>
              <th className="p-2 text-left">Date</th>
              <th className="p-2 text-left">Employee</th>
              <th className="p-2 text-left">Project</th>
              <th className="p-2 text-left">Stage</th>
              <th className="p-2 text-left">Activity</th>
              <th className="p-2 text-left">Duration</th>
              <th className="p-2 text-left">OT</th>
              <th className="p-2 text-left">Remarks</th>
            </tr>
          </thead>
          <tbody>
            {data.map((item) => (
              <tr key={item.id} className={`hover:bg-gray-100 ${item % 2 === 1 ? 'bg-gray-50' : 'bg-white'} transition border-t`}>
                <td className="p-2 text-sm font-medium text-gray-900 whitespace-nowrap">
                  {formatDate(item.time_charge_date)}
                </td>
                <td className="p-2">{item.user.name}</td>
                <td className="p-2">{item.time_charge_type === 1 || item.time_charge_type === 2 ? item.project_label : ""}</td>
                <td className="p-2">{item.time_charge_type === 1 ? item.stage_label : ""}</td>
                <td className="p-2">{item.time_charge_type === 1 ? formatStatus(item.activity) : formatStatus(item.activity)}</td>
                <td className="p-2 font-mono text-sm text-gray-800">
                  {item.duration_hrs}h {item.duration_min}m
                </td>
                <td className="p-2 text-center">{item.is_ot ?
                  <div className="flex justify-center">
                    <span className="inline-flex items-center justify-center bg-gray-500 rounded-full w-5 h-5">
                      <CircleCheck color="white" size={18} />
                    </span>
                  </div>
                  : ""}
                </td>
                <td className="p-2 text-xs paragraph">{item.remarks}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  return (
    <div className="fixed inset-0 bg-gray-800 bg-opacity-50 flex justify-center items-center z-40">
      <div className="bg-white rounded-lg shadow-lg w-full max-w-6xl relative">
        <button
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
          onClick={onClose}
          aria-label="Close"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="p-6">
          <div className="text-center">
            <div className="mb-4 flex justify-center">
              <div className="bg-primary p-3 rounded-aidea-sm">
                {renderIcon()}
              </div>
            </div>

            <h3 className="text-lg font-medium text-gray-900 mb-3">{getTitle()}</h3>
            <p className="text-gray-600 mb-6">
              {getMessage()}
            </p>

            <div className="max-h-[60vh]">
              {renderTimeChargeData()}
            </div>

            <div className="p-4 flex justify-center gap-3">
              <button
                className={`text-sm px-8 py-3 text-white rounded-full ${getActionButtonClass()}`}
                onClick={onConfirm}
              >
                {getActionButtonText()}
              </button>
              <button
                className="text-sm px-4 py-3 bg-gray-300 text-gray-700 rounded-full hover:bg-gray-400"
                onClick={onClose}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ActionModal;
