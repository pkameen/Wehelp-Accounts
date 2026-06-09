import { motion } from "framer-motion";
import { 
  FiEdit2, 
  FiTrash2, 
  FiDollarSign, 
  FiLayers, 
  FiImage,
  FiStar,
  FiCheckCircle
} from "react-icons/fi";

export default function ProductCard({
  product,
  onEdit,
  onDelete
}) {
  // Fallback defaults in case of missing data
  const {
    productName = "Premium Item",
    category = "Unknown",
    sellingPrice = 0,
    stock = 0,
    image = null,
    status = "Available",
    featured = false
  } = product || {};

  const isNiqab = category.toLowerCase() === "niqab";
  const isLowStock = stock < 10;
  const isOutOfStock = stock <= 0 || status === "Out of Stock";

  return (
    <motion.div
      whileHover={{ y: -6 }}
      transition={{ type: "spring", stiffness: 300, damping: 20 }}
      className="bg-white premium-shadow border border-gray-100 rounded-[30px] p-5 group flex flex-col relative overflow-hidden"
    >
      {/* Hover Action Buttons */}
      <div className="absolute top-8 right-8 z-10 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
        <button onClick={() => onEdit && onEdit(product)} className="w-9 h-9 rounded-full bg-white/90 backdrop-blur-sm text-gray-700 flex items-center justify-center hover:bg-[#111] hover:text-[#D4AF37] shadow-sm transition-colors" title="Edit">
          <FiEdit2 size={16} />
        </button>
        <button onClick={() => onDelete && onDelete(product?.id)} className="w-9 h-9 rounded-full bg-white/90 backdrop-blur-sm text-red-500 flex items-center justify-center hover:bg-red-500 hover:text-white shadow-sm transition-colors" title="Delete">
          <FiTrash2 size={16} />
        </button>
      </div>

      {/* Image Container with Badge */}
      <div className="w-full h-48 bg-gray-50 rounded-[20px] mb-6 flex items-center justify-center relative overflow-hidden group-hover:bg-gray-100 transition-colors">
        {image ? (
          <img src={image} alt={productName} className="w-full h-full object-cover" />
        ) : (
          <FiImage className="text-4xl text-gray-300" />
        )}
        
        <div className="absolute top-3 left-3 flex flex-col gap-2">
          {featured && (
            <span className="bg-[#D4AF37] text-[#111] px-2.5 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider shadow-md flex items-center gap-1">
              <FiStar className="fill-current" /> Featured
            </span>
          )}
        </div>

        <div className="absolute bottom-3 left-3">
          <span className={`px-3 py-1.5 rounded-xl text-[11px] font-bold uppercase tracking-wider backdrop-blur-md shadow-sm ${isNiqab ? "bg-[#111]/85 text-[#D4AF37]" : "bg-white/90 text-gray-800"}`}>
            {category}
          </span>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 flex flex-col">
        <h2 className="text-xl font-bold text-[#111] font-['Poppins'] truncate mb-5 tracking-tight" title={productName}>
          {productName}
        </h2>

        <div className="flex justify-between items-end mb-5 border-b border-gray-50 pb-5">
          <div>
            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mb-1 flex items-center gap-1 font-['Inter']"><FiDollarSign/> Selling Price</p>
            <p className="font-bold text-[#111] text-2xl leading-none">₹{sellingPrice}</p>
          </div>
          <span className={`text-[10px] font-bold uppercase tracking-widest flex items-center gap-1 ${isOutOfStock ? 'text-red-500' : 'text-green-500'}`}>
            <FiCheckCircle /> {isOutOfStock ? 'Out of Stock' : status}
          </span>
        </div>

        {/* Footer / Stock */}
        <div className="mt-auto flex items-center justify-between">
          <span className="text-sm text-gray-400 font-medium flex items-center gap-2">
            <FiLayers className="text-gray-400"/> Inventory Status
          </span>
          <span className={`text-xs font-bold px-2.5 py-1.5 rounded-lg ${isOutOfStock ? 'bg-gray-100 text-gray-600' : isLowStock ? 'bg-red-50 text-red-600 border border-red-100 shadow-[0_0_10px_rgba(239,68,68,0.2)] animate-pulse' : 'bg-green-50 text-green-600'}`}>
            {isOutOfStock ? '0 Units' : `${stock} Units${isLowStock ? ' (Low)' : ''}`}
          </span>
        </div>
      </div>
    </motion.div>
  );
}