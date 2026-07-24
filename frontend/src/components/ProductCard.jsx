import { Link } from "react-router-dom";

export default function ProductCard({ product }) {
  const placeholderImage = "https://via.placeholder.com/300x300?text=No+Image";

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden hover:shadow-md transition group">
      {/* Product Image */}
      <Link to={`/products/${product.id}`} className="block aspect-square overflow-hidden bg-slate-100">
        <img
          src={product.image_url || placeholderImage}
          alt={product.name}
          className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
          onError={(e) => {
            e.target.src = placeholderImage;
          }}
        />
      </Link>

      {/* Product Info */}
      <div className="p-4">
        {/* Category Badge */}
        {product.category && (
          <span className="inline-block px-2 py-0.5 bg-blue-50 text-blue-600 text-xs font-medium rounded-full mb-2">
            {product.category}
          </span>
        )}

        {/* Name */}
        <Link to={`/products/${product.id}`}>
          <h3 className="font-semibold text-slate-800 text-sm line-clamp-2 hover:text-blue-600 transition min-h-[2.5rem]">
            {product.name}
          </h3>
        </Link>

        {/* Price & Stock */}
        <div className="mt-2 flex items-center justify-between">
          <span className="text-lg font-bold text-slate-900">
            ₹{product.price?.toLocaleString()}
          </span>
          <span className={`text-xs font-medium ${
            product.stock > 0 ? "text-green-600" : "text-red-500"
          }`}>
            {product.stock > 0 ? `In Stock (${product.stock})` : "Out of Stock"}
          </span>
        </div>

        {/* Seller */}
        {product.seller_name && (
          <p className="text-xs text-slate-400 mt-1">
            by {product.seller_name}
          </p>
        )}

        {/* View Details Button */}
        <Link
          to={`/products/${product.id}`}
          className="mt-3 block w-full text-center px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition"
        >
          View Details
        </Link>
      </div>
    </div>
  );
}

