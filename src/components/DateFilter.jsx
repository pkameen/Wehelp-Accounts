import { FiCalendar, FiArrowRight } from "react-icons/fi";

export default function DateFilter({
  filterType,
  setFilterType,
  startDate,
  setStartDate,
  endDate,
  setEndDate 
}) {
  const options = [
    { id: "today", label: "Today" },
    { id: "week", label: "This Week" },
    { id: "month", label: "This Month" },
    { id: "custom", label: "Custom Range" },
  ];

  return (
    <div className="flex flex-col xl:flex-row items-start xl:items-center gap-4 w-full">
      
      {/* Premium Segmented Buttons */}
      <div className="bg-white p-1.5 rounded-[20px] border border-gray-100 premium-shadow flex flex-wrap sm:flex-nowrap gap-1 w-full xl:w-auto">
        {options.map((option) => (
          <button
            key={option.id}
            onClick={() => setFilterType && setFilterType(option.id)}
            className={`px-6 py-2.5 rounded-2xl text-sm font-semibold transition-all duration-300 flex-1 sm:flex-none whitespace-nowrap ${
              filterType === option.id
                ? "bg-[#111] text-[#D4AF37] shadow-md shadow-black/10"
                : "text-gray-500 hover:bg-gray-50 hover:text-[#111]"
            }`}
          >
            {option.label}
          </button>
        ))}
      </div>

      {/* Luxury Custom Date Picker Inputs */}
      {filterType === "custom" && (
        <div className="flex flex-col sm:flex-row items-center gap-3 bg-white p-1.5 rounded-[20px] border border-gray-100 premium-shadow w-full xl:w-auto transition-all duration-300">
          <div className="relative flex items-center group w-full sm:w-auto">
            <FiCalendar className="absolute left-4 text-gray-400 group-focus-within:text-[#D4AF37] transition-colors pointer-events-none" />
            <input
              type="date"
              value={startDate || ""}
              onChange={(e) => setStartDate && setStartDate(e.target.value)}
              className="pl-10 pr-4 py-2.5 bg-gray-50/50 hover:bg-gray-50 border border-transparent focus:bg-white focus:border-[#D4AF37]/40 rounded-2xl text-sm font-semibold text-[#111] outline-none transition-all cursor-pointer w-full min-w-[150px]"
            />
          </div>
          
          <FiArrowRight className="hidden sm:block text-gray-300 shrink-0" />
          
          <div className="relative flex items-center group w-full sm:w-auto">
            <FiCalendar className="absolute left-4 text-gray-400 group-focus-within:text-[#D4AF37] transition-colors pointer-events-none" />
            <input
              type="date"
              value={endDate || ""}
              onChange={(e) => setEndDate && setEndDate(e.target.value)}
              className="pl-10 pr-4 py-2.5 bg-gray-50/50 hover:bg-gray-50 border border-transparent focus:bg-white focus:border-[#D4AF37]/40 rounded-2xl text-sm font-semibold text-[#111] outline-none transition-all cursor-pointer w-full min-w-[150px]"
            />
          </div>
        </div>
      )}
    </div>
  );
}