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

// =========================================================
// LOCK BODY SCROLL WHEN MODAL IS OPEN
// =========================================================
useEffect(() => {
if (!showModal) return;

const originalOverflow = document.body.style.overflow;
const originalTouchAction = document.body.style.touchAction;

document.body.style.overflow = "hidden";
document.body.style.touchAction = "none";

return () => {
  document.body.style.overflow = originalOverflow;
  document.body.style.touchAction = originalTouchAction;
};

}, [showModal]);

// =========================================================
// FETCH PRODUCTS
// =========================================================
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

// =========================================================
// CREATE MODAL
// =========================================================
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

// =========================================================
// EDIT MODAL
// =========================================================
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

// =========================================================
// CLOSE MODAL
// =========================================================
const closeModal = () => {
if (submitting) return;

setShowModal(false);
setEditingProduct(null);
setFormErrors({});
setImageFile(null);
setImagePreview("");

};

// =========================================================
// HANDLE INPUT
// =========================================================
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

// =========================================================
// VALIDATION
// =========================================================
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
  (
    isNaN(parseFloat(formData.discount_percent)) ||
    parseFloat(formData.discount_percent) < 0 ||
    parseFloat(formData.discount_percent) > 100
  )
) {
  errors.discount_percent =
    "Discount percentage must be between 0 and 100.";
}

return errors;

};

// =========================================================
// SUBMIT
// =========================================================
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
    discount_percent: parseFloat(
      formData.discount_percent || 0
    ),
    stock: parseInt(formData.stock),
    image_url: imageUrl,
  };

  if (editingProduct) {
    await productAPI.updateProduct(
      editingProduct.id,
      payload
    );

    toast.success("Product updated successfully!");
  } else {
    await productAPI.createProduct(payload);

    toast.success("Product created successfully!");
  }

  setShowModal(false);
  setEditingProduct(null);
  fetchProducts();
} catch (err) {
  console.error("Product operation failed:", err);

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

// =========================================================
// DELETE
// =========================================================
const handleDelete = async (product) => {
if (
!window.confirm(
Are you sure you want to delete "${product.name}"?
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

// =========================================================
// TOGGLE ACTIVE
// =========================================================
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

// =========================================================
// ESCAPE KEY
// =========================================================
useEffect(() => {
if (!showModal) return;

const handleKeyDown = (e) => {
  if (e.key === "Escape" && !submitting) {
    closeModal();
  }
};

window.addEventListener("keydown", handleKeyDown);

return () => {
  window.removeEventListener("keydown", handleKeyDown);
};

}, [showModal, submitting]);

return (
<div className="w-full min-w-0 max-w-full overflow-x-hidden">

  {/* =====================================================
      PAGE HEADER
  ====================================================== */}
  <div className="flex flex-col gap-4 mb-6 sm:flex-row sm:items-center sm:justify-between">

    <div className="min-w-0">
      <h2 className="text-xl sm:text-2xl font-bold text-slate-800">
        My Products
      </h2>

      <p className="text-xs sm:text-sm text-slate-500 mt-1">
        Manage your product catalog and discounts
      </p>
    </div>

    <button
      onClick={openCreateModal}
      className="
        w-full
        sm:w-auto
        shrink-0
        px-4
        py-2.5
        bg-blue-600
        hover:bg-blue-700
        text-white
        text-sm
        rounded-xl
        font-semibold
        transition
        cursor-pointer
      "
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
      className="
        w-full
        sm:max-w-sm
        px-4
        py-2.5
        border
        border-slate-300
        rounded-xl
        text-sm
        outline-none
        focus:ring-2
        focus:ring-blue-500/40
        bg-white
      "
    />
  </div>

  {/* =====================================================
      TABLE
  ====================================================== */}
  {loading ? (
    <div className="flex justify-center py-12">
      <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
    </div>
  ) : products.length === 0 ? (
    <div className="text-center py-12 text-slate-400 text-sm">
      No products yet. Start by adding one!
    </div>
  ) : (
    <div className="w-full bg-white rounded-xl border border-slate-200 overflow-hidden">

      <div className="w-full overflow-x-auto">
        <table className="min-w-[900px] w-full text-sm">

          <thead className="bg-slate-50 border-b border-slate-200">
            <tr>

              <th className="text-left px-4 py-3 font-medium text-slate-600">
                ID
              </th>

              <th className="text-left px-4 py-3 font-medium text-slate-600">
                Name
              </th>

              <th className="text-left px-4 py-3 font-medium text-slate-600">
                Category
              </th>

              <th className="text-right px-4 py-3 font-medium text-slate-600">
                Price
              </th>

              <th className="text-center px-4 py-3 font-medium text-slate-600">
                Discount
              </th>

              <th className="text-right px-4 py-3 font-medium text-slate-600">
                Stock
              </th>

              <th className="text-center px-4 py-3 font-medium text-slate-600">
                Active
              </th>

              <th className="text-right px-4 py-3 font-medium text-slate-600">
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
                    ₹{product.price?.toFixed(2)}
                  </div>

                  {product.discount_percent > 0 &&
                    product.original_price >
                      product.price && (
                      <div className="text-xs text-slate-400 line-through">
                        ₹{product.original_price?.toFixed(2)}
                      </div>
                    )}
                </td>

                <td className="px-4 py-3 text-center">

                  {product.discount_percent > 0 ? (
                    <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-rose-100 text-rose-700">
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
                    className={`px-2 py-0.5 rounded-full text-xs font-medium ${
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
                    className={`px-2.5 py-1 rounded-full text-xs font-semibold cursor-pointer ${
                      product.is_active
                        ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                        : "bg-slate-100 text-slate-600 border border-slate-200"
                    }`}
                  >
                    {product.is_active
                      ? "Published"
                      : "Hidden"}
                  </button>

                </td>

                <td className="px-4 py-3 text-right whitespace-nowrap">

                  <button
                    onClick={() =>
                      openEditModal(product)
                    }
                    className="text-blue-600 hover:text-blue-800 font-medium cursor-pointer mr-3"
                  >
                    Edit
                  </button>

                  <button
                    onClick={() =>
                      handleDelete(product)
                    }
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

  {/* =====================================================
      CREATE / EDIT PRODUCT MODAL
      MOBILE FULL SCREEN + INTERNAL SCROLL
  ====================================================== */}

  {showModal && (
    <div
      className="
        fixed
        inset-0
        z-[100]
        w-screen
        h-[100dvh]
        bg-black/50
        flex
        items-center
        justify-center
        p-0
        sm:p-4
      "
      onMouseDown={(e) => {
        if (
          e.target === e.currentTarget &&
          !submitting
        ) {
          closeModal();
        }
      }}
    >

      {/* =================================================
          MODAL CONTAINER
      ================================================== */}

      <div
        className="
          relative
          w-full
          h-full
          max-w-none
          max-h-none
          bg-white
          rounded-none
          shadow-2xl
          overflow-hidden
          flex
          flex-col

          sm:h-auto
          sm:max-h-[90dvh]
          sm:max-w-xl
          sm:rounded-2xl
        "
        onMouseDown={(e) => {
          e.stopPropagation();
        }}
      >

        {/* =================================================
            MODAL HEADER
        ================================================== */}

        <div
          className="
            shrink-0
            flex
            items-center
            justify-between
            gap-3
            px-4
            py-4
            sm:px-6
            sm:py-5
            border-b
            border-slate-200
            bg-white
          "
        >

          <div className="min-w-0">
            <h3 className="text-lg sm:text-xl font-bold text-slate-800 truncate">
              {editingProduct
                ? "Edit Product"
                : "Add Product"}
            </h3>

            <p className="text-xs text-slate-400 mt-0.5">
              {editingProduct
                ? "Update your product details"
                : "Add a new product to your store"}
            </p>
          </div>

          <button
            type="button"
            onClick={closeModal}
            disabled={submitting}
            className="
              shrink-0
              w-9
              h-9
              flex
              items-center
              justify-center
              rounded-full
              text-slate-500
              hover:bg-slate-100
              hover:text-slate-900
              transition
              cursor-pointer
              disabled:opacity-50
              disabled:cursor-not-allowed
            "
            aria-label="Close modal"
          >
            <span className="text-xl leading-none">
              ✕
            </span>
          </button>

        </div>

        {/* =================================================
            SCROLLABLE MODAL BODY
        ================================================== */}

        <div
          className="
            flex-1
            min-h-0
            overflow-y-auto
            overflow-x-hidden
            overscroll-contain
            touch-pan-y
            px-4
            py-5
            sm:px-6
            sm:py-6
          "
        >

          <form
            onSubmit={handleSubmit}
            className="space-y-5"
          >

            {/* =================================================
                NAME
            ================================================== */}

            <div className="min-w-0">

              <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                Product Name *
              </label>

              <input
                type="text"
                value={formData.name}
                onChange={handleChange("name")}
                placeholder="Enter product name"
                className={`
                  block
                  w-full
                  min-w-0
                  box-border
                  px-3.5
                  py-3
                  border
                  rounded-xl
                  text-sm
                  outline-none
                  bg-white
                  transition
                  focus:ring-2
                  focus:ring-blue-500/20
                  ${
                    formErrors.name
                      ? "border-red-400"
                      : "border-slate-300"
                  }
                `}
              />

              {formErrors.name && (
                <p className="text-red-500 text-xs mt-1.5">
                  {formErrors.name}
                </p>
              )}

            </div>

            {/* =================================================
                PRICE + DISCOUNT
            ================================================== */}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">

              <div className="min-w-0">

                <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                  Original Price (₹) *
                </label>

                <input
                  type="number"
                  step="0.01"
                  min="0"
                  inputMode="decimal"
                  value={formData.price}
                  onChange={handleChange("price")}
                  placeholder="Enter price"
                  className={`
                    block
                    w-full
                    min-w-0
                    box-border
                    px-3.5
                    py-3
                    border
                    rounded-xl
                    text-sm
                    outline-none
                    bg-white
                    transition
                    focus:ring-2
                    focus:ring-blue-500/20
                    ${
                      formErrors.price
                        ? "border-red-400"
                        : "border-slate-300"
                    }
                  `}
                />

                {formErrors.price && (
                  <p className="text-red-500 text-xs mt-1.5">
                    {formErrors.price}
                  </p>
                )}

              </div>

              <div className="min-w-0">

                <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                  Discount (%)
                </label>

                <input
                  type="number"
                  step="1"
                  min="0"
                  max="100"
                  inputMode="numeric"
                  value={formData.discount_percent}
                  onChange={handleChange(
                    "discount_percent"
                  )}
                  placeholder="0 to 100"
                  className={`
                    block
                    w-full
                    min-w-0
                    box-border
                    px-3.5
                    py-3
                    border
                    rounded-xl
                    text-sm
                    outline-none
                    bg-white
                    transition
                    focus:ring-2
                    focus:ring-blue-500/20
                    ${
                      formErrors.discount_percent
                        ? "border-red-400"
                        : "border-slate-300"
                    }
                  `}
                />

                {formErrors.discount_percent && (
                  <p className="text-red-500 text-xs mt-1.5">
                    {formErrors.discount_percent}
                  </p>
                )}

              </div>

            </div>

            {/* =================================================
                STOCK
            ================================================== */}

            <div className="min-w-0">

              <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                Stock *
              </label>

              <input
                type="number"
                min="0"
                inputMode="numeric"
                value={formData.stock}
                onChange={handleChange("stock")}
                placeholder="Enter available stock"
                className={`
                  block
                  w-full
                  min-w-0
                  box-border
                  px-3.5
                  py-3
                  border
                  rounded-xl
                  text-sm
                  outline-none
                  bg-white
                  transition
                  focus:ring-2
                  focus:ring-blue-500/20
                  ${
                    formErrors.stock
                      ? "border-red-400"
                      : "border-slate-300"
                  }
                `}
              />

              {formErrors.stock && (
                <p className="text-red-500 text-xs mt-1.5">
                  {formErrors.stock}
                </p>
              )}

            </div>

            {/* =================================================
                CATEGORY
            ================================================== */}

            <div className="min-w-0">

              <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                Category
              </label>

              <input
                type="text"
                value={formData.category}
                onChange={handleChange("category")}
                placeholder="e.g. Electronics"
                className="
                  block
                  w-full
                  min-w-0
                  box-border
                  px-3.5
                  py-3
                  border
                  border-slate-300
                  rounded-xl
                  text-sm
                  outline-none
                  bg-white
                  transition
                  focus:ring-2
                  focus:ring-blue-500/20
                "
              />

            </div>

            {/* =================================================
                DESCRIPTION
            ================================================== */}

            <div className="min-w-0">

              <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                Description
              </label>

              <textarea
                value={formData.description}
                onChange={handleChange("description")}
                rows={5}
                placeholder="Describe your product..."
                className="
                  block
                  w-full
                  min-w-0
                  box-border
                  px-3.5
                  py-3
                  border
                  border-slate-300
                  rounded-xl
                  text-sm
                  outline-none
                  bg-white
                  transition
                  resize-none
                  focus:ring-2
                  focus:ring-blue-500/20
                "
              />

            </div>

            {/* =================================================
                IMAGE
            ================================================== */}

            <div className="min-w-0">

              <label className="block text-sm font-semibold text-slate-700 mb-1.5">
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
                  box-border
                  px-3
                  py-3
                  border
                  border-slate-300
                  rounded-xl
                  text-xs
                  sm:text-sm
                  outline-none
                  bg-white
                  focus:ring-2
                  focus:ring-blue-500/20
                "
              />

              <p className="text-xs text-slate-500 mt-1.5">
                JPG, PNG, WEBP, or GIF; maximum 5 MB.
              </p>

              {formData.image_url && !imageFile && (
                <p className="text-xs text-slate-500 mt-1">
                  Current image will be kept unless you
                  choose a replacement.
                </p>
              )}

              {imagePreview && (
                <div className="mt-3">

                  <img
                    src={imagePreview}
                    alt="Product preview"
                    className="
                      h-24
                      w-24
                      rounded-xl
                      object-cover
                      border
                      border-slate-200
                    "
                  />

                </div>
              )}

            </div>

            {/* =================================================
                BUTTONS
            ================================================== */}

            <div
              className="
                flex
                flex-col-reverse
                sm:flex-row
                sm:justify-end
                gap-3
                pt-2
                pb-2
              "
            >

              <button
                type="button"
                onClick={closeModal}
                disabled={submitting}
                className="
                  w-full
                  sm:w-auto
                  px-5
                  py-3
                  text-sm
                  border
                  border-slate-300
                  rounded-xl
                  text-slate-700
                  bg-white
                  hover:bg-slate-50
                  transition
                  font-semibold
                  cursor-pointer
                  disabled:opacity-50
                "
              >
                Cancel
              </button>

              <button
                type="submit"
                disabled={submitting}
                className="
                  w-full
                  sm:w-auto
                  px-5
                  py-3
                  text-sm
                  bg-blue-600
                  hover:bg-blue-700
                  disabled:bg-blue-400
                  text-white
                  rounded-xl
                  font-semibold
                  transition
                  cursor-pointer
                  disabled:cursor-not-allowed
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
