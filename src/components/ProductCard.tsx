import React from 'react';
import { Product } from '../types.ts';
import { ShoppingCart, Edit3, Trash2, ShieldAlert } from 'lucide-react';
import { motion } from 'motion/react';

interface ProductCardProps {
  product: Product;
  onAddToCart: (product: Product) => void;
  isAdmin: boolean;
  onEdit?: (product: Product) => void;
  onDelete?: (product: Product) => void;
}

export const ProductCard: React.FC<ProductCardProps> = ({
  product,
  onAddToCart,
  isAdmin,
  onEdit,
  onDelete,
}) => {
  const formattedPrice = (product.price / 100).toLocaleString('en-US', {
    style: 'currency',
    currency: 'USD',
  });

  const outOfStock = product.stock <= 0;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.3 }}
      className="group relative flex flex-col overflow-hidden rounded-2xl border border-gray-100 bg-white p-4 transition-shadow hover:shadow-lg"
    >
      {/* Product Image */}
      <div className="relative aspect-square overflow-hidden rounded-xl bg-gray-50">
        <img
          src={product.imageUrl}
          alt={product.name}
          className="h-full w-full object-cover object-center transition-transform duration-500 group-hover:scale-105"
          referrerPolicy="no-referrer"
        />

        {/* Category Badge */}
        <span className="absolute left-3 top-3 rounded-full bg-white/90 backdrop-blur-sm px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-gray-800 shadow-sm">
          {product.category}
        </span>

        {/* Stock Status */}
        {outOfStock ? (
          <span className="absolute right-3 top-3 rounded-full bg-red-100 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-red-700">
            Out of Stock
          </span>
        ) : product.stock <= 3 ? (
          <span className="absolute right-3 top-3 rounded-full bg-amber-100 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-amber-700">
            Only {product.stock} Left
          </span>
        ) : null}
      </div>

      {/* Content */}
      <div className="flex flex-1 flex-col pt-4">
        <div className="flex items-start justify-between gap-2">
          <h3 className="font-semibold text-gray-950 text-base tracking-tight line-clamp-1 group-hover:text-gray-900">
            {product.name}
          </h3>
          <span className="font-mono font-bold text-gray-950 text-base shrink-0">
            {formattedPrice}
          </span>
        </div>
        <p className="mt-1.5 text-xs text-gray-500 line-clamp-2 leading-relaxed flex-1">
          {product.description}
        </p>

        {/* Action button */}
        <div className="mt-4 flex gap-2">
          <button
            onClick={() => onAddToCart(product)}
            disabled={outOfStock}
            className={`flex flex-1 items-center justify-center gap-2 rounded-xl py-2.5 px-4 text-xs font-semibold text-white shadow-sm transition-all active:scale-[0.98] ${
              outOfStock
                ? 'bg-gray-100 text-gray-400 cursor-not-allowed shadow-none'
                : 'bg-gray-950 hover:bg-gray-800 shadow-gray-950/5'
            }`}
          >
            <ShoppingCart className="h-4 w-4" />
            {outOfStock ? 'Out of Stock' : 'Add to Cart'}
          </button>

          {/* Admin specific action buttons */}
          {isAdmin && (
            <div className="flex gap-1 shrink-0">
              <button
                onClick={() => onEdit?.(product)}
                className="rounded-xl border border-gray-200 bg-white p-2.5 text-gray-600 hover:bg-gray-50 hover:text-gray-900 transition-all active:scale-95"
                title="Edit Product"
              >
                <Edit3 className="h-4 w-4" />
              </button>
              <button
                onClick={() => onDelete?.(product)}
                className="rounded-xl border border-red-100 bg-white p-2.5 text-red-500 hover:bg-red-50 hover:text-red-700 transition-all active:scale-95"
                title="Delete Product"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
};
