import { motion } from "framer-motion";
import { FiTrendingUp, FiTrendingDown } from "react-icons/fi";

export default function SalesCard({ 
  title, 
  amount, 
  icon, 
  percentage, 
  color = "text-[#111]" 
}) {
  // Determine trend direction
  const isPositive = percentage && percentage.toString().startsWith("+");
  const isNegative = percentage && percentage.toString().startsWith("-");

  return (
    <motion.div
      whileHover={{ y: -6 }}
      transition={{ type: "spring", stiffness: 300, damping: 20 }}
      className="bg-white premium-shadow border border-gray-100 rounded-[30px] p-7 relative overflow-hidden group hover:border-[#D4AF37]/40 transition-colors duration-300 cursor-default"
    >
      {/* Subtle expanding background gradient blob on hover */}
      <div className="absolute -bottom-10 -right-10 w-32 h-32 bg-gradient-to-br from-gray-50 to-transparent rounded-full group-hover:scale-[2.5] transition-transform duration-700 opacity-60 z-0"></div>
      
      <div className="relative z-10 flex items-start justify-between">
        <div>
          <p className="text-gray-400 text-xs font-bold uppercase tracking-widest mb-2 font-['Inter']">
            {title}
          </p>
          <h2 className={`text-3xl font-bold ${color} tracking-tight font-['Poppins']`}>
            {amount}
          </h2>
        </div>
        
        <div className="w-12 h-12 rounded-[18px] bg-gray-50 text-[#111] flex items-center justify-center text-2xl group-hover:bg-[#111] group-hover:text-[#D4AF37] transition-all duration-300 shadow-sm border border-gray-100 group-hover:border-[#111]">
          {icon}
        </div>
      </div>

      {percentage && (
        <div className="relative z-10 mt-6 flex items-center gap-2">
          <span className={`flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-lg ${isPositive ? "bg-green-50 text-green-600" : isNegative ? "bg-red-50 text-red-600" : "bg-gray-50 text-gray-600"}`}>
            {isPositive && <FiTrendingUp className="text-[10px]" />}
            {isNegative && <FiTrendingDown className="text-[10px]" />}
            {percentage}
          </span>
          <span className="text-xs font-medium text-gray-400 font-['Inter']">vs last month</span>
        </div>
      )}
    </motion.div>
  );
}