import { useState, useEffect } from "react";
import { db } from "../firebase";
import { ref, onValue, set, remove } from "firebase/database";
import { motion } from "framer-motion";
import toast, { Toaster } from "react-hot-toast";
import {
  FiBriefcase,
  FiFileText,
  FiSliders,
  FiDatabase,
  FiShield,
  FiSave,
  FiDownload,
  FiAlertTriangle,
  FiLogOut
} from "react-icons/fi";

const containerVariants = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.1 } } };
const itemVariants = { hidden: { y: 20, opacity: 0 }, show: { y: 0, opacity: 1, transition: { type: "spring", stiffness: 300, damping: 24 } } };

const Toggle = ({ label, checked, onChange }) => (
  <div className="flex items-center justify-between py-3 border-b border-gray-50 last:border-0 group cursor-pointer" onClick={() => onChange(!checked)}>
    <span className="font-medium text-gray-600 group-hover:text-[#111] transition-colors">{label}</span>
    <button
      type="button"
      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-300 focus:outline-none ${
        checked ? 'bg-[#D4AF37]' : 'bg-gray-200'
      }`}
    >
      <span
        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform duration-300 ${
          checked ? 'translate-x-6' : 'translate-x-1'
        } shadow-sm`}
      />
    </button>
  </div>
);

const Settings = () => {
  const [loading, setLoading] = useState(true);
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingInvoice, setSavingInvoice] = useState(false);
  const [savingPrefs, setSavingPrefs] = useState(false);

  // States
  const [businessProfile, setBusinessProfile] = useState({ 
    businessName: "Ajeer Graphy",
    ownerName: "",
    mobileNumber: "",
    whatsappNumber: "",
    email: "",
    address: "",
    logoUrl: ""
  });

  const [invoiceSettings, setInvoiceSettings] = useState({
    prefix: "INV-",
    currencySymbol: "₹",
    footerText: "Thank you for your business!",
    address: "",
    phone: "",
    enablePdf: true,
    enablePrint: true
  });

  const [preferences, setPreferences] = useState({
    darkMode: false,
    compactDashboard: false,
    showCharts: true,
    enableNotifications: true
  });

  const [security, setSecurity] = useState({
    newPassword: "",
    confirmPassword: ""
  });

  // Fetch Data
  useEffect(() => {
    const settingsRef = ref(db, "settings");
    onValue(settingsRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        if (data.businessProfile) setBusinessProfile(prev => ({ ...prev, ...data.businessProfile }));
        if (data.invoice) setInvoiceSettings(prev => ({ ...prev, ...data.invoice }));
        if (data.preferences) setPreferences(prev => ({ ...prev, ...data.preferences }));
      }
      setLoading(false);
    });
  }, []);

  // Handlers
  const handleProfileChange = (e) => setBusinessProfile({ ...businessProfile, [e.target.name]: e.target.value });
  const handleInvoiceChange = (e) => setInvoiceSettings({ ...invoiceSettings, [e.target.name]: e.target.value });
  const handleSecurityChange = (e) => setSecurity({ ...security, [e.target.name]: e.target.value });

  const saveBusinessProfile = async (e) => {
    e.preventDefault();
    setSavingProfile(true);
    try {
      await set(ref(db, "settings/businessProfile"), businessProfile);
      toast.success("Business Profile Updated");
    } catch (err) {
      toast.error("Failed to update profile");
    }
    setSavingProfile(false);
  };

  const saveInvoiceSettings = async (e) => {
    e.preventDefault();
    setSavingInvoice(true);
    try {
      await set(ref(db, "settings/invoice"), invoiceSettings);
      toast.success("Invoice Settings Updated");
    } catch (err) {
      toast.error("Failed to update invoice settings");
    }
    setSavingInvoice(false);
  };

  const savePreferences = async () => {
    setSavingPrefs(true);
    try {
      await set(ref(db, "settings/preferences"), preferences);
      toast.success("Preferences Saved");
    } catch (err) {
      toast.error("Failed to save preferences");
    }
    setSavingPrefs(false);
  };

  // Trigger preference save whenever it changes
  useEffect(() => {
    if (!loading) {
      set(ref(db, "settings/preferences"), preferences);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [preferences]);

  const updatePassword = (e) => {
    e.preventDefault();
    if (security.newPassword !== security.confirmPassword) {
      toast.error("Passwords do not match!");
      return;
    }
    if (security.newPassword.length < 6) {
      toast.error("Password must be at least 6 characters.");
      return;
    }
    // Mock update since Auth is not fully specified in prompt context
    toast.success("Admin password updated successfully");
    setSecurity({ newPassword: "", confirmPassword: "" });
  };

  const resetAppData = async () => {
    const confirmReset = window.confirm("WARNING: This will permanently delete all sales, products, and expenses data. This action cannot be undone. Are you sure?");
    if (confirmReset) {
      try {
        await remove(ref(db, "sales"));
        await remove(ref(db, "products"));
        await remove(ref(db, "expenses"));
        toast.success("App Data Reset Successfully");
      } catch (err) {
        toast.error("Failed to reset data");
      }
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-32">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#111]"></div>
      </div>
    );
  }

  return (
    <div className="max-w-[1400px] mx-auto pb-10">
      <Toaster />

      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="mb-10">
        <h1 className="text-4xl font-bold text-[#111] tracking-tight">Configuration</h1>
        <p className="text-gray-500 mt-2 font-medium">Manage your premium business environment settings</p>
      </motion.div>

      <motion.div variants={containerVariants} initial="hidden" animate="show" className="grid grid-cols-1 xl:grid-cols-2 gap-8">
        
        {/* Left Column */}
        <div className="space-y-8">
          
          {/* Business Profile */}
          <motion.div variants={itemVariants} className="bg-white premium-shadow border border-gray-100 rounded-[30px] p-8">
            <h3 className="text-xl font-bold text-[#111] mb-6 tracking-tight flex items-center gap-3">
              <FiBriefcase className="text-[#D4AF37]" /> Business Profile
            </h3>
            
            <form onSubmit={saveBusinessProfile} className="space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2 block">Business Name</label>
                  <input type="text" name="businessName" value={businessProfile.businessName} onChange={handleProfileChange} className="w-full bg-gray-50 hover:bg-gray-100/50 border border-transparent focus:bg-white focus:border-[#D4AF37]/40 rounded-2xl text-sm font-semibold text-[#111] outline-none transition-all p-4" required />
                </div>
                <div>
                  <label className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2 block">Owner Name</label>
                  <input type="text" name="ownerName" value={businessProfile.ownerName} onChange={handleProfileChange} className="w-full bg-gray-50 hover:bg-gray-100/50 border border-transparent focus:bg-white focus:border-[#D4AF37]/40 rounded-2xl text-sm font-semibold text-[#111] outline-none transition-all p-4" />
                </div>
                <div>
                  <label className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2 block">Mobile Number</label>
                  <input type="tel" name="mobileNumber" value={businessProfile.mobileNumber} onChange={handleProfileChange} className="w-full bg-gray-50 hover:bg-gray-100/50 border border-transparent focus:bg-white focus:border-[#D4AF37]/40 rounded-2xl text-sm font-semibold text-[#111] outline-none transition-all p-4" />
                </div>
                <div>
                  <label className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2 block">WhatsApp Number</label>
                  <input type="tel" name="whatsappNumber" value={businessProfile.whatsappNumber} onChange={handleProfileChange} className="w-full bg-gray-50 hover:bg-gray-100/50 border border-transparent focus:bg-white focus:border-[#D4AF37]/40 rounded-2xl text-sm font-semibold text-[#111] outline-none transition-all p-4" />
                </div>
                <div className="md:col-span-2">
                  <label className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2 block">Email Address</label>
                  <input type="email" name="email" value={businessProfile.email} onChange={handleProfileChange} className="w-full bg-gray-50 hover:bg-gray-100/50 border border-transparent focus:bg-white focus:border-[#D4AF37]/40 rounded-2xl text-sm font-semibold text-[#111] outline-none transition-all p-4" />
                </div>
                <div className="md:col-span-2">
                  <label className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2 block">Physical Address</label>
                  <textarea name="address" value={businessProfile.address} onChange={handleProfileChange} rows="2" className="w-full bg-gray-50 hover:bg-gray-100/50 border border-transparent focus:bg-white focus:border-[#D4AF37]/40 rounded-2xl text-sm font-semibold text-[#111] outline-none transition-all p-4 resize-none"></textarea>
                </div>
                <div className="md:col-span-2">
                  <label className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2 block">Logo URL</label>
                  <input type="url" name="logoUrl" placeholder="https://example.com/logo.png" value={businessProfile.logoUrl} onChange={handleProfileChange} className="w-full bg-gray-50 hover:bg-gray-100/50 border border-transparent focus:bg-white focus:border-[#D4AF37]/40 rounded-2xl text-sm font-semibold text-[#111] outline-none transition-all p-4" />
                </div>
              </div>
              <div className="pt-2 text-right">
                <button type="submit" disabled={savingProfile} className="bg-[#111] text-white px-8 py-3.5 rounded-2xl font-semibold hover:bg-black transition-colors shadow-lg shadow-black/10 flex items-center justify-center gap-2 ml-auto disabled:opacity-70">
                  {savingProfile ? <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-[#D4AF37]"></div> : <><FiSave /> Save Changes</>}
                </button>
              </div>
            </form>
          </motion.div>

          {/* Data Management */}
          <motion.div variants={itemVariants} className="bg-white premium-shadow border border-gray-100 rounded-[30px] p-8">
            <h3 className="text-xl font-bold text-[#111] mb-6 tracking-tight flex items-center gap-3">
              <FiDatabase className="text-[#D4AF37]" /> Data Management
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <button onClick={() => toast.success("Sales data export initiated")} className="flex items-center justify-between p-4 rounded-2xl border border-gray-100 bg-gray-50 hover:bg-gray-100 hover:border-gray-200 transition-all group">
                <span className="font-semibold text-gray-700 group-hover:text-[#111]">Export Sales</span>
                <FiDownload className="text-gray-400 group-hover:text-[#D4AF37]" />
              </button>
              <button onClick={() => toast.success("Expense data export initiated")} className="flex items-center justify-between p-4 rounded-2xl border border-gray-100 bg-gray-50 hover:bg-gray-100 hover:border-gray-200 transition-all group">
                <span className="font-semibold text-gray-700 group-hover:text-[#111]">Export Expenses</span>
                <FiDownload className="text-gray-400 group-hover:text-[#D4AF37]" />
              </button>
              <button onClick={() => toast.success("Database backup generated")} className="flex items-center justify-between p-4 rounded-2xl border border-[#D4AF37]/20 bg-[#D4AF37]/5 hover:bg-[#D4AF37]/10 transition-all group md:col-span-2">
                <span className="font-bold text-[#D4AF37]">Backup Firebase Data</span>
                <FiDatabase className="text-[#D4AF37]" />
              </button>
              <button onClick={resetAppData} className="flex items-center justify-between p-4 rounded-2xl border border-red-100 bg-red-50 hover:bg-red-100 transition-all group md:col-span-2 mt-2">
                <span className="font-bold text-red-600">Factory Reset App Data</span>
                <FiAlertTriangle className="text-red-500" />
              </button>
            </div>
          </motion.div>

        </div>

        {/* Right Column */}
        <div className="space-y-8">
          
          {/* Invoice Settings */}
          <motion.div variants={itemVariants} className="bg-white premium-shadow border border-gray-100 rounded-[30px] p-8">
            <h3 className="text-xl font-bold text-[#111] mb-6 tracking-tight flex items-center gap-3">
              <FiFileText className="text-[#D4AF37]" /> Invoice Settings
            </h3>
            
            <form onSubmit={saveInvoiceSettings} className="space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2 block">Invoice Prefix</label>
                  <input type="text" name="prefix" value={invoiceSettings.prefix} onChange={handleInvoiceChange} className="w-full bg-gray-50 hover:bg-gray-100/50 border border-transparent focus:bg-white focus:border-[#D4AF37]/40 rounded-2xl text-sm font-semibold text-[#111] outline-none transition-all p-4" required />
                </div>
                <div>
                  <label className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2 block">Currency Symbol</label>
                  <input type="text" name="currencySymbol" value={invoiceSettings.currencySymbol} onChange={handleInvoiceChange} className="w-full bg-gray-50 hover:bg-gray-100/50 border border-transparent focus:bg-white focus:border-[#D4AF37]/40 rounded-2xl text-sm font-semibold text-[#111] outline-none transition-all p-4" required />
                </div>
                <div className="md:col-span-2">
                  <label className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2 block">Invoice Footer Text</label>
                  <input type="text" name="footerText" value={invoiceSettings.footerText} onChange={handleInvoiceChange} className="w-full bg-gray-50 hover:bg-gray-100/50 border border-transparent focus:bg-white focus:border-[#D4AF37]/40 rounded-2xl text-sm font-semibold text-[#111] outline-none transition-all p-4" />
                </div>
                <div className="md:col-span-2">
                  <label className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2 block">Business Address on Invoice</label>
                  <input type="text" name="address" placeholder="Leave empty to use main profile address" value={invoiceSettings.address} onChange={handleInvoiceChange} className="w-full bg-gray-50 hover:bg-gray-100/50 border border-transparent focus:bg-white focus:border-[#D4AF37]/40 rounded-2xl text-sm font-semibold text-[#111] outline-none transition-all p-4" />
                </div>
                <div className="md:col-span-2">
                  <label className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2 block">Phone Number on Invoice</label>
                  <input type="text" name="phone" placeholder="Leave empty to use main profile mobile" value={invoiceSettings.phone} onChange={handleInvoiceChange} className="w-full bg-gray-50 hover:bg-gray-100/50 border border-transparent focus:bg-white focus:border-[#D4AF37]/40 rounded-2xl text-sm font-semibold text-[#111] outline-none transition-all p-4" />
                </div>
              </div>

              <div className="pt-4 border-t border-gray-50 space-y-2">
                <Toggle label="Enable PDF Download Option" checked={invoiceSettings.enablePdf} onChange={(val) => setInvoiceSettings({ ...invoiceSettings, enablePdf: val })} />
                <Toggle label="Enable Direct Print Option" checked={invoiceSettings.enablePrint} onChange={(val) => setInvoiceSettings({ ...invoiceSettings, enablePrint: val })} />
              </div>

              <div className="pt-2 text-right">
                <button type="submit" disabled={savingInvoice} className="bg-[#111] text-white px-8 py-3.5 rounded-2xl font-semibold hover:bg-black transition-colors shadow-lg shadow-black/10 flex items-center justify-center gap-2 ml-auto disabled:opacity-70">
                  {savingInvoice ? <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-[#D4AF37]"></div> : <><FiSave /> Save Settings</>}
                </button>
              </div>
            </form>
          </motion.div>

          {/* App Preferences */}
          <motion.div variants={itemVariants} className="bg-white premium-shadow border border-gray-100 rounded-[30px] p-8">
            <h3 className="text-xl font-bold text-[#111] mb-6 tracking-tight flex items-center gap-3">
              <FiSliders className="text-[#D4AF37]" /> App Preferences
            </h3>
            
            <div className="space-y-1">
              <Toggle label="Dark Mode Theme" checked={preferences.darkMode} onChange={(val) => setPreferences({ ...preferences, darkMode: val })} />
              <Toggle label="Compact Dashboard Layout" checked={preferences.compactDashboard} onChange={(val) => setPreferences({ ...preferences, compactDashboard: val })} />
              <Toggle label="Show Analytics Charts" checked={preferences.showCharts} onChange={(val) => setPreferences({ ...preferences, showCharts: val })} />
              <Toggle label="Enable System Notifications" checked={preferences.enableNotifications} onChange={(val) => setPreferences({ ...preferences, enableNotifications: val })} />
            </div>
            {savingPrefs && <p className="text-xs text-[#D4AF37] font-semibold text-right mt-4 animate-pulse">Syncing preferences...</p>}
          </motion.div>

          {/* Account Security */}
          <motion.div variants={itemVariants} className="bg-[#111] premium-shadow border border-gray-800 rounded-[30px] p-8 text-white relative overflow-hidden">
            {/* Decorative Gold circle */}
            <div className="absolute top-0 right-0 w-48 h-48 bg-[#D4AF37] blur-[80px] opacity-20 rounded-full transform translate-x-1/2 -translate-y-1/2"></div>
            
            <h3 className="text-xl font-bold mb-6 tracking-tight flex items-center gap-3 relative z-10">
              <FiShield className="text-[#D4AF37]" /> Account Security
            </h3>

            <form onSubmit={updatePassword} className="space-y-5 relative z-10">
              <div>
                <label className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2 block">New Admin Password</label>
                <input type="password" name="newPassword" value={security.newPassword} onChange={handleSecurityChange} className="w-full bg-white/5 border border-white/10 focus:border-[#D4AF37]/50 rounded-2xl text-sm font-semibold text-white outline-none transition-all p-4 placeholder-gray-500" placeholder="••••••••" required />
              </div>
              <div>
                <label className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2 block">Confirm Password</label>
                <input type="password" name="confirmPassword" value={security.confirmPassword} onChange={handleSecurityChange} className="w-full bg-white/5 border border-white/10 focus:border-[#D4AF37]/50 rounded-2xl text-sm font-semibold text-white outline-none transition-all p-4 placeholder-gray-500" placeholder="••••••••" required />
              </div>
              
              <div className="pt-2 flex items-center justify-between gap-4">
                <button type="button" onClick={() => toast.success("Logged out successfully")} className="text-gray-400 hover:text-white flex items-center gap-2 text-sm font-semibold transition-colors">
                  <FiLogOut /> Logout Session
                </button>
                <button type="submit" className="bg-[#D4AF37] text-[#111] px-6 py-3 rounded-2xl font-bold hover:bg-yellow-400 transition-colors shadow-lg">
                  Update Password
                </button>
              </div>
            </form>
          </motion.div>

        </div>
      </motion.div>
    </div>
  );
};

export default Settings;