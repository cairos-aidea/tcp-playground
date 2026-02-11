import React, { useRef, useEffect } from 'react';
import { api } from '../../api/api';

const Navbar = ({ title, toggleSidebar, isSidebarOpen, windowWidth }) => {
  const dropdownRef = useRef(null);
  const buttonRef = useRef(null);
  const dropdownVisibleRef = useRef(false); 

  const handleLogout = () => {
    const token = localStorage.getItem('auth_accessToken');
    const headerReq = { token };

    // api("logout", headerReq, null)
    //   .then(result => {
    //     console.log(result);
    //     localStorage.removeItem('auth_user');
    //     localStorage.removeItem('authenticated');
    //     window.location.href = '/';
    //   })
    //   .catch(error => {
    //     console.error(error);
    //   });

    localStorage.clear();
    sessionStorage.clear();
    // Clear all IndexedDB databases
    if (window.indexedDB && indexedDB.databases) {
      indexedDB.databases().then(dbs => {
        dbs.forEach(db => {
          indexedDB.deleteDatabase(db.name);
        });
      });
    }
	  window.location.href = '/';
  };

  const storedUser = JSON.parse(localStorage.getItem('auth_user'));

  const toggleDropdown = () => {
    if (dropdownRef.current) {
      dropdownVisibleRef.current = !dropdownVisibleRef.current;
      dropdownRef.current.style.display = dropdownVisibleRef.current ? 'block' : 'none';
    }
  };

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target) &&
        !buttonRef.current.contains(e.target)
      ) {
        dropdownVisibleRef.current = false;
        dropdownRef.current.style.display = 'none';
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Detect if running in Microsoft Teams environment
  const isTeams = window?.microsoftTeams !== undefined || (window.self !== window.top);

  return (
    <nav className="fixed top-0 h-8 w-full bg-white ">
      <div className="h-full px-6 flex items-center justify-between">
        {/* Left - Title */}
        <h1
          className="text-md font-semibold text-gray-950 transition-all duration-300"
          style={{
            marginLeft:
              windowWidth >= 640
                ? isSidebarOpen
                  ? '16rem'
                  : '4rem'
                : '0rem'
          }}
        >
          {title}
        </h1>

        {/* Right - Profile Image + Dropdown */}
        {/* <div className="relative flex items-center space-x-2">
          {windowWidth >= 640 && (
            <span className="text-sm font-medium text-gray-700">
              {storedUser?.first_name || 'Aidea Sync'}
            </span>
          )}
          <button
            onClick={toggleDropdown}
            ref={buttonRef}
            className="flex items-center space-x-2"
          >
            <img
              src={
                storedUser?.profile
                  ? `data:image/png;base64,${storedUser.profile}`
                  : '/assets/img/aidea-logo.png'
              }
              alt="User"
              className="w-8 h-8 rounded-full object-cover"
            />
          </button>

          <div
            ref={dropdownRef}
            style={{ display: 'none' }}
            className="absolute top-full mt-2 w-48 bg-white rounded-lg shadow-lg z-100"
          >
            <ul className="py-2 text-sm text-gray-700">
              <li>
                <button
                  onClick={handleLogout}
                  className="block w-full px-4 py-2 text-left hover:bg-gray-100"
                >
                  {isTeams ? 'Refresh App' : 'Logout'}
                </button>
              </li>
            </ul>
          </div>
        </div> */}
      </div>
    </nav>
  );
};

export default Navbar;
