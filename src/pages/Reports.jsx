import { useEffect, useState, useMemo } from "react";
import { db } from "../firebase";
import { ref, onValue, update } from "firebase/database";
import {
  isSameDay,
  isSameWeek,
  isSameMonth,
  isWithinInterval,
  subDays,
  subWeeks,
  subMonths,
  startOfDay,
  endOfDay
} from "date-fns";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import toast, { Toaster } from "react-hot-toast";
import { 
  FiDollarSign, 
  FiPackage, 
  FiTrendingDown,
  FiBriefcase,
  FiImage,
  FiAlertTriangle,
  FiChevronDown,
  FiClock,
  FiFileText
} from "react-icons/fi";
import { AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import ReportTable from "../components/ReportTable";
import DateFilter from "../components/DateFilter";
import SalesCard from "../components/SalesCard";

const Reports = () => {
  const [sales, setSales] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [products, setProducts] = useState([]);
  const [filterType, setFilterType] = useState("today");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [deletingInvoiceId, setDeletingInvoiceId] = useState(null);
  const [selectedProductId, setSelectedProductId] = useState("");
  const [paymentFilter, setPaymentFilter] = useState("all");
  
  const navigate = useNavigate();

  // Fetch Data from Firebase
  useEffect(() => {
    const salesRef = ref(db, "invoices");
    const expRef = ref(db, "expenses");
    const prodRef = ref(db, "products");

    onValue(salesRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        setSales(Object.keys(data).map((key) => ({ id: key, ...data[key] })));
      } else {
        setSales([]);
      }
    });

    onValue(expRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        setExpenses(Object.keys(data).map((key) => ({ id: key, ...data[key] })));
      } else {
        setExpenses([]);
      }
    });

    onValue(prodRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        setProducts(Object.keys(data).map((key) => ({ id: key, ...data[key] })));
      } else {
        setProducts([]);
      }
    });
  }, []);

  // Centralized Filter and Calculation Logic
  const {
    filteredSales,
    turnover,
    turnoverGrowth,
    expenseTotal,
    expenseGrowth,
    balance,
    pendingAmount,
    pendingCount,
    totalItems,
    chartData,
    topProducts
  } = useMemo(() => {
    const now = new Date();
    let currentSales = [];
    let prevSales = [];
    let currentExp = [];
    let prevExp = [];

    // 1. Separate Current and Previous Period Data
    const filterData = (dataList, isExpense = false) => {
      dataList.forEach((item) => {
        let dateVal = item.createdAt || Date.now();
        if (!isExpense && item.invoiceDate) {
          const [year, month, day] = item.invoiceDate.split('-');
          dateVal = new Date(year, month - 1, day).getTime();
        }
        const d = new Date(dateVal);
        let isCurrent = false;
        let isPrev = false;

        if (filterType === "today") {
          isCurrent = isSameDay(d, now);
          isPrev = isSameDay(d, subDays(now, 1));
        } else if (filterType === "week") {
          isCurrent = isSameWeek(d, now);
          isPrev = isSameWeek(d, subWeeks(now, 1));
        } else if (filterType === "month") {
          isCurrent = isSameMonth(d, now);
          isPrev = isSameMonth(d, subMonths(now, 1));
        } else if (filterType === "custom" && startDate && endDate) {
          const start = startOfDay(new Date(startDate));
          const end = endOfDay(new Date(endDate));
          isCurrent = isWithinInterval(d, { start, end });
        } else if (filterType === "custom") {
          isCurrent = true; // Fallback if dates not picked
        }

        if (!isExpense && paymentFilter !== "all") {
          const status = item.paymentStatus || "paid";
          if (status !== paymentFilter) {
            isCurrent = false;
            isPrev = false;
          }
        }

        if (isCurrent) {
          if (isExpense) currentExp.push(item);
          else currentSales.push(item);
        }
        if (isPrev) {
          if (isExpense) prevExp.push(item);
          else prevSales.push(item);
        }
      });
    };

    filterData(sales, false);
    filterData(expenses, true);

    // 2. Compute Core Metrics
    const getRevenue = (arr) => arr.reduce((sum, s) => sum + (Number(s.totalAmount) || 0), 0);
    const getExp = (arr) => arr.reduce((sum, e) => sum + (Number(e.amount) || 0), 0);

    const currentTurnover = getRevenue(currentSales);
    const prevTurnover = getRevenue(prevSales);
    const currentExpenseTotal = getExp(currentExp);
    const prevExpenseTotal = getExp(prevExp);

    let tGrowth = 0;
    if (prevTurnover > 0) tGrowth = ((currentTurnover - prevTurnover) / prevTurnover) * 100;
    else if (currentTurnover > 0) tGrowth = 100;

    let eGrowth = 0;
    if (prevExpenseTotal > 0) eGrowth = ((currentExpenseTotal - prevExpenseTotal) / prevExpenseTotal) * 100;
    else if (currentExpenseTotal > 0) eGrowth = 100;

    let items = 0;
    let pTotal = 0;
    let pCount = 0;
    const productMap = {};
    const dateGroupMap = {};

    // 3. Process Product Quantities and Chart Data
    currentSales.forEach((sale) => {
      // Chart grouping
      let saleDateVal = sale.createdAt || Date.now();
      if (sale.invoiceDate) {
        const [year, month, day] = sale.invoiceDate.split('-');
        saleDateVal = new Date(year, month - 1, day).getTime();
      }
      
      const dateStr = new Date(saleDateVal).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      if (!dateGroupMap[dateStr]) dateGroupMap[dateStr] = { date: dateStr, rawDate: saleDateVal, Revenue: 0 };
      dateGroupMap[dateStr].Revenue += Number(sale.totalAmount) || 0;

      const status = sale.paymentStatus || "paid";
      if (status === "pending") {
        pTotal += Number(sale.totalAmount) || 0;
        pCount += 1;
      }

      // Product iterations
      (sale.products || []).forEach(p => {
        const qty = Number(p.quantity) || 0;
        
        items += qty;

        // Top Products Aggregation
        if (p.productId) {
          if (!productMap[p.productId]) {
            productMap[p.productId] = { id: p.productId, name: p.productName, category: p.category, qty: 0, revenue: 0 };
          }
          productMap[p.productId].qty += qty;
          productMap[p.productId].revenue += qty * (Number(p.price) || 0);
        }
      });
    });

    // Sort and attach images to top 3 products
    const top3 = Object.values(productMap).sort((a, b) => b.qty - a.qty).slice(0, 3).map(tp => {
      const dbP = products.find(prod => prod.id === tp.id);
      return { ...tp, image: dbP?.image || null };
    });

    // Sort chart data chronologically
    const chartArr = Object.values(dateGroupMap).sort((a, b) => a.rawDate - b.rawDate);

    return {
      filteredSales: currentSales,
      turnover: currentTurnover,
      turnoverGrowth: filterType === "custom" ? null : (tGrowth > 0 ? `+${tGrowth.toFixed(1)}%` : `${tGrowth.toFixed(1)}%`),
      expenseTotal: currentExpenseTotal,
      expenseGrowth: filterType === "custom" ? null : (eGrowth > 0 ? `+${eGrowth.toFixed(1)}%` : `${eGrowth.toFixed(1)}%`),
      balance: currentTurnover - currentExpenseTotal,
      pendingAmount: pTotal,
      pendingCount: pCount,
      totalItems: items,
      chartData: chartArr,
      topProducts: top3
    };
  }, [sales, expenses, products, filterType, startDate, endDate, paymentFilter]);

  // Advanced Product Sales Analytics
  const productAnalytics = useMemo(() => {
    const targetId = selectedProductId || (topProducts.length > 0 ? topProducts[0].id : (products.length > 0 ? products[0].id : null));
    if (!targetId) return null;
    
    const dbProduct = products.find(p => p.id === targetId);
    if (!dbProduct) return null;

    let totalQty = 0;
    let totalRev = 0;
    let lastSold = 0;
    const chartMap = {};

    filteredSales.forEach(sale => {
      let saleDateVal = sale.createdAt || 0;
      if (sale.invoiceDate) {
        const [year, month, day] = sale.invoiceDate.split('-');
        saleDateVal = new Date(year, month - 1, day).getTime();
      }
      const saleDate = new Date(saleDateVal);
      const dateStr = saleDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

      if (!chartMap[dateStr]) {
        chartMap[dateStr] = { date: dateStr, rawDate: saleDateVal, Qty: 0, Revenue: 0 };
      }

      const pMatch = (sale.products || []).find(p => p.productId === targetId);
      if (pMatch) {
        const qty = Number(pMatch.quantity) || 0;
        const rev = qty * (Number(pMatch.price) || 0);
        totalQty += qty;
        totalRev += rev;
        chartMap[dateStr].Qty += qty;
        chartMap[dateStr].Revenue += rev;
        if (saleDateVal > lastSold) {
          lastSold = saleDateVal;
        }
      }
    });

    let badge = { text: "Low Sales", icon: "📦", color: "bg-gray-100 text-gray-600" };
    let trend = "Low Demand";

    if (totalQty >= 20) {
      badge = { text: "Best Seller", icon: "🔥", color: "bg-orange-100 text-orange-600" };
      trend = "High Demand";
    } else if (totalQty >= 10) {
      badge = { text: "High Demand", icon: "📈", color: "bg-green-100 text-green-600" };
      trend = "High Demand";
    } else if (totalQty >= 5) {
      badge = { text: "Trending", icon: "⭐", color: "bg-[#D4AF37]/20 text-[#D4AF37]" };
      trend = "Medium Demand";
    }

    const chartData = Object.values(chartMap).sort((a, b) => a.rawDate - b.rawDate);

    return { ...dbProduct, totalQty, totalRev, lastSoldDate: lastSold ? new Date(lastSold).toLocaleDateString() : "Never", badge, trend, chartData };
  }, [filteredSales, products, selectedProductId, topProducts]);

  // Handlers
  const handleEdit = (invoiceId) => {
    const invoiceToEdit = sales.find(s => s.id === invoiceId);
    if (invoiceToEdit) {
      navigate("/invoice", { state: { editInvoice: invoiceToEdit } });
    }
  };

  const handleDelete = (invoiceId) => {
    setDeletingInvoiceId(invoiceId);
  };

  const confirmDelete = async () => {
    if (!deletingInvoiceId) return;
    try {
      const invToDelete = sales.find(s => s.id === deletingInvoiceId);
      const updates = {};
      updates[`invoices/${deletingInvoiceId}`] = null;
      
      // Return stock safely before destroying the invoice
      if (invToDelete && invToDelete.products) {
        invToDelete.products.forEach(p => {
          if (p.productId) {
            const dbProd = products.find(prod => prod.id === p.productId);
            if (dbProd) {
               updates[`products/${p.productId}/stock`] = Number(dbProd.stock || 0) + Number(p.quantity || 0);
            }
          }
        });
      }
      await update(ref(db), updates);
      toast.success("Invoice deleted successfully", { style: { borderRadius: '14px', background: '#111', color: '#fff' }});
    } catch {
      toast.error("Failed to delete invoice");
    }
    setDeletingInvoiceId(null);
  };

  const handleMarkPaid = async (invoiceId) => {
    try {
      await update(ref(db), {
        [`invoices/${invoiceId}/paymentStatus`]: "paid"
      });
      toast.success("Invoice marked as Paid!", { style: { borderRadius: '14px', background: '#111', color: '#D4AF37' }});
    } catch {
      toast.error("Failed to update status");
    }
  };

  return (
    <div className="max-w-[1400px] mx-auto pb-10">
      <Toaster />

      {/* Header & Filters */}
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="mb-8 flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h1 className="text-4xl font-bold text-[#111] tracking-tight">Business Analytics</h1>
          <p className="text-gray-500 mt-2 font-medium">Detailed financial and product performance</p>
        </div>
        <div className="w-full md:w-auto flex flex-col sm:flex-row items-center gap-4">
          <div className="bg-white premium-shadow border border-gray-100 p-1.5 rounded-[20px] flex items-center h-full w-full sm:w-auto">
            {['all', 'paid', 'pending'].map(f => (
              <button
                key={f}
                onClick={() => setPaymentFilter(f)}
                className={`flex-1 sm:flex-none px-6 py-2.5 rounded-xl text-[11px] font-bold uppercase tracking-wider transition-all ${paymentFilter === f ? 'bg-[#111] text-[#D4AF37] shadow-md' : 'text-gray-400 hover:text-[#111]'}`}
              >
                {f}
              </button>
            ))}
          </div>
          <DateFilter filterType={filterType} setFilterType={setFilterType} startDate={startDate} setStartDate={setStartDate} endDate={endDate} setEndDate={setEndDate} />
        </div>
      </motion.div>

      {/* Summary Cards */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-10">
        <SalesCard title="Total Turnover" amount={`₹${turnover}`} icon={<FiDollarSign />} color="text-[#D4AF37]" percentage={turnoverGrowth} />
        <SalesCard title="Pending Amount" amount={`₹${pendingAmount}`} icon={<FiClock />} color="text-orange-500" />
        <SalesCard title="Pending Bills" amount={pendingCount} icon={<FiFileText />} color="text-orange-500" />
        <SalesCard title="Total Items Sold" amount={totalItems} icon={<FiPackage />} />
        <SalesCard title="Total Expenses" amount={`₹${expenseTotal}`} icon={<FiTrendingDown />} color="text-red-500" percentage={expenseGrowth} />
        <div className="bg-[#111] text-white premium-shadow border border-gray-800 rounded-[30px] p-7 relative overflow-hidden group hover:border-[#D4AF37]/50 transition-colors duration-300 flex flex-col justify-center cursor-default">
          <div className="absolute -top-10 -right-10 w-32 h-32 bg-[#D4AF37] blur-[70px] opacity-30 rounded-full group-hover:opacity-50 transition-opacity"></div>
          <div className="relative z-10 flex items-start justify-between">
            <div>
              <p className="text-gray-400 text-xs font-bold uppercase tracking-widest mb-2">Net Balance</p>
              <h2 className={`text-3xl font-bold tracking-tight font-['Poppins'] ${balance >= 0 ? 'text-green-400' : 'text-red-400'}`}>₹{balance}</h2>
            </div>
            <div className="w-12 h-12 rounded-[18px] bg-white/10 flex items-center justify-center text-2xl text-[#D4AF37]"><FiBriefcase /></div>
          </div>
        </div>
      </motion.div>

      {/* Analytics Graphs */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="mb-10">
        
        {/* Revenue Area Chart */}
        <div className="bg-white premium-shadow border border-gray-100 rounded-[30px] p-8 w-full">
          <h3 className="text-xl font-bold text-[#111] mb-6 tracking-tight">Revenue Trend</h3>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 10, right: 0, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorTurnover" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#D4AF37" stopOpacity={0.4}/>
                    <stop offset="95%" stopColor="#D4AF37" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fill: '#9CA3AF', fontSize: 12, fontWeight: 600 }} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#9CA3AF', fontSize: 12, fontWeight: 600 }} tickFormatter={(val) => `₹${val}`} />
                <Tooltip contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 40px -10px rgba(0,0,0,0.1)', fontWeight: 'bold', color: '#111' }} />
                <Area type="monotone" dataKey="Revenue" stroke="#111" strokeWidth={3} fillOpacity={1} fill="url(#colorTurnover)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </motion.div>

      {/* Product Sales Analytics */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }} className="mb-10">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-6">
          <div>
            <h3 className="text-2xl font-bold text-[#111] tracking-tight font-['Poppins']">Product Sales Analytics</h3>
            <p className="text-gray-500 mt-1 font-medium text-sm">Track product-wise sales performance and stock movement.</p>
          </div>
          <div className="relative group min-w-[250px]">
            <select 
              value={selectedProductId || (productAnalytics ? productAnalytics.id : "")}
              onChange={(e) => setSelectedProductId(e.target.value)}
              className="w-full bg-white border border-gray-200 hover:border-[#D4AF37]/50 focus:border-[#D4AF37] rounded-xl text-sm font-bold text-[#111] p-3.5 appearance-none cursor-pointer outline-none transition-all shadow-sm">
              <option value="" disabled>Select Product...</option>
              {products.map(p => (
                <option key={p.id} value={p.id}>{p.productName}</option>
              ))}
            </select>
            <FiChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none group-hover:text-[#D4AF37] transition-colors" />
          </div>
        </div>

        {productAnalytics ? (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Premium Product Card */}
            <div className="lg:col-span-4 bg-[#111] rounded-[30px] p-6 text-white relative overflow-hidden group premium-shadow">
              <div className="absolute top-0 right-0 w-32 h-32 bg-[#D4AF37] blur-[70px] opacity-20 rounded-full group-hover:opacity-40 transition-opacity"></div>
              <div className="flex items-start justify-between relative z-10 mb-6">
                <span className={`px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider flex items-center gap-1.5 shadow-sm ${productAnalytics.badge.color}`}>
                   {productAnalytics.badge.icon} {productAnalytics.badge.text}
                </span>
                <span className="bg-white/10 text-white px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider backdrop-blur-md">
                  {productAnalytics.category}
                </span>
              </div>
              <div className="flex flex-col items-center text-center relative z-10 mb-8">
                <div className="w-28 h-28 bg-gray-50/10 rounded-[20px] mb-4 flex items-center justify-center border border-white/10 overflow-hidden shadow-xl">
                  {productAnalytics.image ? (
                    <img src={productAnalytics.image} alt={productAnalytics.productName} className="w-full h-full object-cover" />
                  ) : (
                    <FiPackage className="text-4xl text-gray-400" />
                  )}
                </div>
                <h4 className="text-xl font-bold font-['Poppins'] text-[#c4c2c2] tracking-tight mb-1 px-4">{productAnalytics.productName}</h4>
                <p className="text-xs text-gray-400 font-medium uppercase tracking-widest">{productAnalytics.trend}</p>
              </div>
              <div className="grid grid-cols-2 gap-4 relative z-10 border-t border-white/10 pt-6"> 
                 <div>
                   <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mb-1">Quantity Sold</p>
                   <p className="text-2xl font-bold text-white">{productAnalytics.totalQty} <span className="text-sm text-gray-500 font-medium">pcs</span></p>
                 </div>
                 <div>
                   <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mb-1">Revenue</p>
                   <p className="text-2xl font-bold text-[#D4AF37]">₹{productAnalytics.totalRev}</p>
                 </div>
                 <div className="col-span-2 pt-2 border-t border-white/5 mt-2">
                   <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mb-1">Last Sold Date</p>
                   <p className="text-sm font-bold text-white">{productAnalytics.lastSoldDate}</p>
                 </div>
              </div>
            </div>

            {/* Product Sales Graph */}
            <div className="lg:col-span-8 bg-white premium-shadow border border-gray-100 rounded-[30px] p-8 flex flex-col">
              <h3 className="text-lg font-bold text-[#111] mb-6 tracking-tight">Product Sales Trend</h3>
              <div className="flex-1 min-h-[300px] w-full">
                {productAnalytics.chartData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={productAnalytics.chartData} margin={{ top: 10, right: 0, left: -20, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                      <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fill: '#9CA3AF', fontSize: 12, fontWeight: 600 }} dy={10} />
                      <YAxis yAxisId="left" axisLine={false} tickLine={false} tick={{ fill: '#9CA3AF', fontSize: 12, fontWeight: 600 }} />
                      <YAxis yAxisId="right" orientation="right" axisLine={false} tickLine={false} tick={{ fill: '#9CA3AF', fontSize: 12, fontWeight: 600 }} tickFormatter={(val) => `₹${val}`} />
                      <Tooltip cursor={{ fill: '#f9fafb' }} contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 40px -10px rgba(0,0,0,0.1)', fontWeight: 'bold' }} />
                      <Bar yAxisId="left" dataKey="Qty" fill="#111111" radius={[4, 4, 0, 0]} barSize={30} />
                      <Bar yAxisId="right" dataKey="Revenue" fill="#D4AF37" radius={[4, 4, 0, 0]} barSize={30} />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex flex-col items-center justify-center h-full text-gray-400">
                    <FiTrendingDown className="text-4xl mb-3 text-gray-200" />
                    <p className="font-semibold text-sm">No sales data for this period.</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-white premium-shadow border border-gray-100 rounded-[30px] p-12 text-center text-gray-400 font-medium">
            <FiPackage className="text-4xl mx-auto mb-3 text-gray-300" />
            Select a product to view its analytics.
          </div>
        )}
      </motion.div>

      {/* Best Selling Products */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="mb-10">
        <h3 className="text-2xl font-bold text-[#111] mb-6 tracking-tight font-['Poppins']">Best Selling Products</h3>
        {topProducts.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {topProducts.map((prod, index) => {
              const medals = [{ text: "Top Seller", icon: "🥇", color: "bg-[#D4AF37] text-[#111]" }, { text: "Popular", icon: "🥈", color: "bg-gray-200 text-gray-700" }, { text: "Trending", icon: "🥉", color: "bg-orange-100 text-orange-700" }];
              const badge = medals[index];
              return (
                <div key={prod.id} className="bg-white premium-shadow border border-gray-100 rounded-[24px] p-5 flex items-center gap-5 relative overflow-hidden group hover:border-[#D4AF37]/40 transition-colors">
                  <div className="absolute top-0 right-0 px-3 py-1 text-[10px] font-bold uppercase tracking-wider rounded-bl-xl shadow-sm z-10 flex items-center gap-1.5 backdrop-blur-md border-b border-l border-white/20" style={{ backgroundColor: badge.color.split(' ')[0], color: badge.color.split(' ')[1] }}>
                    <span className="text-sm">{badge.icon}</span> {badge.text}
                  </div>
                  <div className="w-24 h-24 bg-gray-50 rounded-[16px] border border-gray-100 flex items-center justify-center shrink-0 overflow-hidden group-hover:shadow-md transition-shadow">
                    {prod.image ? <img src={prod.image} alt={prod.name} className="w-full h-full object-cover" /> : <FiImage className="text-gray-300 text-3xl" />}
                  </div>
                  <div className="flex flex-col flex-1 truncate pr-2 pt-2">
                    <span className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">{prod.category}</span>
                    <h4 className="font-bold text-[#111] font-['Poppins'] text-lg truncate mb-2">{prod.name}</h4>
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-bold text-gray-600 bg-gray-50 px-2 py-0.5 rounded-md">{prod.qty} Sold</span>
                      <span className="font-bold text-[#D4AF37]">₹{prod.revenue}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="bg-white premium-shadow border border-gray-100 rounded-[30px] p-12 text-center text-gray-400 font-medium">
            <FiPackage className="text-4xl mx-auto mb-3 text-gray-300" />
            No product sales available in this period.
          </div>
        )}
      </motion.div>

      {/* Table */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
        <ReportTable sales={filteredSales} onEdit={handleEdit} onDelete={handleDelete} onMarkPaid={handleMarkPaid} />
      </motion.div>

      {/* DELETE CONFIRMATION MODAL */}
      {deletingInvoiceId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="bg-white rounded-[30px] p-8 w-full max-w-md text-center shadow-2xl">
            <div className="w-20 h-20 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto mb-6">
              <FiAlertTriangle className="text-4xl" />
            </div>
            <h2 className="text-2xl font-bold text-[#111] mb-2 font-['Poppins']">Delete Invoice?</h2>
            <p className="text-gray-500 mb-8 font-medium">Are you sure you want to permanently delete this invoice record? This will accurately revert product stock quantities.</p>
            <div className="flex gap-4">
              <button onClick={() => setDeletingInvoiceId(null)} className="flex-1 bg-gray-100 text-gray-600 py-3.5 rounded-xl font-bold hover:bg-gray-200 transition-colors">Cancel</button>
              <button onClick={confirmDelete} className="flex-1 bg-red-500 text-white py-3.5 rounded-xl font-bold hover:bg-red-600 transition-colors shadow-lg shadow-red-500/30">Delete</button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
};

export default Reports;