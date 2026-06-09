import { useEffect, useState } from "react";
import { db } from "../firebase";
import { ref, onValue, update, remove } from "firebase/database";
import { motion } from "framer-motion";
import {
  FiPackage,
  FiX,
  FiAlertTriangle,
  FiSave,
  FiImage
} from "react-icons/fi";
import ProductCard from "../components/ProductCard";
import toast, { Toaster } from "react-hot-toast";

const containerVariants = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.05 } } };
const itemVariants = { hidden: { y: 20, opacity: 0 }, show: { y: 0, opacity: 1, transition: { type: "spring", stiffness: 300, damping: 24 } } };

const Products = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingProduct, setEditingProduct] = useState(null);
  const [deletingProductId, setDeletingProductId] = useState(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const productRef = ref(db, "products");

    onValue(productRef, (snapshot) => {
      const data = snapshot.val();

      if (data) {
        const loadedProducts = Object.keys(data).map((key) => ({
          id: key,
          ...data[key],
        }));

        setProducts(loadedProducts);
      } else {
        setProducts([]);
      }

      setLoading(false);
    });
  }, []);

  // Handle Update
  const handleUpdate = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const updates = {
        productName: editingProduct.productName,
        category: editingProduct.category,
        sellingPrice: Number(editingProduct.sellingPrice),
        stock: Number(editingProduct.stock),
        description: editingProduct.description || "",
        status: editingProduct.status || "Available",
        featured: editingProduct.featured || false,
        image: editingProduct.image || ""
      };
      await update(ref(db, `products/${editingProduct.id}`), updates);
      toast.success("Product Updated Successfully");
      setEditingProduct(null);
    } catch (error) {
      toast.error("Failed to update product");
      console.error(error);
    }
    setSaving(false);
  };

  // Handle Delete
  const handleDelete = async () => {
    try {
      await remove(ref(db, `products/${deletingProductId}`));
      toast.success("Product Deleted Successfully");
      setDeletingProductId(null);
    } catch (error) {
      toast.error("Failed to delete product");
      console.error(error);
    }
  };

  // Image to Base64 (For Edit Modal)
  const handleEditImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setEditingProduct({ ...editingProduct, image: reader.result });
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="max-w-[1400px] mx-auto pb-10">
      <Toaster />
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="mb-10">
        <h1 className="text-4xl font-bold text-[#111] tracking-tight">Collection</h1>
        <p className="text-gray-500 mt-2 font-medium">Manage Products inventory</p>
      </motion.div>

      {/* Loading */}
      {loading ? (
        <div className="flex justify-center items-center py-32">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#111]"></div>
        </div>
      ) : products.length === 0 ? (
        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="bg-white border border-gray-100 premium-shadow rounded-3xl p-16 text-center max-w-2xl mx-auto">
          <div className="w-24 h-24 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-6">
            <FiPackage className="text-4xl text-gray-400" />
          </div>
          <h2 className="text-2xl font-bold text-[#111]">No Collection Found</h2>
          <p className="text-gray-500 mt-3 mb-8">Begin curating your premium inventory catalogue.</p>
          <a href="/add-product" className="inline-block bg-[#111] text-[#D4AF37] px-8 py-3.5 rounded-full font-bold hover:bg-black transition-colors shadow-lg shadow-black/20">
            Add First Product
          </a>
        </motion.div>
      ) : (
        <motion.div variants={containerVariants} initial="hidden" animate="show" className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {products.map((product) => (
            <motion.div
              variants={itemVariants}
              key={product.id}
            >
              <ProductCard 
                product={product} 
                onEdit={(p) => setEditingProduct(p)} 
                onDelete={(id) => setDeletingProductId(id)} 
              />
            </motion.div>
          ))}
        </motion.div>
      )}

      {/* EDIT MODAL */}
      {editingProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="bg-white rounded-[30px] p-8 w-full max-w-2xl max-h-[90vh] overflow-y-auto custom-scrollbar relative">
            <button onClick={() => setEditingProduct(null)} className="absolute top-6 right-6 text-gray-400 hover:text-[#111] bg-gray-50 hover:bg-gray-100 rounded-full p-2 transition-colors">
              <FiX className="text-xl" />
            </button>
            <h2 className="text-2xl font-bold text-[#111] mb-6">Edit Product</h2>
            
            <form onSubmit={handleUpdate} className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="md:col-span-2 flex flex-col items-center mb-4">
                <div className="w-32 h-32 bg-gray-50 rounded-2xl border-2 border-dashed border-gray-200 flex flex-col items-center justify-center relative overflow-hidden group hover:border-[#D4AF37]/50 transition-colors">
                  {editingProduct.image ? (
                    <img src={editingProduct.image} alt="Preview" className="w-full h-full object-cover" />
                  ) : (
                    <FiImage className="text-3xl text-gray-400" />
                  )}
                  <input type="file" accept="image/*" onChange={handleEditImageUpload} className="absolute inset-0 opacity-0 cursor-pointer w-full h-full" />
                </div>
                <span className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-3">Tap image to change</span>
              </div>

              <div>
                <label className="text-xs font-bold text-gray-400 uppercase tracking-widest block mb-1">Product Name</label>
                <input type="text" value={editingProduct.productName} onChange={(e) => setEditingProduct({...editingProduct, productName: e.target.value})} className="w-full bg-gray-50 border border-transparent focus:bg-white focus:border-[#D4AF37]/40 rounded-xl text-sm font-semibold text-[#111] p-3 outline-none transition-all" required />
              </div>
              <div>
                <label className="text-xs font-bold text-gray-400 uppercase tracking-widest block mb-1">Category</label>
                <select value={editingProduct.category} onChange={(e) => setEditingProduct({...editingProduct, category: e.target.value})} className="w-full bg-gray-50 border border-transparent focus:bg-white focus:border-[#D4AF37]/40 rounded-xl text-sm font-semibold text-[#111] p-3 outline-none transition-all" required>
                  <option value="Niqab">Niqab</option>
                  <option value="Shawl">Shawl</option>
                </select>
              </div>
              <div>
                <label className="text-xs font-bold text-gray-400 uppercase tracking-widest block mb-1">Selling Price (₹)</label>
                <input type="number" min="0" value={editingProduct.sellingPrice} onChange={(e) => setEditingProduct({...editingProduct, sellingPrice: e.target.value})} className="w-full bg-gray-50 border border-transparent focus:bg-white focus:border-[#D4AF37]/40 rounded-xl text-sm font-semibold text-[#111] p-3 outline-none transition-all" required />
              </div>
              <div>
                <label className="text-xs font-bold text-gray-400 uppercase tracking-widest block mb-1">Stock</label>
                <input type="number" min="0" value={editingProduct.stock} onChange={(e) => setEditingProduct({...editingProduct, stock: e.target.value})} className="w-full bg-gray-50 border border-transparent focus:bg-white focus:border-[#D4AF37]/40 rounded-xl text-sm font-semibold text-[#111] p-3 outline-none transition-all" required />
              </div>
              <div>
                <label className="text-xs font-bold text-gray-400 uppercase tracking-widest block mb-1">Status</label>
                <select value={editingProduct.status || "Available"} onChange={(e) => setEditingProduct({...editingProduct, status: e.target.value})} className="w-full bg-gray-50 border border-transparent focus:bg-white focus:border-[#D4AF37]/40 rounded-xl text-sm font-semibold text-[#111] p-3 outline-none transition-all">
                  <option value="Available">Available</option>
                  <option value="Out of Stock">Out of Stock</option>
                </select>
              </div>
              <div className="flex items-center justify-between bg-gray-50 p-3 rounded-xl">
                <span className="text-xs font-bold text-gray-600 uppercase tracking-widest">Featured</span>
                <input type="checkbox" checked={editingProduct.featured || false} onChange={(e) => setEditingProduct({...editingProduct, featured: e.target.checked})} className="w-5 h-5 accent-[#D4AF37] cursor-pointer" />
              </div>
              <div className="md:col-span-2">
                <label className="text-xs font-bold text-gray-400 uppercase tracking-widest block mb-1">Description</label>
                <textarea value={editingProduct.description || ""} onChange={(e) => setEditingProduct({...editingProduct, description: e.target.value})} rows="2" className="w-full bg-gray-50 border border-transparent focus:bg-white focus:border-[#D4AF37]/40 rounded-xl text-sm font-semibold text-[#111] p-3 outline-none transition-all resize-none"></textarea>
              </div>
              
              <div className="md:col-span-2 pt-4 flex gap-4">
                <button type="button" onClick={() => setEditingProduct(null)} className="flex-1 bg-gray-100 text-gray-600 py-4 rounded-xl font-bold hover:bg-gray-200 transition-colors">Cancel</button>
                <button type="submit" disabled={saving} className="flex-1 bg-[#111] text-[#D4AF37] py-4 rounded-xl font-bold hover:bg-black transition-colors flex justify-center items-center gap-2 disabled:opacity-70">
                  {saving ? <div className="w-5 h-5 border-2 border-[#D4AF37] border-t-transparent rounded-full animate-spin"></div> : <><FiSave /> Save Changes</>}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}

      {/* DELETE CONFIRMATION MODAL */}
      {deletingProductId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="bg-white rounded-[30px] p-8 w-full max-w-md text-center">
            <div className="w-20 h-20 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto mb-6">
              <FiAlertTriangle className="text-4xl" />
            </div>
            <h2 className="text-2xl font-bold text-[#111] mb-2">Delete Product?</h2>
            <p className="text-gray-500 mb-8 font-medium">Are you sure you want to permanently delete this product? This action cannot be undone.</p>
            <div className="flex gap-4">
              <button onClick={() => setDeletingProductId(null)} className="flex-1 bg-gray-100 text-gray-600 py-3.5 rounded-xl font-bold hover:bg-gray-200 transition-colors">Cancel</button>
              <button onClick={handleDelete} className="flex-1 bg-red-500 text-white py-3.5 rounded-xl font-bold hover:bg-red-600 transition-colors shadow-lg shadow-red-500/30">Delete</button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
};

export default Products;