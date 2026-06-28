import React, { useState, useEffect } from 'react';
import { Product } from '../types.ts';
import { X, Save, Image, RefreshCw } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface ProductFormProps {
  product?: Product | null; // null if adding new
  isOpen: boolean;
  onClose: () => void;
  onSave: (productData: any) => Promise<void>;
}

const CATEGORIES = ['Electronics', 'Accessories', 'Office', 'Apparel', 'Books', 'Home'];

const SAMPLE_IMAGES = [
  { name: 'Desk Mat', url: 'https://images.unsplash.com/photo-1632292224971-0d45778b361e?auto=format&fit=crop&q=80&w=600' },
  { name: 'Headphones', url: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&q=80&w=600' },
  { name: 'Keyboard', url: 'https://images.unsplash.com/photo-1587829741301-dc798b83add3?auto=format&fit=crop&q=80&w=600' },
  { name: 'Speaker', url: 'https://images.unsplash.com/photo-1545454675-3531b543be5d?auto=format&fit=crop&q=80&w=600' },
  { name: 'Watch', url: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&q=80&w=600' },
];

export const ProductForm: React.FC<ProductFormProps> = ({
  product,
  isOpen,
  onClose,
  onSave,
}) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [priceStr, setPriceStr] = useState(''); // in dollars
  const [category, setCategory] = useState(CATEGORIES[0]);
  const [imageUrl, setImageUrl] = useState('');
  const [stockStr, setStockStr] = useState('10');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (product) {
      setName(product.name);
      setDescription(product.description);
      setPriceStr((product.price / 100).toString());
      setCategory(product.category);
      setImageUrl(product.imageUrl);
      setStockStr(product.stock.toString());
    } else {
      setName('');
      setDescription('');
      setPriceStr('');
      setCategory(CATEGORIES[0]);
      setImageUrl('');
      setStockStr('10');
    }
    setError(null);
  }, [product, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !description || !priceStr || !imageUrl || !category || !stockStr) {
      setError('Please fill in all fields');
      return;
    }

    const priceCents = Math.round(parseFloat(priceStr) * 100);
    const stockVal = parseInt(stockStr);

    if (isNaN(priceCents) || priceCents < 0) {
      setError('Please enter a valid price');
      return;
    }

    if (isNaN(stockVal) || stockVal < 0) {
      setError('Please enter a valid stock amount');
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      await onSave({
        name,
        description,
        price: priceCents,
        category,
        imageUrl,
        stock: stockVal,
      });
      onClose();
    } catch (e: any) {
      setError(e.message || 'Failed to save product');
    } finally {
      setSubmitting(false);
    }
  };

  const pickSampleImage = (url: string) => {
    setImageUrl(url);
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto px-4 py-6 sm:px-0">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-gray-950/40 backdrop-blur-sm"
        />

        {/* Modal Panel */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          transition={{ duration: 0.2 }}
          className="relative z-10 w-full max-w-lg overflow-hidden rounded-3xl border border-gray-100 bg-white shadow-2xl"
        >
          {/* Header */}
          <div className="flex items-center justify-between border-b border-gray-50 px-6 py-4">
            <h2 className="text-lg font-bold tracking-tight text-gray-950">
              {product ? 'Edit Product' : 'Add New Product'}
            </h2>
            <button
              onClick={onClose}
              className="rounded-full p-1.5 text-gray-400 hover:bg-gray-50 hover:text-gray-900 transition-all"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="px-6 py-5">
            {error && (
              <div className="mb-4 rounded-xl bg-red-50 p-3 text-xs font-semibold text-red-700">
                {error}
              </div>
            )}

            <div className="space-y-4">
              {/* Product Name */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-1.5">
                  Product Name
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g., Premium Leather Laptop Sleeve"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  className="w-full rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm text-gray-900 placeholder-gray-400 focus:border-gray-950 focus:outline-none focus:ring-1 focus:ring-gray-950"
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-1.5">
                  Description
                </label>
                <textarea
                  required
                  rows={3}
                  placeholder="Tell customers about the materials, design, and dimensions..."
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  className="w-full rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm text-gray-900 placeholder-gray-400 focus:border-gray-950 focus:outline-none focus:ring-1 focus:ring-gray-950 resize-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                {/* Price in USD */}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-1.5">
                    Price (USD)
                  </label>
                  <div className="relative">
                    <span className="absolute left-3.5 top-2.5 text-sm font-semibold text-gray-400">
                      $
                    </span>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      required
                      placeholder="0.00"
                      value={priceStr}
                      onChange={e => setPriceStr(e.target.value)}
                      className="w-full rounded-xl border border-gray-200 bg-white pl-8 pr-4 py-2.5 text-sm text-gray-900 placeholder-gray-400 focus:border-gray-950 focus:outline-none focus:ring-1 focus:ring-gray-950"
                    />
                  </div>
                </div>

                {/* Stock */}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-1.5">
                    Stock Quantity
                  </label>
                  <input
                    type="number"
                    min="0"
                    required
                    placeholder="10"
                    value={stockStr}
                    onChange={e => setStockStr(e.target.value)}
                    className="w-full rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm text-gray-900 placeholder-gray-400 focus:border-gray-950 focus:outline-none focus:ring-1 focus:ring-gray-950"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                {/* Category Selection */}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-1.5">
                    Category
                  </label>
                  <select
                    value={category}
                    onChange={e => setCategory(e.target.value)}
                    className="w-full rounded-xl border border-gray-200 bg-white px-3.5 py-2.5 text-sm text-gray-950 focus:border-gray-950 focus:outline-none focus:ring-1 focus:ring-gray-950"
                  >
                    {CATEGORIES.map(cat => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Image Preset Helper */}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-1.5">
                    Quick Preset Image
                  </label>
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {SAMPLE_IMAGES.map((img, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => pickSampleImage(img.url)}
                        className="rounded-lg bg-gray-50 border border-gray-150 px-2 py-1 text-[10px] font-semibold text-gray-600 hover:bg-gray-100 active:scale-95 transition-all"
                        title={img.name}
                      >
                        {img.name}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Image URL Input */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-1.5">
                  Image URL
                </label>
                <div className="relative">
                  <Image className="absolute left-3.5 top-3 h-4 w-4 text-gray-400" />
                  <input
                    type="url"
                    required
                    placeholder="https://images.unsplash.com/photo-..."
                    value={imageUrl}
                    onChange={e => setImageUrl(e.target.value)}
                    className="w-full rounded-xl border border-gray-200 bg-white pl-10 pr-4 py-2.5 text-sm text-gray-900 placeholder-gray-400 focus:border-gray-950 focus:outline-none focus:ring-1 focus:ring-gray-950"
                  />
                </div>
                {imageUrl && (
                  <div className="mt-2.5 flex items-center gap-3 rounded-2xl border border-gray-100 p-2 bg-gray-50/50">
                    <img
                      src={imageUrl}
                      alt="Preview"
                      className="h-10 w-10 rounded-lg object-cover bg-gray-100"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1594122230689-45899d9e6f69?auto=format&fit=crop&q=80&w=200';
                      }}
                      referrerPolicy="no-referrer"
                    />
                    <span className="text-[10px] text-gray-400 truncate max-w-[300px]">
                      Live image preview verified
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Actions */}
            <div className="mt-6 flex gap-3 border-t border-gray-50 pt-5">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 rounded-xl border border-gray-200 py-2.5 px-4 text-xs font-semibold text-gray-700 hover:bg-gray-50 active:scale-[0.98] transition-all"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-gray-950 py-2.5 px-4 text-xs font-semibold text-white hover:bg-gray-800 active:scale-[0.98] transition-all disabled:opacity-50"
              >
                {submitting ? (
                  <RefreshCw className="h-4 w-4 animate-spin" />
                ) : (
                  <Save className="h-4 w-4" />
                )}
                {product ? 'Save Changes' : 'Create Product'}
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
