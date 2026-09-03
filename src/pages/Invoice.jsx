import { useRef, useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import html2canvas from "html2canvas";
import { jsPDF } from "jspdf";
import { db } from "../firebase";
import { ref, onValue, push, update } from "firebase/database";
import toast, { Toaster } from "react-hot-toast";
import { motion } from "framer-motion";
import {
  FiDownload,
  FiPlus,
  FiTrash2,
  FiSave,
  FiMapPin,
  FiPackage,
  FiCheckCircle,
  FiLoader,
  FiShare2,
  FiClock
} from "react-icons/fi";
import logoIcon from '../assets/caligraphy.logo.jpeg';  

const containerVariants = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.1 } } };
const itemVariants = { hidden: { y: 20, opacity: 0 }, show: { y: 0, opacity: 1, transition: { type: "spring", stiffness: 300, damping: 24 } } };

const Invoice = () => {
  const invoiceRef = useRef();
  const location = useLocation();
  const navigate = useNavigate();

  const [customer, setCustomer] = useState({
    name: "",
    phone: "",
    address: "",
    place: "",
    pincode: ""
  });
  const [editId, setEditId] = useState(null);

  const [invoiceProducts, setInvoiceProducts] = useState([
    { id: 1, productId: "", productName: "", price: "", quantity: 1 }
  ]);
  const [availableProducts, setAvailableProducts] = useState([]);
  const [shippingCharge, setShippingCharge] = useState("50");
  const [pincodeLoading, setPincodeLoading] = useState(false);
  const [invoiceNumber, setInvoiceNumber] = useState("WE-100");
  const [loading, setLoading] = useState(false);
  const [isSharing, setIsSharing] = useState(false);
  const [activeDropdown, setActiveDropdown] = useState(null);
  const [paymentStatus, setPaymentStatus] = useState("paid");
  const [invoiceDate, setInvoiceDate] = useState(() => {
    const d = new Date();
    const offset = d.getTimezoneOffset() * 60000;
    return new Date(d.getTime() - offset).toISOString().split('T')[0];
  });

  // Fetch Products
  useEffect(() => {
    const prodRef = ref(db, "products");
    onValue(prodRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        setAvailableProducts(Object.keys(data).map(k => ({ id: k, ...data[k] })));
      } else {
        setAvailableProducts([]);
      }
    });
  }, []);

  // Prefill Data if Editing
useEffect(() => {
  const editInvoice = location.state?.editInvoice;

  if (!editInvoice) return;

  const formattedDate = editInvoice.invoiceDate
    ? editInvoice.invoiceDate
    : editInvoice.createdAt
    ? new Date(
        new Date(editInvoice.createdAt).getTime() -
          new Date(editInvoice.createdAt).getTimezoneOffset() * 60000
      )
        .toISOString()
        .split("T")[0]
    : "";

  // Single state update pattern
  Promise.resolve().then(() => {
    setEditId(editInvoice.id);
    setInvoiceNumber(editInvoice.invoiceNumber || "");
    setCustomer({
      name: editInvoice.customerName || "",
      phone: editInvoice.phone || "",
      address: editInvoice.address || "",
      place: editInvoice.place || "",
      pincode: editInvoice.pincode || "",
    });

    setShippingCharge(
      editInvoice.shippingCharge?.toString() || "0"
    );

    setPaymentStatus(
      editInvoice.paymentStatus || "paid"
    );

    setInvoiceDate(formattedDate);

    // Invoice Date
    if (
      editInvoice.products &&
      editInvoice.products.length > 0
    ) {
      setInvoiceProducts(
        editInvoice.products.map((p) => ({
          id: p.id || Date.now() + Math.random(),
          productId: p.productId || "",
          productName: p.productName || "",
          price: p.price || "",
          quantity: p.quantity || 1,
        }))
      );
    }
  });
}, [location.state?.editInvoice]);

  // Fetch Invoices for Auto-increment Number
  useEffect(() => {
    const invRef = ref(db, "invoices");
    if (editId || location.state?.editInvoice) return; // Prevent overwriting edit invoice number
    onValue(invRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const invoicesList = Object.values(data);
        let maxNum = 99;
        invoicesList.forEach(inv => {
          if (inv.invoiceNumber && inv.invoiceNumber.startsWith("WE-")) {
            const num = parseInt(inv.invoiceNumber.replace("WE-", ""));
            if (!isNaN(num) && num > maxNum) {
              maxNum = num;
            }
          }
        });
        setInvoiceNumber(`WE-${maxNum + 1}`);
      } else {
        setInvoiceNumber("WE-100");
      }
    }); 
  }, [location.state, editId]);  

  const handleCustomerChange = (e) => setCustomer({ ...customer, [e.target.name]: e.target.value });

  // Auto-detect Post Office & District via India Pincode API
  const handlePincodeChange = async (e) => {
    const val = e.target.value.replace(/\D/g, '').slice(0, 6);
    setCustomer({ ...customer, pincode: val });

    if (val.length === 6) {
      setPincodeLoading(true);
      try {
        const res = await fetch(`https://api.postalpincode.in/pincode/${val}`);
        const data = await res.json();
        if (data && data[0] && data[0].Status === "Success") {
          const postOffice = data[0].PostOffice[0];
          setCustomer(prev => ({
            ...prev,
            place: `${postOffice.Name}, ${postOffice.District}`
          }));
          toast.success(`Location matched: ${postOffice.District}`, { icon: '📍', style: { borderRadius: '14px', background: '#111', color: '#fff' }});
        } else {
          toast.error("Invalid Pincode", { style: { borderRadius: '14px', background: '#111', color: '#fff' }});
        }
      } catch {
        toast.error("Failed to verify pincode");
      }
      setPincodeLoading(false);
    }
  };

  const addProductRow = () => {
    setInvoiceProducts([...invoiceProducts, { id: Date.now(), productId: "", productName: "", price: "", quantity: 1 }]);
  };

  const removeProductRow = (id) => {
    if (invoiceProducts.length > 1) {
      setInvoiceProducts(invoiceProducts.filter(p => p.id !== id));
    }
  };

  const updateProductRow = (id, field, value) => {
    setInvoiceProducts(invoiceProducts.map(p => p.id === id ? { ...p, [field]: value } : p));
  };

  const updateProductRowMulti = (id, updates) => {
    setInvoiceProducts(prev => prev.map(p => p.id === id ? { ...p, ...updates } : p));
  };

  // Calculations
  const processedProducts = invoiceProducts.map(ip => {
    const price = Number(ip.price) || 0;
    const qty = Number(ip.quantity) || 0;
    const total = price * qty;
    return { ...ip, price, total, qty }; 
  });

  const totalQty = processedProducts.reduce((sum, p) => sum + p.qty, 0);
  const subtotal = processedProducts.reduce((sum, p) => sum + p.total, 0);

  // Auto-Toggle Shipping Type Logic
  const isFreeShipping = totalQty >= 4;
  const effectiveShipping = isFreeShipping ? 0 : Number(shippingCharge || 0);
  const grandTotal = subtotal + effectiveShipping;

  const displayDateStr = invoiceDate ? invoiceDate.split('-').reverse().join('/') : '';

  // Save Invoice & Update Stock
  const handleSaveInvoice = async (e) => {
    e.preventDefault();
    
    if (!customer.name || !customer.phone) {
      toast.error("Please fill required customer details");
      return;
    }

    const validProducts = processedProducts.filter(p => p.productName.trim() !== "" && p.qty > 0);
    if (validProducts.length === 0) {
      toast.error("Please add at least one valid product");
      return;
    }

    setLoading(true);
    try {
      const stockChanges = {};
      
      // If editing, add back old stock to offset the difference
      if (editId && location.state?.editInvoice?.products) {
        location.state.editInvoice.products.forEach(oldP => {
          if (oldP.productId) {
            stockChanges[oldP.productId] = (stockChanges[oldP.productId] || 0) + Number(oldP.quantity);
          }
        });
      }
      
      // Subtract newly defined quantities
      validProducts.forEach(newP => {
        if (newP.productId) {
          stockChanges[newP.productId] = (stockChanges[newP.productId] || 0) - Number(newP.qty);
        }
      });

      // Validate real stock capacities before saving
      for (let pid of Object.keys(stockChanges)) {
        if (!pid) continue; // Skip manual custom products
        const dbP = availableProducts.find(p => p.id === pid);
        if (dbP) {
          const resultingStock = Number(dbP.stock || 0) + stockChanges[pid];
          if (resultingStock < 0) {
            toast.error(`Not enough stock for ${dbP.productName} (Shortfall: ${Math.abs(resultingStock)})`);
            setLoading(false);
            return;
          }
        }
      }

        const finalProducts = validProducts.map((p, index) => {
        // Allocate shipping charge to the first product to avoid double-counting in overall turnover totals
        const productShipping = index === 0 ? effectiveShipping : 0;
        const productGrandTotal = p.total + productShipping;

        return {
          productId: p.productId || "",
          customerName: customer.name,
          productName: p.productName,
          category: p.productId ? (availableProducts.find(ap => ap.id === p.productId)?.category || "Custom") : "Custom",
          quantity: p.qty,
          price: p.price,
          subtotal: p.total,
          shippingCharge: productShipping,
          grandTotal: productGrandTotal,
          total: productGrandTotal, // Updating `total` to reflect `grandTotal` fixes existing Dashboard logic automatically
          date: displayDateStr,
          invoiceDate: invoiceDate,
          status: editId ? location.state.editInvoice.status : "Completed",
          invoiceNumber: invoiceNumber
        };
      });

      const invoiceData = {
        invoiceNumber: invoiceNumber,
        customerName: customer.name,
        phone: customer.phone,
        address: customer.address,
        place: customer.place,
        pincode: customer.pincode,
        products: finalProducts,
        shippingType: isFreeShipping ? "free" : "manual",
        shippingCharge: effectiveShipping,
        subtotal: subtotal,
        totalAmount: grandTotal,
        paymentStatus: paymentStatus,
        createdAt: editId ? location.state.editInvoice.createdAt : Date.now(),
        date: displayDateStr,
        invoiceDate: invoiceDate,
        status: editId ? location.state.editInvoice.status : "Completed"
      };

      const updates = {};
      if (editId) {
        updates[`invoices/${editId}`] = invoiceData;
      } else {
        const newInvoiceRef = push(ref(db, "invoices"));
        updates[`invoices/${newInvoiceRef.key}`] = invoiceData;
      }

      for (let pid of Object.keys(stockChanges)) {
        const dbP = availableProducts.find(p => p.id === pid);
        if (dbP) {
          updates[`products/${pid}/stock`] = Number(dbP.stock || 0) + stockChanges[pid];
        }
      }

      await update(ref(db), updates);
      toast.success(editId ? "Invoice Updated Successfully!" : "Luxury Invoice Generated!", { style: { borderRadius: '14px', background: '#111', color: '#D4AF37' }});

      if (editId) {
        navigate('/reports');
      } else {
        setCustomer({ name: "", phone: "", address: "", place: "", pincode: "" });
        setInvoiceProducts([{ id: Date.now(), productId: "", productName: "", price: "", quantity: 1 }]);
        setPaymentStatus("paid");
        setShippingCharge("50");
        const d = new Date();
        const offset = d.getTimezoneOffset() * 60000;
        setInvoiceDate(new Date(d.getTime() - offset).toISOString().split('T')[0]);
      }
    } catch (error) {
      console.error(error);
      toast.error("Failed to save invoice");
    }
    setLoading(false);
  };

  // Native Share & Fallback
  const handleShare = async () => {
    setIsSharing(true);
    try {
      const element = invoiceRef.current;
      const canvas = await html2canvas(element, { scale: 3, useCORS: true });
      const data = canvas.toDataURL("image/png");
      const pdf = new jsPDF("p", "mm", "a4");
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      let imgHeight = (canvas.height * pdfWidth) / canvas.width;
      let imgWidth = pdfWidth;
      
      if (imgHeight > pageHeight) {
        const ratio = pageHeight / imgHeight;
        imgHeight = pageHeight;
        imgWidth = pdfWidth * ratio;
      }
      
      const offsetX = (pdfWidth - imgWidth) / 2;
      pdf.addImage(data, "PNG", offsetX, 0, imgWidth, imgHeight);
      
      const pdfFilename = `${invoiceNumber.replace('-', ' -')}.pdf`;
      const pdfBlob = pdf.output("blob");
      const file = new File([pdfBlob], pdfFilename, { type: "application/pdf" });

      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({
          files: [file],
          title: `Invoice ${invoiceNumber}`,  
        });
      } else {
        pdf.save(pdfFilename);
        toast("Sharing not supported on this device", {
          icon: '⚠️',
          style: { borderRadius: '14px', background: '#111', color: '#D4AF37' }
        });
      }
    } catch (error) {
      if (error.name !== "AbortError") {
        console.error("Error sharing:", error);
        toast.error("Failed to share invoice");
      }
    }
    setIsSharing(false);
  };

  // PDF Download
  const downloadPDF = async () => {
    const element = invoiceRef.current;
    const canvas = await html2canvas(element, { scale: 3, useCORS: true });
    const data = canvas.toDataURL("image/png");
    const pdf = new jsPDF("p", "mm", "a4");
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    let imgHeight = (canvas.height * pdfWidth) / canvas.width;
    let imgWidth = pdfWidth;
    
    if (imgHeight > pageHeight) {
      const ratio = pageHeight / imgHeight;
      imgHeight = pageHeight;
      imgWidth = pdfWidth * ratio;
    }
    
    const offsetX = (pdfWidth - imgWidth) / 2;
    pdf.addImage(data, "PNG", offsetX, 0, imgWidth, imgHeight);
    pdf.save(`Ajeer_Graphy_Invoice_${invoiceNumber}.pdf`);
  };

  return (
    <div className="max-w-[1400px] mx-auto pb-10">
      <Toaster />
      
      {/* Premium Hero Section */}
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="mb-10 flex justify-between items-end">
        <div>
          <h1 className="text-4xl font-bold text-[#111] tracking-tight">Billing & Invoice</h1>
          <p className="text-gray-500 mt-2 font-medium">Create premium invoices, manage stock, and generate professional customer billing for Ajeer Graphy.</p>
        </div>
      </motion.div>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-8">
        
        {/* Left Column - Form */}
        <motion.div variants={containerVariants} initial="hidden" animate="show" className="xl:col-span-7 space-y-8">
          
          {/* Customer Details */}
          <motion.div variants={itemVariants} className="bg-white premium-shadow border border-gray-100 rounded-[30px] p-8 relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-32 h-32 bg-[#D4AF37] blur-[80px] opacity-10 rounded-full group-hover:opacity-20 transition-opacity"></div>
            <h3 className="text-xl font-bold text-[#111] mb-6 tracking-tight flex items-center gap-2"><FiMapPin className="text-[#D4AF37]" /> Customer Details</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 relative z-10">
              <div className="md:col-span-2 flex flex-col md:flex-row gap-6">
                <input type="text" name="name" placeholder="Customer Name *" value={customer.name} onChange={handleCustomerChange} className="w-full bg-gray-50 hover:bg-gray-100/50 border border-transparent focus:bg-white focus:border-[#D4AF37]/40 rounded-2xl text-sm font-semibold text-[#111] outline-none transition-all p-4" required />
                <input type="tel" name="phone" placeholder="Phone Number *" value={customer.phone} onChange={handleCustomerChange} className="w-full bg-gray-50 hover:bg-gray-100/50 border border-transparent focus:bg-white focus:border-[#D4AF37]/40 rounded-2xl text-sm font-semibold text-[#111] outline-none transition-all p-4" required />
              </div>
              <div className="md:col-span-2">
                <textarea name="address" placeholder="Full Postal Address" value={customer.address} onChange={handleCustomerChange} rows="2" className="w-full bg-gray-50 hover:bg-gray-100/50 border border-transparent focus:bg-white focus:border-[#D4AF37]/40 rounded-2xl text-sm font-semibold text-[#111] outline-none transition-all p-4 resize-none"></textarea>
              </div>
              <div className="relative group/input">
                <input type="text" name="pincode" placeholder="Pincode (Auto Detect)" value={customer.pincode} onChange={handlePincodeChange} maxLength={6} className="w-full bg-gray-50 hover:bg-gray-100/50 border border-transparent focus:bg-white focus:border-[#D4AF37]/40 rounded-2xl text-sm font-semibold text-[#111] outline-none transition-all p-4" />
                {pincodeLoading && <FiLoader className="absolute right-4 top-4 text-lg text-[#D4AF37] animate-spin" />}
              </div>
              <input type="text" name="place" placeholder="Post Office / District" value={customer.place} onChange={handleCustomerChange} className="w-full bg-gray-50 hover:bg-gray-100/50 border border-transparent focus:bg-white focus:border-[#D4AF37]/40 rounded-2xl text-sm font-semibold text-[#111] outline-none transition-all p-4" />
            </div>
          </motion.div>

          {/* Order Items */}
          <motion.div variants={itemVariants} className="bg-white premium-shadow border border-gray-100 rounded-[30px] p-8">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold text-[#111] tracking-tight flex items-center gap-2"><FiPackage className="text-[#D4AF37]"/> Order Items</h3>
              <button onClick={addProductRow} className="bg-[#111] text-[#D4AF37] px-4 py-2 rounded-xl font-bold text-xs flex items-center gap-1.5 hover:bg-black transition-colors shadow-md">
                <FiPlus/> Add Product
              </button>
            </div>
            <div className="space-y-4">
              {invoiceProducts.map((p) => (
                <div key={p.id} className="flex flex-col md:flex-row items-start md:items-center gap-4 bg-gray-50/70 p-4 rounded-[20px] border border-gray-100 hover:bg-white hover:border-[#D4AF37]/40 transition-colors group">
                  <div className="flex-1 w-full relative z-20">
                    <div className="relative">
                      <input
                        type="text"
                        placeholder="Search or type custom product..."
                        value={p.productName}
                        onChange={(e) => {
                          const val = e.target.value;
                          updateProductRowMulti(p.id, { productName: val });
                          const matched = availableProducts.find(ap => ap.productName.toLowerCase() === val.toLowerCase());
                          if (matched) {
                            updateProductRowMulti(p.id, { productId: matched.id, productName: matched.productName, price: matched.sellingPrice });
                          } else {
                            updateProductRowMulti(p.id, { productId: "" });
                          }
                        }}
                        onFocus={() => setActiveDropdown(p.id)}
                        onBlur={() => setTimeout(() => setActiveDropdown(null), 200)}
                        className="w-full bg-white border border-gray-200 focus:border-[#D4AF37]/50 rounded-xl text-sm font-semibold text-[#111] outline-none transition-all p-3.5 pr-10"
                      />
                      <FiPackage className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                    </div>
                    
                    {/* Searchable Dropdown List */}
                    {activeDropdown === p.id && (
                      <div className="absolute z-50 w-full bg-white border border-gray-100 rounded-xl shadow-2xl max-h-60 overflow-y-auto mt-2">
                        {availableProducts
                          .filter(ap => ap.productName.toLowerCase().includes(p.productName.toLowerCase()))
                          .map(ap => (
                          <div
                            key={ap.id}
                            className="p-3 hover:bg-gray-50 cursor-pointer border-b border-gray-50 last:border-0"
                            onClick={() => {
                              updateProductRowMulti(p.id, { productId: ap.id, productName: ap.productName, price: ap.sellingPrice });
                              setActiveDropdown(null);
                            }}
                          >
                            <div className="font-bold text-sm text-[#111]">{ap.productName}</div>
                            <div className="text-xs text-gray-500">Stock: {ap.stock} • ₹{ap.sellingPrice}</div>
                          </div>
                      ))}
                        {p.productName.trim() !== "" && !availableProducts.find(ap => ap.productName.toLowerCase() === p.productName.toLowerCase()) && (
                          <div className="p-3 bg-blue-50/50 text-xs font-semibold text-blue-600 italic rounded-b-xl border-t border-blue-100">
                            Manual Entry: "{p.productName}"
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                  
                  <div className="w-full md:w-32 relative">
                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 font-bold text-sm">₹</span>
                    <input 
                      type="number" 
                      min="0" 
                      value={p.price} 
                      onChange={(e) => updateProductRow(p.id, "price", e.target.value)} 
                      className="w-full bg-white border border-gray-200 focus:border-[#D4AF37]/50 rounded-xl text-sm font-semibold text-[#111] outline-none transition-all p-3.5 pl-8" 
                      placeholder="Price" 
                    />
                  </div>
                  <div className="w-full md:w-24 relative">
                    <input type="number" min="1" value={p.quantity} onChange={(e) => updateProductRow(p.id, "quantity", e.target.value)} className="w-full bg-white border border-gray-200 focus:border-[#D4AF37]/50 rounded-xl text-sm font-semibold text-[#111] outline-none transition-all p-3.5 text-center" placeholder="Qty" />
                  </div>
                  <div className="w-full md:w-28 text-right pr-2">
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest md:hidden mb-1">Line Total</p>
                    <span className="font-bold text-[#111] text-lg">₹{(Number(p.price) || 0) * (Number(p.quantity) || 0)}</span>
                  </div>
                  <button onClick={() => removeProductRow(p.id)} className="w-11 h-11 rounded-xl bg-red-50 text-red-500 flex items-center justify-center hover:bg-red-500 hover:text-white transition-colors shrink-0 md:opacity-0 group-hover:opacity-100">
                    <FiTrash2 />
                  </button>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Shipping Logic */}
          <motion.div variants={itemVariants} className="bg-white premium-shadow border border-gray-100 rounded-[30px] p-8">
            <h3 className="text-xl font-bold text-[#111] mb-6 tracking-tight">Shipping</h3>
            {isFreeShipping ? (
              <div className="bg-green-50/80 text-green-600 border border-green-200 rounded-2xl p-5 font-bold flex items-center justify-center gap-2 text-lg shadow-sm">
                <FiCheckCircle className="text-xl"/> Ultra Premium Free Shipping Applied (4+ items)
              </div>
            ) : (
              <div className="relative group/input max-w-md">
                <span className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-400 font-bold">₹</span>
                <input type="number" min="0" placeholder="Custom Shipping Charge" value={shippingCharge} onChange={(e) => setShippingCharge(e.target.value)} className="w-full bg-gray-50 hover:bg-gray-100/50 border border-transparent focus:bg-white focus:border-[#D4AF37]/40 rounded-2xl text-sm font-semibold text-[#111] outline-none transition-all p-5 pl-10" />
              </div>
            )}
          </motion.div>

          {/* Payment Status & Invoice Date */}
          <motion.div variants={itemVariants} className="bg-white premium-shadow border border-gray-100 rounded-[30px] p-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div>
                <h3 className="text-xl font-bold text-[#111] mb-6 tracking-tight flex items-center gap-2">
                  <FiClock className="text-[#D4AF37]" /> Payment Status
                </h3>
                <div className="flex items-center gap-3 bg-gray-50/80 p-2 rounded-2xl border border-gray-100 w-fit">
                  <button type="button" onClick={() => setPaymentStatus("paid")} className={`px-8 py-3.5 rounded-xl font-bold text-sm tracking-wide transition-all ${paymentStatus === "paid" ? "bg-[#111] text-[#D4AF37] shadow-md" : "text-gray-400 hover:text-[#111]"}`}>
                    🟢 Paid
                  </button>
                  <button type="button" onClick={() => setPaymentStatus("pending")} className={`px-8 py-3.5 rounded-xl font-bold text-sm tracking-wide transition-all ${paymentStatus === "pending" ? "bg-orange-50 text-orange-600 shadow-md border border-orange-200/50" : "text-gray-400 hover:text-[#111]"}`}>
                    🟠 Pending
                  </button>
                </div>
              </div>
              
              <div>
                <h3 className="text-xl font-bold text-[#111] mb-6 tracking-tight flex items-center gap-2">
                  <FiClock className="text-[#D4AF37]" /> Invoice Date
                </h3>
                <input 
                  type="date" 
                  value={invoiceDate} 
                  onChange={(e) => setInvoiceDate(e.target.value)} 
                  className="w-full bg-gray-50 hover:bg-gray-100/50 border border-transparent focus:bg-white focus:border-[#D4AF37]/40 rounded-2xl text-sm font-semibold text-[#111] outline-none transition-all p-4" 
                  required 
                />
              </div>
            </div>
          </motion.div>
          
          {/* Actions */}
          <motion.div variants={itemVariants} className="bg-[#111] p-6 rounded-[30px] premium-shadow flex flex-col sm:flex-row gap-4 relative overflow-hidden">
            <div className="absolute -top-20 -right-20 w-40 h-40 bg-[#D4AF37] blur-[70px] opacity-20 rounded-full"></div>
            <button onClick={handleSaveInvoice} disabled={loading} className="flex-1 bg-[#D4AF37] text-[#111] px-6 py-4 rounded-2xl font-bold flex items-center justify-center gap-2 hover:bg-yellow-400 transition-all shadow-[0_10px_30px_-10px_rgba(212,175,55,0.4)] disabled:opacity-70 z-10 text-lg tracking-wide">
              {loading ? <FiLoader className="animate-spin text-xl"/> : <><FiSave className="text-xl"/> {editId ? "Update & Save Invoice" : "Generate & Save Invoice"}</>}
            </button>
          <button onClick={handleShare} disabled={isSharing} className="bg-white/10 border border-white/5 text-white hover:bg-[#D4AF37] hover:text-[#111] hover:border-[#D4AF37] px-6 py-4 rounded-2xl font-bold flex items-center justify-center gap-2 transition-all z-10 disabled:opacity-70">
            {isSharing ? <FiLoader className="animate-spin text-xl"/> : <><FiShare2 className="text-xl"/> Share</>}
            </button>
          <button onClick={downloadPDF} className="bg-white/10 border border-white/5 text-white hover:bg-[#D4AF37] hover:text-[#111] hover:border-[#D4AF37] px-6 py-4 rounded-2xl font-bold flex items-center justify-center gap-2 transition-all z-10">
              <FiDownload className="text-xl"/> PDF
            </button>
          </motion.div>
        </motion.div>

        {/* Right Column - Invoice Preview */}
        <motion.div variants={containerVariants} initial="hidden" animate="show" className="xl:col-span-5 flex flex-col h-auto overflow-visible">
          <h3 className="text-xl font-bold text-[#111] tracking-tight mb-6 font-['Poppins']">Live Preview</h3>
          
          <div className="w-full h-auto overflow-visible">
            <div ref={invoiceRef} className="bg-white w-full h-auto p-6 sm:p-8 flex flex-col relative text-[#111] rounded-[20px] shadow-[0_20px_50px_-12px_rgba(0,0,0,0.15)] border border-[#D4AF37]/20 overflow-visible font-['Poppins']">
              
              {/* Accent Header Bar */}
              <div className="absolute top-0 left-0 w-full h-1.5 sm:p-2 bg-gradient-to-r from-[#111] via-[#1d164a] to-[#111] rounded-t-[20px]"></div>
              
              {/* Company Logo & Invoice Info */}
              <div className="flex justify-between items-start mt-2 mb-6 gap-6">
                <div className="flex flex-col max-w-[50%]">
                  <img src={logoIcon} alt="Company Logo" className="h-12 object-contain object-left mix-blend-multiply" />
                </div>
                <div className="text-right">
                  <p className="text-[9px] font-bold text-[#202687] tracking-widest uppercase mb-1.5">Invoice</p> 
                  <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">No: <span className="text-[#111]">{invoiceNumber}</span></p>
                  <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mt-0.5">Date: <span className="text-[#111]">{displayDateStr}</span></p>
                </div>
              </div>

              {/* Billed To Customer */}
              <div className="mb-6 bg-gray-50/50 p-4 rounded-2xl border border-gray-100 shadow-sm">
                <h3 className="text-[9px] font-bold text-[#202687] uppercase tracking-widest mb-2 border-b border-gray-200 pb-2">Billed To Customer</h3>
                <p className="font-bold text-base mb-0.5 tracking-tight text-[#111] uppercase">{customer.name || "Customer Name"}</p>
                {customer.phone && <p className="text-[11px] text-gray-500 font-semibold">{customer.phone}</p>}
                {customer.address && <p className="text-[11px] text-gray-500 font-semibold mt-0.5 leading-relaxed">{customer.address}</p>}
                {(customer.place || customer.pincode) && <p className="text-[11px] text-gray-500 font-semibold mt-0.5">{customer.place} {customer.pincode && `- ${customer.pincode}`}</p>}
              </div>

              {/* Products Table */}
              <div className="flex-1 overflow-visible mb-4">
                <table className="w-full text-left border-collapse"> 
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="pb-2 text-[9px] font-bold uppercase tracking-widest text-[#202687]">Description</th>
                      <th className="pb-2 text-[9px] font-bold uppercase tracking-widest text-[#202687] text-center w-12 sm:w-16">Qty</th>
                      <th className="pb-2 text-[9px] font-bold uppercase tracking-widest text-[#202687] text-right w-20 sm:w-24">Price</th>
                      <th className="pb-2 text-[9px] font-bold uppercase tracking-widest text-[#202687] text-right w-24 sm:w-28">Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {processedProducts.filter(p => p.productName.trim() !== "").length > 0 ? (
                      processedProducts.filter(p => p.productName.trim() !== "").map((p, i) => (
                        <tr key={i} className="transition-colors">
                          <td className="py-3 pr-2 sm:pr-4">
                            <p className="font-bold text-[13px] text-[#111] leading-snug">{p.productName}</p>
                          </td>
                          <td className="py-3 text-center font-bold text-gray-600 text-[13px]">{p.qty}</td>
                          <td className="py-3 text-right font-bold text-gray-600 text-[13px]">₹{p.price}</td>
                          <td className="py-3 text-right font-bold text-[#111] text-[13px]">₹{p.total}</td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="4" className="py-8 text-center text-xs font-semibold text-gray-400">No items added to the invoice yet.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {/* Totals Section */}
              <div className="ml-auto w-full sm:w-2/3 lg:w-3/4 pt-2 border-t-2 border-[#111]"> 
                <div className="space-y-2 mt-3">
                  <div className="flex justify-between items-center text-xs font-bold text-gray-500 uppercase tracking-wider">
                    <span>Subtotal</span>
                    <span className="text-[#111]">₹{subtotal}</span>
                  </div>
                  <div className="flex justify-between items-center text-xs font-bold text-gray-500 uppercase tracking-wider">
                    <span>Shipping</span>
                    <span className="text-[#111]">{effectiveShipping === 0 ? "Free" : `₹${effectiveShipping}`}</span>
                  </div>
                  <div className="pt-2 mt-2 flex justify-between items-end border-t border-gray-100">
                    <span className="text-[10px] font-bold text-[#202687] uppercase tracking-widest mb-1">Grand Total</span>
                    <span className="text-3xl font-black text-[#111] tracking-tighter">₹{grandTotal}</span>
                  </div>
                </div>
              </div>
              <h3 className="text-[8px] font-bold text-gray-400 text-center uppercase tracking-widest mt-8">Thank you for choosing WEHELP</h3> 

              {/* Accent footer Bar */}
              <div className="absolute bottom-0 left-0 w-full h-1.5 sm:p-2 bg-gradient-to-r from-[#111] via-[#322873] to-[#111] rounded-b-[20px]"></div>

            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default Invoice;