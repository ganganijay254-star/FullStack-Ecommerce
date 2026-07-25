import { useState } from "react";

export default function StarRating({
  rating = 0,
  maxStars = 5,
  size = "sm",
  interactive = false,
  onChange = () => {},
}) {
  const [hoverRating, setHoverRating] = useState(0);

  const starSizes = {
    xs: "w-3.5 h-3.5",
    sm: "w-4 h-4",
    md: "w-5 h-5",
    lg: "w-6 h-6",
    xl: "w-8 h-8",
  };

  const currentRating = interactive ? (hoverRating || rating) : rating;

  return (
    <div className="flex items-center gap-1">
      {Array.from({ length: maxStars }).map((_, index) => {
        const starValue = index + 1;
        const isFilled = starValue <= Math.floor(currentRating);
        const isHalf = !isFilled && starValue === Math.ceil(currentRating) && currentRating % 1 !== 0;

        return (
          <button
            key={index}
            type={interactive ? "button" : undefined}
            disabled={!interactive}
            onClick={() => interactive && onChange(starValue)}
            onMouseEnter={() => interactive && setHoverRating(starValue)}
            onMouseLeave={() => interactive && setHoverRating(0)}
            className={`${interactive ? "cursor-pointer transform hover:scale-110 transition-transform" : "cursor-default"} text-amber-400 focus:outline-none`}
            aria-label={`${starValue} Star`}
          >
            {isFilled ? (
              <svg className={`${starSizes[size]} fill-amber-400 stroke-amber-400`} viewBox="0 0 24 24">
                <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
              </svg>
            ) : isHalf ? (
              <svg className={`${starSizes[size]} fill-amber-400 stroke-amber-400`} viewBox="0 0 24 24">
                <defs>
                  <linearGradient id={`half-star-${index}`}>
                    <stop offset="50%" stopColor="#f59e0b" />
                    <stop offset="50%" stopColor="#e2e8f0" />
                  </linearGradient>
                </defs>
                <path fill={`url(#half-star-${index})`} d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
              </svg>
            ) : (
              <svg className={`${starSizes[size]} fill-slate-200 stroke-slate-300`} viewBox="0 0 24 24">
                <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
              </svg>
            )}
          </button>
        );
      })}
    </div>
  );
}
