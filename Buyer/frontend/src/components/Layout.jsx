/**
 * Layout Component
 * Main layout with sidebar, navbar, and content area
 */
import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import Navbar from './Navbar';

const Layout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const toggleSidebar = () => setSidebarOpen((prev) => !prev);
  const closeSidebar = () => setSidebarOpen(false);

  return (
    <div className="layout">
      <Sidebar isOpen={sidebarOpen} onClose={closeSidebar} />
      <div className="layout__main">
        <Navbar onToggleSidebar={toggleSidebar} />
        <main className="layout__content">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default Layout;
