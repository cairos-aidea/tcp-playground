import React, { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import {
  Calendar,
  CheckSquare,
  Briefcase,
  LayoutDashboard,
  Users,
  Building2,
  Layers,
  LogOut,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  ListTodo,
  BriefcaseBusiness,
  TrendingUpDown,
} from "lucide-react";

const Sidebar = ({ isOpen, toggleSidebar, isMobile }) => {
  const location = useLocation();
  const authRoleId = JSON.parse(localStorage.getItem("auth_user")).role_id;

  const [popoverVisible, setPopoverVisible] = useState(false);
  const [popoverContent, setPopoverContent] = useState(null);
  const [popoverPosition, setPopoverPosition] = useState({ top: 0, left: 0 });

  const [showTitles, setShowTitles] = useState(false);
  const [isTransitioning, setIsTransitioning] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setIsTransitioning(true);
      const timeout = setTimeout(() => {
        setShowTitles(true);
        setIsTransitioning(false);
      }, 150);
      return () => clearTimeout(timeout);
    } else {
      setShowTitles(false);
      setIsTransitioning(true);
      const timeout = setTimeout(() => setIsTransitioning(false));
      return () => clearTimeout(timeout);
    }
  }, [isOpen]);

  const menuItems = [
    {
      header: "Main",
      items: [
        { to: "/calendar", name: "Time Charging", icon: <Calendar size={20} /> },
        ...([2, 3].includes(authRoleId)
          ? [
            { to: "/projects/budget", name: "Project Budget", icon: <BriefcaseBusiness size={20} /> },
            { to: "/projects/etf", name: "ETF", icon: <TrendingUpDown size={20} /> },
          ]
          : []),
      ],
    },
    ...([2, 3].includes(authRoleId)
      ? [
        {
          header: "Manage",
          items: [
            { to: "/approval-list", name: "Approval List", icon: <CheckSquare size={20} /> },
            { to: "/projects/external", name: "Projects External", icon: <Briefcase size={20} /> },
            { to: "/projects/internal", name: "Projects Internal", icon: <Layers size={20} /> },
            { to: "/tasks/departmental", name: "Departmental Tasks", icon: <ListTodo size={20} /> },
          ],
        },
      ]
      : []),
    ...(authRoleId === 3
      ? [
        {
          header: "Admin",
          items: [
            { to: "/users", name: "Users", icon: <Users size={20} /> },
            { to: "/departments", name: "Departments", icon: <Building2 size={20} /> },
            { to: "/holidays", name: "Holidays", icon: <LayoutDashboard size={20} /> },
          ],
        },
      ]
      : []),
  ];

  const storedUser = JSON.parse(localStorage.getItem("auth_user"));

  const initials = () => {
    if (!storedUser) return "U";
    return `${storedUser.first_name?.[0] || ""}${storedUser.last_name?.[0] || ""}`.toUpperCase();
  };

  const isTeams = window?.microsoftTeams !== undefined || window.self !== window.top;

  const handleLogout = () => {
    localStorage.clear();
    sessionStorage.clear();
    if (window.indexedDB && indexedDB.databases) {
      indexedDB.databases().then((dbs) => {
        dbs.forEach((db) => indexedDB.deleteDatabase(db.name));
      });
    }
    window.location.href = "/";
  };

  const showPopover = (e, text) => {
    if (isOpen) return; // Only show when sidebar is collapsed
    let iconRect = null;
    if (e.currentTarget) {
      const iconSpan = e.currentTarget.querySelector("span,svg");
      if (iconSpan) iconRect = iconSpan.getBoundingClientRect();
    }
    const rect = iconRect || e.target.getBoundingClientRect();
    setPopoverPosition({
      top: rect.top + rect.height / 2 - 18,
      left: rect.right + 12,
    });
    setPopoverContent(text);
    setPopoverVisible(true);
  };

  const hidePopover = () => {
    setPopoverVisible(false);
  };

  return (
    <>
      {isMobile ? (
        <nav className="flex overflow-x-auto border-t border-gray-800 bg-neutral-950 text-white whitespace-nowrap">
          <div className="flex w-max divide-x divide-neutral-800">
            {menuItems.flatMap((group) =>
              group.items.map((item, idx) => (
                <Link
                  key={idx}
                  to={item.to}
                  className="px-4 py-3 flex flex-col items-center justify-center hover:bg-neutral-800 transition"
                >
                  {item.icon}
                  <span className="text-[11px] mt-1">{item.name}</span>
                </Link>
              ))
            )}
          </div>
        </nav>
      ) : (
        <aside
          className={`fixed top-0 left-0 h-full bg-neutral-900 text-white shadow-lg z-40 flex flex-col transition-all duration-300 ease-in-out ${
            isOpen ? "w-64" : "w-20"
          }`}
        >
          {/* LOGO + TOGGLER */}
          <div className="h-16 border-neutral-800 relative flex items-center px-4 transition-all duration-300">
            <div
              className={`transition-all duration-300 ease-in-out overflow-hidden ${
                isOpen ? "opacity-100 w-auto mr-auto" : "opacity-0 w-0"
              }`}
            >
              <img src="/assets/img/logo-nega.png" className="h-6 select-none" />
            </div>

            <div
              className={`transition-all duration-300 ease-in-out ${
                isOpen ? "ml-auto" : "w-full flex justify-center"
              }`}
            >
              <button
                onClick={toggleSidebar}
                className="text-gray-300 hover:text-white transition-colors duration-200 hover:scale-110 transform"
              >
                {isOpen ? <ChevronLeft /> : <ChevronRight />}
              </button>
            </div>
          </div>

          {/* MENU GROUPS */}
          <div className="flex-1 overflow-y-auto overflow-x-hidden mt-2 sidebar-scroll">
            {menuItems.map((group, gIndex) => (
              <div key={gIndex} className="mb-4">
                <div
                  className={`px-5 text-xs font-semibold text-gray-500 uppercase tracking-wide transition-all duration-300 ease-in-out overflow-hidden ${
                    isOpen ? "opacity-100 h-8 py-2" : "opacity-0 h-0 py-0"
                  }`}
                >
                  {group.header}
                </div>

                <ul>
                  {group.items.map((item, index) => {
                    const active = location.pathname === item.to;
                    return (
                      <li key={index}>
                        <Link
                          to={item.to}
                          onMouseEnter={(e) => showPopover(e, item.name)}
                          onMouseLeave={hidePopover}
                          className={`flex items-center rounded-lg mx-2 my-1 py-3 transition-all duration-300 ease-in-out ${
                            isOpen ? "gap-3 px-5" : "gap-0 px-5 justify-center"
                          } ${
                            active
                              ? "bg-neutral-800 text-white"
                              : "text-gray-300 hover:bg-neutral-800 hover:text-white"
                          }`}
                        >
                          <span className="flex-shrink-0 transition-all duration-300 ease-in-out">
                            {item.icon}
                          </span>
                          <span
                            className={`text-sm font-medium whitespace-nowrap transition-all duration-300 ease-in-out ${
                              isOpen
                                ? "opacity-100 translate-x-0 w-auto"
                                : "opacity-0 -translate-x-2 w-0 overflow-hidden"
                            }`}
                          >
                            {item.name}
                          </span>
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              </div>
            ))}
          </div>

          {/* PROFILE */}
          <div className="px-2 mb-2">
            <div
              className={`py-4 mt-auto border-t rounded-lg border-neutral-800 flex items-center transition-all duration-300 ease-in-out ${
                isOpen ? "px-5 gap-3" : "px-5 gap-0 justify-center"
              }`}
            >
              <div className="rounded-full bg-neutral-700 flex items-center justify-center text-xs font-bold overflow-hidden size-10 flex-shrink-0 transition-all duration-300">
                {storedUser?.profile ? (
                  <img
                    src={`data:image/png;base64,${storedUser.profile}`}
                    className="w-full h-full object-cover rounded-full"
                  />
                ) : (
                  initials()
                )}
              </div>

              <span
                className={`text-sm font-medium whitespace-nowrap transition-all duration-300 ease-in-out ${
                  isOpen
                    ? "opacity-100 translate-x-0 w-auto"
                    : "opacity-0 -translate-x-2 w-0 overflow-hidden"
                }`}
              >
                {storedUser?.first_name || "User"}
                <br />
                <span className="text-xs text-gray-500">{storedUser?.email}</span>
              </span>
            </div>
          </div>

          {/* LOGOUT / REFRESH */}
          <div className="mt-auto mb-3 px-2">
            <div
              onClick={() => (isTeams ? window.location.reload() : handleLogout())}
              onMouseEnter={(e) => showPopover(e, isTeams ? "Refresh App" : "Logout")}
              onMouseLeave={hidePopover}
              className={`py-4 mt-auto rounded-lg border-neutral-800 hover:bg-neutral-800 cursor-pointer flex items-center transition-all duration-300 ease-in-out ${
                isOpen ? "px-5 gap-3" : "px-5 gap-0 justify-center"
              }`}
            >
              <span className="flex-shrink-0">
                {isTeams ? <RefreshCw size={20} /> : <LogOut size={20} />}
              </span>

              <span
                className={`text-sm font-medium whitespace-nowrap transition-all duration-300 ease-in-out ${
                  isOpen
                    ? "opacity-100 translate-x-0 w-auto"
                    : "opacity-0 -translate-x-2 w-0 overflow-hidden"
                }`}
              >
                {isTeams ? "Refresh App" : "Logout"}
              </span>
            </div>
          </div>

          {/* VERSION */}
          <div className="text-gray-500 text-xxs text-center py-3 border-t border-neutral-800">
            <span
              className={`inline-block transition-all duration-300 ease-in-out ${
                isOpen ? "opacity-100 w-auto" : "opacity-0 w-0 overflow-hidden"
              }`}
            >
              VERSION 1.1.1
            </span>
            <span
              className={`inline-block transition-all duration-300 ease-in-out ${
                !isOpen ? "opacity-100 w-auto" : "opacity-0 w-0 overflow-hidden"
              }`}
            >
              {!isOpen && "v1.1.1"}
            </span>
          </div>
        </aside>
      )}

      {/* POPOVER */}
      {popoverVisible && (
        <div
          className="fixed z-60 bg-neutral-800 text-white text-sm px-3 py-2 rounded shadow-xl border border-neutral-700 ml-7 animate-in fade-in slide-in-from-left-2 duration-200"
          style={{
            top: popoverPosition.top,
            left: popoverPosition.left,
            transition: "opacity 0.2s ease-in-out, transform 0.2s ease-in-out",
          }}
        >
          {popoverContent}
        </div>
      )}
    </>
  );
};

export default Sidebar;
