import { useState, useEffect, useCallback } from "react";
import { productAPI } from "../../services/api";
import toast from "react-hot-toast";

export default function SellerMyProducts() {
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
      const params = {
        page,
        per_page: 10,
      };

      if (search) {
        params.search = search;
      }

      const res = await productAPI.getMyProducts(params);

      setProducts(res.data.products);
      setPagination(res.data.pagination);
    } catch (err) {
      console.error("Failed to fetch products:", err);
      toast.error("Failed to load your products");
    } finally {
      setLoading(false);
    }
  }, [search, page]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  const openCreateModal = () => {
    setEditingProduct(null);

    setFormData({
      name: "",
      description: "",
      category: "",
      price: "",
      discount_percent: "0",
      stock: "",
      image_url: "",
    });

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
      price: product.original_price
        ? product.original_price.toString()
        : product.price?.toString() || "",
      discount_percent: product.discount_percent
        ? product.discount_percent.toString()
        : "0",
      stock: product.stock?.toString() || "",
      image_url: product.image_url || "",
    });

    setFormErrors({});
    setImageFile(null);
    setImagePreview(product.image_url || "");
    setShowModal(true);
  };

  const handleChange = (field) => (e) => {
    setFormData((prev) => ({
      ...prev,
      [field]: e.target.value,
    }));

    if (formErrors[field]) {
      setFormErrors((prev) => ({
        ...prev,
        [field]: "",
      }));
    }
  };

  const validateForm = () => {
    const errors = {};

    if (!formData.name.trim()) {
      errors.name = "Product name is required.";
    }

    if (
      !formData.price ||
      isNaN(parseFloat(formData.price)) ||
      parseFloat(formData.price) < 0
    ) {
      errors.price = "Valid price is required.";
    }

    if (
      formData.stock === "" ||
      isNaN(parseInt(formData.stock)) ||
      parseInt(formData.stock) < 0
    ) {
      errors.stock = "Valid stock is required.";
    }

    if (
      formData.discount_percent &&
      (isNaN(parseFloat(formData.discount_percent)) ||
        parseFloat(formData.discount_percent) < 0 ||
        parseFloat(formData.discount_percent) > 100)
    ) {
      errors.discount_percent =
        "Discount percentage must be between 0 and 100.";
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
        toast.loading("Uploading image...", {
          id: "upload",
        });

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
      const msg =
        err.response?.data?.message ||
        "Operation failed.";

      toast.error(msg);

      if (err.response?.data?.errors) {
        setFormErrors(err.response.data.errors);
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (product) => {
    if (
      !window.confirm(
        `Are you sure you want to delete "${product.name}"?`
      )
    ) {
      return;
    }

    try {
      await productAPI.deleteProduct(product.id);

      toast.success("Product deleted successfully!");

      fetchProducts();
    } catch (err) {
      toast.error(
        err.response?.data?.message ||
          "Failed to delete product."
      );
    }
  };

  const toggleActive = async (product) => {
    try {
      await productAPI.toggleActive(
        product.id,
        !product.is_active
      );

      toast.success(
        `Product ${
          product.is_active ? "hidden" : "published"
        }.`
      );

      fetchProducts();
    } catch (err) {
      toast.error(
        err.response?.data?.message ||
          "Could not update product visibility."
      );
    }
  };

  return (
    <div className="w-full min-w-0 overflow-x-hidden">
      {/* =====================================================
          PAGE HEADER
      ====================================================== */}
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <h2 className="text-xl font-bold text-slate-800 sm:text-2xl">
            My Products
          </h2>

          <p className="mt-1 text-xs text-slate-500 sm:text-sm">
            Manage your product catalog and discounts
          </p>
        </div>

        <button
          onClick={openCreateModal}
          className="w-full shrink-0 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-blue-700 cursor-pointer sm:w-auto"
        >
          + Add Product
        </button>
      </div>

      {/* =====================================================
          SEARCH
      ====================================================== */}
      <div className="mb-4">
        <input
          type="text"
          placeholder="Search your products..."
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(1);
          }}
          className="w-full rounded-lg border border-slate-300 px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-500/40 sm:max-w-sm"
        />
      </div>

      {/* =====================================================
          TABLE
      ====================================================== */}
      {loading ? (
        <div className="flex justify-center py-12">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-500 border-t-transparent" />
        </div>
      ) : products.length === 0 ? (
        <div className="py-12 text-center text-sm text-slate-400">
          No products yet. Start by adding one!
        </div>
      ) : (
        <div className="w-full overflow-hidden rounded-xl border border-slate-200 bg-white">
          <div className="w-full overflow-x-auto">
            <table className="min-w-[900px] w-full text-sm">
              <thead className="border-b border-slate-200 bg-slate-50">
                <tr>
                  <th className="px-4 py-3 text-left font-medium text-slate-600">
                    ID
                  </th>

                  <th className="px-4 py-3 text-left font-medium text-slate-600">
                    Name
                  </th>

                  <th className="px-4 py-3 text-left font-medium text-slate-600">
                    Category
                  </th>

                  <th className="px-4 py-3 text-right font-medium text-slate-600">
                    Price
                  </th>

                  <th className="px-4 py-3 text-center font-medium text-slate-600">
                    Discount
                  </th>

                  <th className="px-4 py-3 text-right font-medium text-slate-600">
                    Stock
                  </th>

                  <th className="px-4 py-3 text-center font-medium text-slate-600">
                    Active
                  </th>

                  <th className="px-4 py-3 text-right font-medium text-slate-600">
                    Actions
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100">
                {products.map((product) => (
                  <tr
                    key={product.id}
                    className="hover:bg-slate-50"
                  >
                    <td className="px-4 py-3 text-slate-500">
                      #{product.id}
                    </td>

                    <td className="px-4 py-3 font-medium text-slate-700">
                      {product.name}
                    </td>

                    <td className="px-4 py-3 text-slate-500">
                      {product.category || "-"}
                    </td>

                    <td className="px-4 py-3 text-right">
                      <div className="font-bold text-slate-900">
                        &#8377;
                        {product.price?.toFixed(2)}
                      </div>

                      {product.discount_percent > 0 &&
                        product.original_price >
                          product.price && (
                          <div className="text-xs text-slate-400 line-through">
                            &#8377;
                            {product.original_price?.toFixed(2)}
                          </div>
                        )}
                    </td>

                    <td className="px-4 py-3 text-center">
                      {product.discount_percent > 0 ? (
                        <span className="rounded-full bg-rose-100 px-2 py-0.5 text-xs font-bold text-rose-700">
                          {product.discount_percent}% OFF
                        </span>
                      ) : (
                        <span className="text-xs text-slate-400">
                          None
                        </span>
                      )}
                    </td>

                    <td className="px-4 py-3 text-right">
                      <span
                        className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                          product.stock > 0
                            ? "bg-green-100 text-green-700"
                            : "bg-red-100 text-red-700"
                        }`}
                      >
                        {product.stock}
                      </span>
                    </td>

                    <td className="px-4 py-3 text-center">
                      <button
                        onClick={() =>
                          toggleActive(product)
                        }
                        className={`cursor-pointer rounded-full px-2.5 py-1 text-xs font-semibold ${
                          product.is_active
                            ? "border border-emerald-200 bg-emerald-50 text-emerald-700"
                            : "border border-slate-200 bg-slate-100 text-slate-600"
                        }`}
                      >
                        {product.is_active
                          ? "Published"
                          : "Hidden"}
                      </button>
                    </td>

                    <td className="whitespace-nowrap px-4 py-3 text-right">
                      <button
                        onClick={() =>
                          openEditModal(product)
                        }
                        className="mr-3 cursor-pointer font-medium text-blue-600 hover:text-blue-800"
                      >
                        Edit
                      </button>

                      <button
                        onClick={() =>
                          handleDelete(product)
                        }
                        className="cursor-pointer font-medium text-red-600 hover:text-red-800"
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

      {/* =====================================================
          CREATE / EDIT MODAL
      ====================================================== */}
      {showModal && (
        <div
          className="
            fixed
            inset-0
            z-[100]
            flex
            items-start
            justify-center
            overflow-y-auto
            overscroll-contain
            bg-black/50
            p-2
            sm:items-center
            sm:p-4
          "
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) {
              setShowModal(false);
            }
          }}
        >
          {/* =================================================
              MODAL CONTAINER
          ================================================== */}
          <div
            className="
              my-2
              flex
              w-full
              max-w-lg
              flex-col
              overflow-hidden
              rounded-xl
              bg-white
              shadow-2xl
              sm:my-4
              sm:max-w-xl
              sm:rounded-2xl

              max-h-[calc(100dvh-1rem)]
              sm:max-h-[calc(100dvh-2rem)]
            "
            onMouseDown={(e) => e.stopPropagation()}
          >
            {/* =================================================
                MODAL HEADER
            ================================================== */}
            <div
              className="
                flex
                shrink-0
                items-center
                justify-between
                gap-3
                border-b
                border-slate-200
                bg-white
                px-4
                py-4
                sm:px-6
              "
            >
              <h3 className="min-w-0 truncate text-base font-bold text-slate-800 sm:text-lg">
                {editingProduct
                  ? "Edit Product"
                  : "Add Product"}
              </h3>

              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="
                  flex
                  h-8
                  w-8
                  shrink-0
                  cursor-pointer
                  items-center
                  justify-center
                  rounded-lg
                  text-slate-500
                  transition
                  hover:bg-slate-100
                  hover:text-slate-800
                "
                aria-label="Close modal"
              >
                ✕
              </button>
            </div>

            {/* =================================================
                MODAL BODY
                IMPORTANT:
                min-h-0 + flex-1 + overflow-y-auto
                makes only this section scroll.
            ================================================== */}
            <div
              className="
                min-h-0
                flex-1
                overflow-y-auto
                overscroll-contain
                px-4
                py-4
                sm:px-6
                sm:py-5
              "
            >
              <form
                onSubmit={handleSubmit}
                className="space-y-4"
              >
                {/* NAME */}
                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-700">
                    Name *
                  </label>

                  <input
                    type="text"
                    value={formData.name}
                    onChange={handleChange("name")}
                    className={`w-full min-w-0 rounded-lg border px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-500/40 ${
                      formErrors.name
                        ? "border-red-400"
                        : "border-slate-300"
                    }`}
                  />

                  {formErrors.name && (
                    <p className="mt-1 text-xs text-red-500">
                      {formErrors.name}
                    </p>
                  )}
                </div>

                {/* PRICE + DISCOUNT */}
                <div className="grid min-w-0 grid-cols-1 gap-4 sm:grid-cols-2">
                  <div className="min-w-0">
                    <label className="mb-1 block text-sm font-medium text-slate-700">
                      Original Price (₹) *
                    </label>

                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={formData.price}
                      onChange={handleChange("price")}
                      className={`w-full min-w-0 rounded-lg border px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-500/40 ${
                        formErrors.price
                          ? "border-red-400"
                          : "border-slate-300"
                      }`}
                    />

                    {formErrors.price && (
                      <p className="mt-1 text-xs text-red-500">
                        {formErrors.price}
                      </p>
                    )}
                  </div>

                  <div className="min-w-0">
                    <label className="mb-1 block text-sm font-medium text-slate-700">
                      Discount (%)
                    </label>

                    <input
                      type="number"
                      step="1"
                      min="0"
                      max="100"
                      value={formData.discount_percent}
                      onChange={handleChange(
                        "discount_percent"
                      )}
                      placeholder="0 to 100"
                      className={`w-full min-w-0 rounded-lg border px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-500/40 ${
                        formErrors.discount_percent
                          ? "border-red-400"
                          : "border-slate-300"
                      }`}
                    />

                    {formErrors.discount_percent && (
                      <p className="mt-1 text-xs text-red-500">
                        {formErrors.discount_percent}
                      </p>
                    )}
                  </div>
                </div>

                {/* STOCK */}
                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-700">
                    Stock *
                  </label>

                  <input
                    type="number"
                    min="0"
                    value={formData.stock}
                    onChange={handleChange("stock")}
                    className={`w-full min-w-0 rounded-lg border px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-500/40 ${
                      formErrors.stock
                        ? "border-red-400"
                        : "border-slate-300"
                    }`}
                  />

                  {formErrors.stock && (
                    <p className="mt-1 text-xs text-red-500">
                      {formErrors.stock}
                    </p>
                  )}
                </div>

                {/* CATEGORY */}
                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-700">
                    Category
                  </label>

                  <input
                    type="text"
                    value={formData.category}
                    onChange={handleChange("category")}
                    placeholder="e.g. Electronics"
                    className="
                      w-full
                      min-w-0
                      rounded-lg
                      border
                      border-slate-300
                      px-3
                      py-2.5
                      text-sm
                      outline-none
                      focus:ring-2
                      focus:ring-blue-500/40
                    "
                  />
                </div>

                {/* DESCRIPTION */}
                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-700">
                    Description
                  </label>

                  <textarea
                    value={formData.description}
                    onChange={handleChange("description")}
                    rows={4}
                    className="
                      w-full
                      min-w-0
                      resize-none
                      rounded-lg
                      border
                      border-slate-300
                      px-3
                      py-2.5
                      text-sm
                      outline-none
                      focus:ring-2
                      focus:ring-blue-500/40
                    "
                  />
                </div>

                {/* IMAGE */}
                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-700">
                    Product Image
                  </label>

                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp,image/gif"
                    onChange={(e) => {
                      const file =
                        e.target.files?.[0] || null;

                      setImageFile(file);

                      setImagePreview(
                        file
                          ? URL.createObjectURL(file)
                          : formData.image_url
                      );
                    }}
                    className="
                      block
                      w-full
                      min-w-0
                      rounded-lg
                      border
                      border-slate-300
                      px-3
                      py-2
                      text-xs
                      outline-none
                      focus:ring-2
                      focus:ring-blue-500/40
                      sm:text-sm
                    "
                  />

                  <p className="mt-1 text-xs text-slate-500">
                    JPG, PNG, WEBP, or GIF; maximum 5 MB.
                  </p>

                  {formData.image_url && !imageFile && (
                    <p className="mt-1 text-xs text-slate-500">
                      Current image will be kept unless
                      you choose a replacement.
                    </p>
                  )}

                  {imagePreview && (
                    <img
                      src={imagePreview}
                      alt="Product preview"
                      className="
                        mt-3
                        h-20
                        w-20
                        rounded-lg
                        border
                        border-slate-200
                        object-cover
                      "
                    />
                  )}
                </div>

                {/* =================================================
                    BUTTONS
                ================================================== */}
                <div
                  className="
                    flex
                    flex-col-reverse
                    gap-2
                    border-t
                    border-slate-100
                    pt-4
                    sm:flex-row
                    sm:justify-end
                  "
                >
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="
                      w-full
                      cursor-pointer
                      rounded-lg
                      border
                      border-slate-300
                      px-4
                      py-2.5
                      text-sm
                      text-slate-600
                      transition
                      hover:bg-slate-50
                      sm:w-auto
                    "
                  >
                    Cancel
                  </button>

                  <button
                    type="submit"
                    disabled={submitting}
                    className="
                      w-full
                      cursor-pointer
                      rounded-lg
                      bg-blue-600
                      px-4
                      py-2.5
                      text-sm
                      font-medium
                      text-white
                      transition
                      hover:bg-blue-700
                      disabled:cursor-not-allowed
                      disabled:bg-blue-400
                      sm:w-auto
                    "
                  >
                    {submitting
                      ? "Saving..."
                      : editingProduct
                      ? "Update Product"
                      : "Add Product"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
