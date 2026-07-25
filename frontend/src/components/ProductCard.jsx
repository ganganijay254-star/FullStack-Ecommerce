import { Link } from "react-router-dom";
import StarRating from "./StarRating";

export default function ProductCard({ product }) {
  const placeholderImage = "https://via.placeholder.com/300x300?text=No+Image";

  return (
    <div className="bg-white rounded-2xl shadow-xs border border-slate-200 overflow-hidden hover:shadow-md hover:border-slate-300 transition duration-200 group flex flex-col justify-between">
      {/* Product Image & Badges */}
      <div className="relative">
        <Link to={`/products/${product.id}`} className="block aspect-square overflow-hidden bg-slate-50">
          <img
            src={product.image_url || placeholderImage}
            alt={product.name}
            loading="lazy"
            className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
            onError={(e) => {
              e.target.src = placeholderImage;
            }}
          />
        </Link>
        {product.category && (
          <span className="absolute top-3 left-3 px-2.5 py-1 bg-white/90 backdrop-blur-xs text-slate-700 text-[11px] font-semibold rounded-full shadow-xs border border-slate-200">
            {product.category}
          </span>
        )}
      </div>

      {/* Product Info */}
      <div className="p-4 flex-1 flex flex-col justify-between">
        <div>
          {/* Star Rating Badge */}
          <div className="flex items-center gap-1.5 mb-1.5">
            <StarRating rating={product.avg_rating || 0} size="xs" />
            <span className="text-xs font-semibold text-slate-700">
              {product.avg_rating ? product.avg_rating.toFixed(1) : "0.0"}
            </span>
            <span className="text-[11px] text-slate-400">
              ({product.review_count || 0})
            </span>
          </div>

          {/* Name */}
          <Link to={`/products/${product.id}`}>
            <h3 className="font-semibold text-slate-900 text-sm line-clamp-2 hover:text-blue-600 transition min-h-[2.5rem]">
              {product.name}
            </h3>
          </Link>
        </div>

        <div>
          {/* Price & Stock */}
          <div className="mt-3 flex items-center justify-between">
            <div>
              <span className="text-lg font-bold text-slate-900">
                ₹{product.price?.toLocaleString()}
              </span>
            </div>
            <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-md ${
              product.stock > 0 ? "bg-emerald-50 text-emerald-700 border border-emerald-200" : "bg-rose-50 text-rose-600 border border-rose-200"
            }`}>
              {product.stock > 0 ? "In Stock" : "Out of Stock"}
            </span>
          </div>

          {/* Seller */}
          {product.seller_name && (
            <p className="text-[11px] text-slate-400 mt-1">
              Sold by <span className="font-medium text-slate-600">{product.seller_name}</span>
            </p>
          )}

          {/* Action Button */}
          <Link
            to={`/products/${product.id}`}
            className="mt-3 block w-full text-center px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-xl shadow-xs transition cursor-pointer"
          >
            View Details
          </Link>
        </div>
      </div>
    </div>
  );
}

