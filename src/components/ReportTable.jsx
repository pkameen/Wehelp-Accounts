import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { FiSearch, FiPackage, FiCheckCircle, FiEdit2, FiTrash2 } from "react-icons/fi";

export default function ReportTable({ sales = [], hideSearch = false, onEdit, onDelete, onMarkPaid }) {
  const [searchQuery, setSearchQuery] = useState("");

  // Flatten sales to show individual products correctly
  const flattenedSales = useMemo(() => {
    const records = [];
    (sales || []).forEach((sale) => {
      if (!sale) return;
      if (sale.products && sale.products.length > 0) {
        sale.products.forEach((p, index) => {
          records.push({
            id: `${sale.id}-${index}`,
            invoiceId: sale.id,
            invoiceNumber: p.invoiceNumber || sale.invoiceNumber,
            customerName: sale.customerName,
            productName: p.productName || "Unknown Item",
            category: p.category || "N/A",
            quantity: p.quantity || 0,
            totalAmount: p.total || p.price * p.quantity || 0,
            date: p.date || sale.date || new Date(sale.createdAt).toLocaleDateString(),
            status: p.status || sale.status || "Completed",
            paymentStatus: sale.paymentStatus || "paid"
          });
        });
      } else {
        // Fallback for older invoices without products array
        records.push({
          id: sale.id,
          invoiceId: sale.id,
          invoiceNumber: sale.invoiceNumber,
          customerName: sale.customerName,
          productName: sale.productName || "Unknown Item",
          category: sale.category || "N/A",
          quantity: sale.quantity || 0,
          totalAmount: sale.totalAmount || sale.subtotal || 0,
          date: sale.date || new Date(sale.createdAt).toLocaleDateString(),
          status: sale.status || "Completed",
          paymentStatus: sale.paymentStatus || "paid"
        });
      }
    });
    return records;
  }, [sales]);

  // Local search filtering
  const filteredSales = useMemo(() => {
    return flattenedSales.filter((sale) => {
      const term = searchQuery.toLowerCase();
      return (
        (sale.productName || "").toLowerCase().includes(term) ||
        (sale.category || "").toLowerCase().includes(term) ||
        (sale.customerName || "").toLowerCase().includes(term) ||
        (sale.date || "").includes(term) ||
        (sale.invoiceNumber || "").toLowerCase().includes(term)
      );
    });
  }, [flattenedSales, searchQuery]);

  return (
    <div className="bg-white premium-shadow border border-gray-100 rounded-[30px] flex flex-col overflow-hidden">
      
      {/* Table Toolbar & Search */}
      <div className="p-6 border-b border-gray-50 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white relative z-20">
        <h3 className="text-xl font-bold text-[#111] tracking-tight">Sales Records</h3>
        
        {!hideSearch && (
          <div className="relative flex items-center group w-full sm:w-72">
            <FiSearch className="absolute left-4 text-gray-400 group-focus-within:text-[#D4AF37] transition-colors pointer-events-none" />
            <input
              type="text"
              placeholder="Search products, category, date..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 pr-4 py-2.5 bg-gray-50 hover:bg-gray-100/50 border border-transparent focus:bg-white focus:border-[#D4AF37]/40 rounded-2xl text-sm font-medium text-[#111] outline-none transition-all w-full placeholder:text-gray-400"
            />
          </div>
        )}
      </div>

      {/* Scrollable Table Container */}
      <div className="overflow-x-auto custom-scrollbar w-full relative">
        <table className="w-full text-left border-collapse min-w-[800px]">
          <thead className="bg-white/90 backdrop-blur-md sticky top-0 z-10">
            <tr>
              <th className="px-8 py-5 text-xs font-bold text-gray-400 uppercase tracking-widest border-b border-gray-50">Product</th>
              <th className="px-6 py-5 text-xs font-bold text-gray-400 uppercase tracking-widest border-b border-gray-50">Category</th>
              <th className="px-6 py-5 text-xs font-bold text-gray-400 uppercase tracking-widest border-b border-gray-50 text-center">Qty</th>
              <th className="px-6 py-5 text-xs font-bold text-gray-400 uppercase tracking-widest border-b border-gray-50 text-right">Amount</th>
              <th className="px-6 py-5 text-xs font-bold text-gray-400 uppercase tracking-widest border-b border-gray-50">Date</th>
              <th className="px-6 py-5 text-xs font-bold text-gray-400 uppercase tracking-widest border-b border-gray-50 text-center">Status</th>
              {(onEdit || onDelete || onMarkPaid) && <th className="px-8 py-5 text-xs font-bold text-gray-400 uppercase tracking-widest border-b border-gray-50 text-right">Action</th>}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50/50">
            {filteredSales.length > 0 ? (
              filteredSales.map((sale, index) => (
                <motion.tr
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.03, duration: 0.3 }}
                  key={sale.id}
                  className="hover:bg-gray-50/80 transition-colors duration-300 group"
                >
                  {/* Product Name */}
                  <td className="px-8 py-4">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-[14px] bg-gray-50 border border-gray-100 flex items-center justify-center text-gray-400 group-hover:bg-[#111] group-hover:text-[#D4AF37] group-hover:border-[#111] transition-all duration-300 shadow-sm">
                        <FiPackage />
                      </div>
                  <div>
                    <span className="font-bold text-[#111] block">{sale.productName}</span>
                    {sale.invoiceNumber && <span className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">{sale.invoiceNumber}</span>}
                  </div>
                    </div>
                  </td>
                  
                  {/* Category Badge */}
                  <td className="px-6 py-4">
                    <span className={`px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider shadow-sm border ${sale.category?.toLowerCase() === 'niqab' ? 'bg-[#111] text-[#D4AF37] border-[#111]' : 'bg-white text-gray-600 border-gray-200'}`}>
                      {sale.category || "N/A"}
                    </span>
                  </td>
                  
                  {/* Quantity */}
                  <td className="px-6 py-4 font-semibold text-gray-600 text-center">
                    {sale.quantity || 0}
                  </td>
                  
                  {/* Amount */}
                  <td className="px-6 py-4 text-right">
                    <span className="font-bold text-[#111] text-lg leading-none">₹{sale.totalAmount || sale.subtotal || 0}</span>
                  </td>
                  
                  {/* Date */}
                  <td className="px-6 py-4 text-sm font-medium text-gray-400 whitespace-nowrap">
                    {sale.date || "N/A"}
                  </td>
                  
                  {/* Status */}
                  <td className="px-6 py-4 text-center">
                    {sale.paymentStatus === 'pending' ? (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider shadow-sm border whitespace-nowrap bg-orange-50 text-orange-600 border-orange-200">
                        ⏳ PENDING
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider shadow-sm border whitespace-nowrap bg-green-50 text-green-600 border-green-200">
                        ✅ COMPLETED
                      </span>
                    )}
                  </td>

                  {/* Action */}
                  {(onEdit || onDelete || onMarkPaid) && (
                    <td className="px-8 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {sale.paymentStatus === 'pending' && onMarkPaid && (
                          <button onClick={() => onMarkPaid(sale.invoiceId)} className="w-8 h-8 rounded-xl bg-green-50 text-green-600 flex items-center justify-center hover:bg-green-500 hover:text-white transition-all shadow-sm border border-green-100" title="Complete Payment">
                            <FiCheckCircle size={15} />
                          </button>
                        )}
                        {onEdit && (
                          <button onClick={() => onEdit(sale.invoiceId)} className="w-8 h-8 rounded-xl bg-gray-50 text-gray-600 flex items-center justify-center hover:bg-[#111] hover:text-[#D4AF37] transition-all shadow-sm border border-gray-100" title="Edit Invoice">
                            <FiEdit2 size={14} />
                          </button>
                        )}
                        {onDelete && (
                          <button onClick={() => onDelete(sale.invoiceId)} className="w-8 h-8 rounded-xl bg-red-50 text-red-500 flex items-center justify-center hover:bg-red-500 hover:text-white transition-all shadow-sm border border-red-100" title="Delete Invoice">
                            <FiTrash2 size={14} />
                          </button>
                        )}
                      </div>
                    </td>
                  )}

                </motion.tr>
              ))
            ) : (
              <tr>
              <td colSpan={(onEdit || onDelete || onMarkPaid) ? "7" : "6"} className="px-6 py-16 text-center text-gray-500 font-medium">
                  <div className="flex flex-col items-center justify-center gap-2"><FiSearch className="text-3xl text-gray-300"/> No matching records found.</div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}