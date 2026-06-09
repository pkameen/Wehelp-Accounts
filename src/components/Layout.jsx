import { useState } from "react";
import { useLocation, Outlet } from "react-router-dom";
import Sidebar from "./Sidebar";
import { FiMenu, FiSearch, FiBell, FiChevronDown } from "react-icons/fi";

export default function Layout({ children }) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const location = useLocation();
  
  // Dynamically format the page title from the route
  const pageTitle = location.pathname.substring(1).replace("-", " ") || "Dashboard";

  return (
    <div className="flex h-screen bg-[#FCFCFC] overflow-hidden font-['Inter']">
      {/* Sidebar with mobile control */}
      <Sidebar isOpen={isSidebarOpen} setIsOpen={setIsSidebarOpen} />
      
      <main className="flex-1 flex flex-col h-screen min-w-0 overflow-hidden relative">
        {/* Premium Top Navbar */}
        <header className="h-24 bg-white/80 backdrop-blur-md border-b border-gray-100 flex items-center justify-between px-6 lg:px-10 z-10 sticky top-0 shrink-0">
          <div className="flex items-center gap-5">
            <button onClick={() => setIsSidebarOpen(true)} className="lg:hidden text-2xl text-[#111] hover:text-[#D4AF37] transition-colors">
              <FiMenu />
            </button>
            <h1 className="text-2xl lg:text-3xl font-bold text-[#111] capitalize font-['Poppins'] tracking-tight">
              {pageTitle}
            </h1>
          </div>

          <div className="flex items-center gap-5 lg:gap-8">
            <div className="hidden md:flex items-center bg-gray-50 rounded-full px-5 py-3 border border-gray-100 focus-within:border-[#D4AF37]/50 focus-within:ring-4 focus-within:ring-[#D4AF37]/10 transition-all w-72">
              <FiSearch className="text-gray-400 text-lg" />
              <input type="text" placeholder="Search anything..." className="bg-transparent border-none outline-none ml-3 w-full text-sm font-medium placeholder-gray-400 text-[#111]" />
            </div>
            <div className="hidden lg:block text-sm font-semibold text-gray-400 uppercase tracking-widest">
              {new Date().toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
            </div>
            <button className="relative p-2 text-gray-400 hover:text-[#111] transition-colors">
              <FiBell className="text-xl" />
              <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 bg-[#D4AF37] border-2 border-white rounded-full"></span>
            </button>
            {/* Profile Avatar Section */}
            <div className="flex items-center gap-3 cursor-pointer group">
              <div className="w-11 h-11 rounded-full bg-[#111] text-[#D4AF37] flex items-center justify-center font-bold text-lg shadow-lg group-hover:scale-105 transition-transform">
                W
              </div>
              <div className="hidden lg:block">
                <p className="text-sm font-bold text-[#111] leading-none">Admin</p>
                <p className="text-xs text-gray-400 mt-1 font-medium">WEHELP</p>
              </div>
              <FiChevronDown className="hidden lg:block text-gray-400 group-hover:text-[#111] transition-colors" />
            </div>
          </div>
        </header>

        {/* Main Content Area */}
        <div className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-10 scroll-smooth custom-scrollbar">
          {children || <Outlet />}
        </div>
      </main>
    </div>
  );
}