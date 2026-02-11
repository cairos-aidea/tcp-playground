import React, { useState, useEffect } from 'react';
import Navbar from '../navigations/Navbar';
import Sidebar from '../navigations/Sidebar';

const Layout = ({ title, children }) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  useEffect(() => {
    const stored = typeof window !== "undefined" ? localStorage.getItem("isSidebarOpen") : null;
    if (stored !== null) {
      setIsSidebarOpen(stored === 'true');
    }
  }, []);

  const [windowWidth, setWindowWidth] = useState(window.innerWidth);

  useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    if (windowWidth < 640 && isSidebarOpen) {
      setIsSidebarOpen(false);
    }
    if (windowWidth >= 640 && !isSidebarOpen) {
      setIsSidebarOpen(true);
    }
  }, [windowWidth]);

  useEffect(() => {
    localStorage.setItem("isSidebarOpen", isSidebarOpen);
  }, [isSidebarOpen]);

  return (
    <div className="h-screen flex flex-col">
      {/* Navbar */}
      {/* <div className="fixed top-0 left-0 right-0 z-30 h-8 bg-white border-b shadow-sm">
        <Navbar
          title={title}
          toggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
          isSidebarOpen={isSidebarOpen}
          windowWidth={windowWidth}
        />
      </div> */}

      {/* Content + Sidebar */}
      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar for large screens */}
        {windowWidth >= 640 && (
          <div className={`${isSidebarOpen ? 'w-64' : 'w-20'} duration-300 ease-in-out border-r overflow-visible`}>
            <Sidebar
              isOpen={isSidebarOpen}
              toggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
              isMobile={false}
            />
          </div>
        )}

        {/* Main Content */}
        <main
          className={`flex-1 max-h-screen bg-gray-50 ${windowWidth < 640 ? 'mb-16' : ''
            }`}
        >
          <div className="min-h-full">{children}</div>
        </main>
      </div>

      {/* Bottom Navbar for small screens */}
      {windowWidth < 640 && (
        <div className="sm:hidden fixed mt-12 bottom-0 left-0 right-0 z-50 bg-black text-white shadow-inner h-16">
          <Sidebar
            isOpen={true}
            toggleSidebar={() => { }}
            isMobile={true}
          />
        </div>
      )}
    </div>
  );
};

export default Layout;
