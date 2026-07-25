import { useState, useEffect, useCallback } from "react";
import { productAPI } from "../../services/api";
import toast from "react-hot-toast";

export default function AdminManageProducts() {
  const [products, setProducts] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);

  // Modal state
  const [showModal, setShowModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    category: "",
    price: "",
    discount_percent: "0",
    stock: "",
    image_url: "",
  });
  const [formErrors, setFormErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState("");

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    try {
      const params = { page, per_page: 10 };
      if (search) params.search = search;
      const res = await productAPI.getProducts(params);
      setProducts(res.data.products);
      setPagination(res.data.pagination);
    } catch (err) {
      console.error("Failed to fetch products:", err);
      toast.error("Failed to load products");
    } finally {
      setLoading(false);
    }
  }, [search, page]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  const openCreateModal = () => {
    setEditingProduct(null);
    setFormData({ name: "", description: "", category: "", price: "", discount_percent: "0", stock: "", image_url: "" });
    setFormErrors({});
    setImageFile(null);
    setImagePreview("");
    setShowModal(true);
  };

  const openEditModal = (product) => {
    setEditingProduct(product);
    setFormData({
      name: product.name || "",
      description: product.description || "",
      category: product.category || "",
      price: product.original_price ? product.original_price.toString() : product.price?.toString() || "",
      discount_percent: product.discount_percent ? product.discount_percent.toString() : "0",
      stock: product.stock?.toString() || "",
      image_url: product.image_url || "",
    });
    setFormErrors({});
    setImageFile(null);
    setImagePreview(product.image_url || "");
    setShowModal(true);
  };

  const handleChange = (field) => (e) => {
    setFormData((prev) => ({ ...prev, [field]: e.target.value }));
    if (formErrors[field]) setFormErrors((prev) => ({ ...prev, [field]: "" }));
  };

  const validateForm = () => {
    const errors = {};
    if (!formData.name.trim()) errors.name = "Product name is required.";
    if (!formData.price || isNaN(parseFloat(formData.price)) || parseFloat(formData.price) < 0) {
      errors.price = "Valid price is required.";
    }
    if (formData.stock === "" || isNaN(parseInt(formData.stock)) || parseInt(formData.stock) < 0) {
      errors.stock = "Valid stock is required.";
    }
    if (formData.discount_percent && (isNaN(parseFloat(formData.discount_percent)) || parseFloat(formData.discount_percent) < 0 || parseFloat(formData.discount_percent) > 100)) {
      errors.discount_percent = "Discount percentage must be between 0 and 100.";
    }
    return errors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errors = validateForm();
    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }

    setSubmitting(true);
    try {
      let imageUrl = formData.image_url.trim() || undefined;
      if (imageFile) {
        toast.loading("Uploading image...", { id: "upload" });
        const uploadRes = await productAPI.uploadImage(imageFile);
        imageUrl = uploadRes.data.image_url;
        toast.dismiss("upload");
      }

      const payload = {
        name: formData.name.trim(),
        description: formData.description.trim() || undefined,
        category: formData.category.trim() || undefined,
        price: parseFloat(formData.price),
        discount_percent: parseFloat(formData.discount_percent || 0),
        stock: parseInt(formData.stock),
        image_url: imageUrl,
      };

      if (editingProduct) {
        await productAPI.updateProduct(editingProduct.id, payload);
        toast.success("Product updated successfully!");
      } else {
        await productAPI.createProduct(payload);
        toast.success("Product created successfully!");
      }

      setShowModal(false);
      fetchProducts();
    } catch (err) {
      const msg = err.response?.data?.message || "Operation failed.";
      toast.error(msg);
      if (err.response?.data?.errors) setFormErrors(err.response.data.errors);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (product) => {
    if (!window.confirm(`Are you sure you want to delete "${product.name}"?`)) return;
    try {
      await productAPI.deleteProduct(product.id);
      toast.success("Product deleted successfully!");
      fetchProducts();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to delete product.");
    }
  };

  const toggleActive = async (product) => {
    try {
      await productAPI.toggleActive(product.id, !product.is_active);
      toast.success(`Product ${product.is_active ? "hidden" : "published"}.`);
      fetchProducts();
    } catch (err) {
      toast.error(err.response?.data?.message || "Could not update product status.");
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-bold text-slate-800">Manage All Products</h2>
          <p className="text-sm text-slate-500">Admin product management & discount controls</p>
        </div>
        <button
          onClick={openCreateModal}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded-lg font-medium transition cursor-pointer"
        >
          + Create Product
        </button>
      </div>

      {/* Search */}
      <div className="mb-4">
        <input
          type="text"
          placeholder="Search products..."
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(1);
          }}
          className="w-full max-w-sm px-4 py-2 border border-slate-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500/40"
        />
      </div>

      {/* Table */}
      {loading ? (
        <div className="flex justify-center py-12">
          <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : products.length === 0 ? (
        <div className="text-center py-12 text-slate-400">No products found.</div>
      ) : (
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="text-left px-4 py-3 font-medium text-slate-600">ID</th>
                  <th className="text-left px-4 py-3 font-medium text-slate-600">Name</th>
                  <th className="text-left px-4 py-3 font-medium text-slate-600">Seller</th>
                  <th className="text-right px-4 py-3 font-medium text-slate-600">Price</th>
                  <th className="text-center px-4 py-3 font-medium text-slate-600">Discount</th>
                  <th className="text-right px-4 py-3 font-medium text-slate-600">Stock</th>
                  <th className="text-center px-4 py-3 font-medium text-slate-600">Status</th>
                  <th className="text-right px-4 py-3 font-medium text-slate-600">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {products.map((product) => (
                  <tr key={product.id} className="hover:bg-slate-50">
                    <td className="px-4 py-3 text-slate-500">#{product.id}</td>
                    <td className="px-4 py-3 font-medium text-slate-700">{product.name}</td>
                    <td className="px-4 py-3 text-slate-500">{product.seller_name || "Admin"}</td>
                    <td className="px-4 py-3 text-right">
                      <div className="font-bold text-slate-900">&#8377;{product.price?.toFixed(2)}</div>
                      {product.discount_percent > 0 && product.original_price > product.price && (
                        <div className="text-xs text-slate-400 line-through">&#8377;{product.original_price?.toFixed(2)}</div>
                      )}
                    </td>
                    <td className="px-4 py-3 text-center">
                      {product.discount_percent > 0 ? (
                        <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-rose-100 text-rose-700">
                          {product.discount_percent}% OFF
                        </span>
                      ) : (
                        <span className="text-xs text-slate-400">None</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <span
                        className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                          product.stock > 0 ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
                        }`}
                      >
                        {product.stock}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <button
                        onClick={() => toggleActive(product)}
                        className={`px-2 py-0.5 rounded-full text-xs font-semibold cursor-pointer ${
                          product.is_active
                            ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                            : "bg-slate-100 text-slate-600 border border-slate-200"
                        }`}
                      >
                        {product.is_active ? "Active" : "Disabled"}
                      </button>
                    </td>
                    <td className="px-4 py-3 text-right space-x-2">
                      <button
                        onClick={() => openEditModal(product)}
                        className="text-blue-600 hover:text-blue-800 font-medium cursor-pointer"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(product)}
                        className="text-red-600 hover:text-red-800 font-medium cursor-pointer"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-xl max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-bold text-slate-800 mb-4">
              {editingProduct ? "Edit Product" : "Create Product"}
            </h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Name *</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={handleChange("name")}
                  className={`w-full px-3 py-2 border rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500/40 ${
                    formErrors.name ? "border-red-400" : "border-slate-300"
                  }`}
                />
                {formErrors.name && <p className="text-red-500 text-xs mt-1">{formErrors.name}</p>}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Original Price (₹) *</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.price}
                    onChange={handleChange("price")}
                    className={`w-full px-3 py-2 border rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500/40 ${
                      formErrors.price ? "border-red-400" : "border-slate-300"
                    }`}
                  />
                  {formErrors.price && <p className="text-red-500 text-xs mt-1">{formErrors.price}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Discount (%)</label>
                  <input
                    type="number"
                    step="1"
                    min="0"
                    max="100"
                    value={formData.discount_percent}
                    onChange={handleChange("discount_percent")}
                    placeholder="0 to 100"
                    className={`w-full px-3 py-2 border rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500/40 ${
                      formErrors.discount_percent ? "border-red-400" : "border-slate-300"
                    }`}
                  />
                  {formErrors.discount_percent && <p className="text-red-500 text-xs mt-1">{formErrors.discount_percent}</p>}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Stock *</label>
                <input
                  type="number"
                  min="0"
                  value={formData.stock}
                  onChange={handleChange("stock")}
                  className={`w-full px-3 py-2 border rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500/40 ${
                    formErrors.stock ? "border-red-400" : "border-slate-300"
                  }`}
                />
                {formErrors.stock && <p className="text-red-500 text-xs mt-1">{formErrors.stock}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Category</label>
                <input
                  type="text"
                  value={formData.category}
                  onChange={handleChange("category")}
                  placeholder="e.g. Electronics"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500/40"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Description</label>
                <textarea
                  value={formData.description}
                  onChange={handleChange("description")}
                  rows={3}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500/40 resize-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Product Image</label>
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/gif"
                  onChange={(e) => {
                    const file = e.target.files?.[0] || null;
                    setImageFile(file);
                    setImagePreview(file ? URL.createObjectURL(file) : formData.image_url);
                  }}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500/40"
                />
                <p className="text-xs text-slate-500 mt-1">JPG, PNG, WEBP, or GIF; maximum 5 MB.</p>
                {formData.image_url && !imageFile && <p className="text-xs text-slate-500 mt-1">Current image will be kept unless you choose a replacement.</p>}
                {imagePreview && <img src={imagePreview} alt="Product preview" className="mt-3 h-20 w-20 rounded-lg object-cover border border-slate-200" />}
              </div>

              <div className="flex items-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 text-sm border border-slate-300 rounded-lg text-slate-600 hover:bg-slate-50 transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 text-sm bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white rounded-lg font-medium transition cursor-pointer"
                >
                  {submitting ? "Saving..." : editingProduct ? "Update Product" : "Create Product"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
