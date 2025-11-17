import React from 'react';
import { Outlet } from 'react-router-dom';
import Header from './Header';
import Sidebar from './Sidebar';
import HiddenAdminUI from '../Admin/HiddenAdminUI';

const Layout: React.FC = () => {
  return (
    <div className="min-h-screen bg-gradient-to-b from-pink-50 via-rose-50 to-white">
      <HiddenAdminUI />
      <Header />
      <div className="flex">
        <Sidebar />
        <main className="flex-1 p-4">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default Layout;
