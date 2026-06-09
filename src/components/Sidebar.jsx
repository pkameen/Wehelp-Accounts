import { NavLink } from "react-router-dom";
import { motion } from "framer-motion";
import { 
  FiPieChart, FiShoppingBag, FiPlus, 
  FiFileText, FiDollarSign, FiSettings, FiX
} from "react-icons/fi";
import logoIcon from '../assets/wehelp.logo.png';

const navItems = [
  { name: "Dashboard", path: "/dashboard", icon: <FiPieChart /> },
  { name: "Products", path: "/products", icon: <FiShoppingBag /> },
  { name: "Add Product", path: "/add-product", icon: <FiPlus /> },
  { name: "Reports", path: "/reports", icon: <FiFileText /> },
  { name: "Expenses", path: "/expenses", icon: <FiDollarSign /> },
  { name: "Invoice", path: "/invoice", icon: <FiFileText /> },
  { name: "Settings", path: "/settings", icon: <FiSettings /> },
];

export default function Sidebar({ isOpen, setIsOpen }) {
  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}

      <aside 
        className={`fixed lg:static inset-y-0 left-0 w-[280px] shrink-0 bg-[#111111] text-gray-400 flex flex-col shadow-2xl z-50 transform ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        } lg:translate-x-0 transition-transform duration-500 ease-[cubic-bezier(0.19,1,0.22,1)]`}
      >
        {/* Branding */}
        <div className="flex items-center justify-between px-7 py-9 relative mt-2 mb-2">
          <div className="flex items-center gap-4 group cursor-default">
            <div className="w-12 h-12 rounded-[15px] mt-3 bg-gradient-to-br from-white/10 to-white/5 border border-white/10 flex items-center justify-center shrink-0 shadow-lg group-hover:border-[#D4AF37]/50 group-hover:shadow-[0_0_15px_rgba(212,175,55,0.2)] transition-all duration-500">
              <img src={logoIcon} alt="Logo" className="w-10 h-10 object-contain filter invert opacity-90 group-hover:scale-110 transition-transform duration-500" />
            </div>
            <div className="flex flex-col justify-center">
              <h2 className="text-white font-bold tracking-[0.10em] text-[20px] mt-3.5   whitespace-nowrap leading-none font-['Poppins']">WEHELP ABAYA</h2>
              <p className="text-[#D4AF37] text-[9px] tracking-[0.63em] uppercase mt-1 font-bold">Accounts System</p>
            </div>
          </div>
          <button onClick={() => setIsOpen(false)} className="lg:hidden text-gray-400 hover:text-white text-2xl absolute right-6">
            <FiX />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-5 space-y-2 overflow-y-auto pb-8 custom-scrollbar">
          {navItems.map((item) => (
            <NavLink
              key={item.name}
              to={item.path}
              onClick={() => setIsOpen(false)}
              className={({ isActive }) =>
                `flex items-center gap-4 px-4 py-4 rounded-[20px] transition-all duration-300 font-medium relative overflow-hidden group ${
                  isActive 
                    ? "bg-white/10 text-white shadow-lg shadow-black/20 border border-white/5" 
                    : "hover:bg-white/5 hover:text-white"
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <span className={`text-xl z-10 transition-colors ${isActive ? "text-[#D4AF37]" : "group-hover:text-[#D4AF37]"}`}>
                    {item.icon}
                  </span>
                  <span className="z-10">{item.name}</span>
                  {isActive && (
                    <motion.div layoutId="sidebar-active" className="absolute left-0 top-0 bottom-0 w-1.5 bg-[#D4AF37] rounded-r-full shadow-[0_0_15px_rgba(212,175,55,0.8)]" />
                  )}
                </>
              )}
            </NavLink>
          ))}
        </nav>
      </aside>
    </>
  );
}