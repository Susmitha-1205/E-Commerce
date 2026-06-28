import React, { useState } from 'react';
import { CartItem } from '../types.ts';
import { useAuth } from '../context/AuthContext.tsx';
import { X, ShoppingBag, Plus, Minus, Trash2, MapPin, CreditCard, RefreshCw } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface CartProps {
  isOpen: boolean;
  onClose: () => void;
  cartItems: CartItem[];
  onUpdateQuantity: (productId: number, newQty: number) => void;
  onRemoveItem: (productId: number) => void;
  onCheckoutSuccess: () => void;
}

export const Cart: React.FC<CartProps> = ({
  isOpen,
  onClose,
  cartItems,
  onUpdateQuantity,
  onRemoveItem,
  onCheckoutSuccess,
}) => {
  const { user, token, login } = useAuth();
  const [shippingAddress, setShippingAddress] = useState('');
  const [checkingOut, setCheckingOut] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const totalCents = cartItems.reduce((acc, item) => acc + item.product.price * item.quantity, 0);
  const formattedTotal = (totalCents / 100).toLocaleString('en-US', {
    style: 'currency',
    currency: 'USD',
  });

  const handleCheckout = async () => {
    if (!user || !token) {
      setError('Please sign in to place your order');
      return;
    }

    if (!shippingAddress.trim()) {
      setError('Please enter a valid shipping address');
      return;
    }

    setCheckingOut(true);
    setError(null);

    try {
      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          shippingAddress,
          items: cartItems.map(item => ({
            productId: item.product.id,
            quantity: item.quantity,
          })),
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to place order');
      }

      onCheckoutSuccess();
      setShippingAddress('');
      onClose();
    } catch (e: any) {
      setError(e.message || 'Checkout failed');
    } finally {
      setCheckingOut(false);
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 overflow-hidden">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-gray-950/40 backdrop-blur-sm"
        />

        {/* Panel Container */}
        <div className="absolute inset-y-0 right-0 flex max-w-full pl-10">
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 220 }}
            className="w-screen max-w-md border-l border-gray-100 bg-white shadow-2xl flex flex-col h-full"
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-gray-50 px-6 py-5">
              <div className="flex items-center gap-2">
                <ShoppingBag className="h-5 w-5 text-gray-950" />
                <h2 className="text-lg font-bold tracking-tight text-gray-950">
                  Your Cart
                </h2>
              </div>
              <button
                onClick={onClose}
                className="rounded-full p-1.5 text-gray-400 hover:bg-gray-50 hover:text-gray-900 transition-all"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Content list */}
            <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
              {cartItems.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 text-center">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gray-50 text-gray-400 mb-4">
                    <ShoppingBag className="h-6 w-6" />
                  </div>
                  <h3 className="text-sm font-semibold text-gray-900">Your cart is empty</h3>
                  <p className="mt-1 text-xs text-gray-500">Add some premium products from our catalog to get started.</p>
                </div>
              ) : (
                cartItems.map((item, index) => {
                  const itemPriceFormatted = ((item.product.price * item.quantity) / 100).toLocaleString('en-US', {
                    style: 'currency',
                    currency: 'USD',
                  });

                  return (
                    <motion.div
                      layout
                      key={item.product.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className="flex items-center gap-4 rounded-2xl border border-gray-50 p-3 bg-white hover:shadow-sm transition-all"
                    >
                      <img
                        src={item.product.imageUrl}
                        alt={item.product.name}
                        className="h-14 w-14 rounded-xl object-cover bg-gray-50 border border-gray-100 shrink-0"
                        referrerPolicy="no-referrer"
                      />
                      <div className="flex-1 min-w-0">
                        <h4 className="text-sm font-semibold text-gray-950 truncate">
                          {item.product.name}
                        </h4>
                        <span className="text-xs text-gray-400 font-mono font-medium">
                          {(item.product.price / 100).toLocaleString('en-US', { style: 'currency', currency: 'USD' })} each
                        </span>
                        
                        {/* Quantity management */}
                        <div className="flex items-center gap-2.5 mt-2">
                          <button
                            onClick={() => onUpdateQuantity(item.product.id, item.quantity - 1)}
                            className="rounded-lg bg-gray-50 p-1 text-gray-500 hover:bg-gray-100 hover:text-gray-900 active:scale-95 transition-all"
                          >
                            <Minus className="h-3 w-3" />
                          </button>
                          <span className="text-xs font-bold text-gray-800 font-mono w-4 text-center">
                            {item.quantity}
                          </span>
                          <button
                            onClick={() => onUpdateQuantity(item.product.id, item.quantity + 1)}
                            disabled={item.quantity >= item.product.stock}
                            className="rounded-lg bg-gray-50 p-1 text-gray-500 hover:bg-gray-100 hover:text-gray-900 active:scale-95 transition-all disabled:opacity-40"
                          >
                            <Plus className="h-3 w-3" />
                          </button>
                        </div>
                      </div>

                      <div className="flex flex-col items-end gap-2 shrink-0">
                        <span className="font-mono font-bold text-sm text-gray-950">
                          {itemPriceFormatted}
                        </span>
                        <button
                          onClick={() => onRemoveItem(item.product.id)}
                          className="rounded-lg p-1 text-gray-400 hover:bg-red-50 hover:text-red-500 transition-all active:scale-95"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </motion.div>
                  );
                })
              )}
            </div>

            {/* Footer Summary & Checkout */}
            {cartItems.length > 0 && (
              <div className="border-t border-gray-100 bg-gray-50/50 p-6 space-y-4 shrink-0">
                {error && (
                  <div className="rounded-xl bg-red-50 p-3 text-xs font-semibold text-red-700">
                    {error}
                  </div>
                )}

                {/* Subtotal */}
                <div className="flex items-center justify-between text-sm font-medium">
                  <span className="text-gray-500">Cart Total</span>
                  <span className="font-mono font-bold text-lg text-gray-950">
                    {formattedTotal}
                  </span>
                </div>

                {user ? (
                  <div className="space-y-4">
                    {/* Shipping address input */}
                    <div className="space-y-1.5">
                      <label className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-gray-500">
                        <MapPin className="h-3 w-3 text-gray-400" />
                        Shipping Address
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="123 Gallery Lane, San Francisco, CA 94107"
                        value={shippingAddress}
                        onChange={e => setShippingAddress(e.target.value)}
                        className="w-full rounded-xl border border-gray-200 bg-white px-3.5 py-2 text-xs text-gray-900 placeholder-gray-400 focus:border-gray-950 focus:outline-none focus:ring-1 focus:ring-gray-950"
                      />
                    </div>

                    {/* Checkout Button */}
                    <button
                      onClick={handleCheckout}
                      disabled={checkingOut}
                      className="w-full flex items-center justify-center gap-2 rounded-xl bg-gray-950 py-3 text-xs font-semibold text-white shadow-lg shadow-gray-950/10 hover:bg-gray-800 active:scale-[0.98] transition-all disabled:opacity-50"
                    >
                      {checkingOut ? (
                        <RefreshCw className="h-4 w-4 animate-spin" />
                      ) : (
                        <CreditCard className="h-4 w-4" />
                      )}
                      Place Secure Order
                    </button>
                  </div>
                ) : (
                  <div className="space-y-3 rounded-2xl border border-dashed border-gray-200 bg-white p-4">
                    <p className="text-center text-xs text-gray-500 leading-relaxed">
                      You need to sign in to configure shipping and checkout securely.
                    </p>
                    <button
                      onClick={login}
                      className="w-full rounded-xl bg-gray-950 py-2.5 text-xs font-semibold text-white hover:bg-gray-800 transition-all active:scale-[0.98]"
                    >
                      Sign In to Checkout
                    </button>
                  </div>
                )}
              </div>
            )}
          </motion.div>
        </div>
      </div>
    </AnimatePresence>
  );
};
