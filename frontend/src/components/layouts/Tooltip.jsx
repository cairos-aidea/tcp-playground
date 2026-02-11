import { createPortal } from 'react-dom';
import { useEffect, useState } from 'react';

const Tooltip = ({ content, visible}) => (
  <div
    role="tooltip"
    className={`z-50 absolute px-3 py-2 text-xs font-medium text-white bg-gray-900 rounded-md shadow-lg transition-opacity duration-300 
      ${visible ? "visible opacity-100" : "invisible opacity-0"}`}
    style={{
      top: '-0.575rem',
      left: '50%',
      transform: 'translate(-50%, -100%)',
      whiteSpace: 'nowrap',
    }}
  >
    {content}
  </div>
);


export default Tooltip;
