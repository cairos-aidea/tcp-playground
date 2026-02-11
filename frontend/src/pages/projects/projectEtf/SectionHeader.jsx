import React from 'react';
import { Plus } from 'lucide-react';

export const SectionHeader = ({
  title,
  colSpan,
  color,
  onAdd,
  addButtonText,
  weeks,
  rightContent,
}) => {
  const colorClasses = {
    blue: 'text-blue-900 bg-blue-100 border-blue-300',
    green: 'text-green-900 bg-green-100 border-green-300',
    indigo: 'text-indigo-900 bg-indigo-100 border-indigo-300',
    gray: 'text-gray-900 bg-gray-200 border-gray-300',
    white: 'text-gray-900 bg-white border-gray-300',
  };

  const buttonColorClasses = {
    blue: 'text-blue-600 hover:text-blue-800 hover:bg-blue-50',
    green: 'text-green-600 hover:text-green-800 hover:bg-green-50',
    indigo: 'text-indigo-600 hover:text-indigo-800 hover:bg-indigo-50',
    gray: 'text-gray-600 hover:text-gray-800 hover:bg-gray-50',
    white: 'text-gray-600 hover:text-gray-800 hover:bg-gray-50',
  };

  return (
    <tr className="">
      <td
        colSpan={colSpan}
        className={`sticky left-0 px-2 py-1 text-left font-bold ${colorClasses[color]}`}
        style={{ minWidth: '200px', maxWidth: '200px', width: '200px' }}
      >
        <div className="flex items-center gap-2 justify-between">
          <div className="flex items-center gap-2">
            {onAdd ? (
              <button
                onClick={onAdd}
                className={`flex items-center gap-2 font-semibold text-xs transition-colors rounded-lg px-3 py-1 ${buttonColorClasses[color]}`}
              >
                <Plus size={14} />
                {addButtonText}
              </button>
            ) : (
              <span className="text-xxs uppercase text-gray-500">{title}</span>
            )}
            {rightContent && (
              <div className="flex items-center">{rightContent}</div>
            )}
          </div>
        </div>
      </td>
      {weeks.map((week, i) => (
        <td
          key={i}
          className={`${colorClasses[color]} w-6`}
        />
      ))}
      {/* <td
        className={`${colorClasses[color]} sticky`}
        style={{ minWidth: '50px', right: '200px' }}
      /> */}
      <td
        className={`${colorClasses[color]} sticky`}
        style={{ minWidth: '100px', right: '100px' }}
      />
      <td
        className={`${colorClasses[color]} sticky`}
        style={{ minWidth: '100px', right: '0px' }}
      />
    </tr>
  );
};
