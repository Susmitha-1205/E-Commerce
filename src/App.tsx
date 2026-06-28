import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext.tsx';
import { Product, CartItem } from './types.ts';
import { Navbar } from './components/Navbar.tsx';
import { ProductCard } from './components/ProductCard.tsx';
import { ProductForm } from './components/ProductForm.tsx';
import { Cart } from './components/Cart.tsx';
import { OrdersList } from './components/OrdersList.tsx';
import { AdminPortal } from './components/AdminPortal.tsx';
import { Search, Filter, ShoppingBag, CheckCircle, AlertCircle, Sparkles, RefreshCw } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

function StoreApp() {
  const { user, dbUser, token, login } = useAuth();
  
  // Products catalogs states
  const [products, setProducts] = useState<Product[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');

  // Cart states
  const [cart, setCart] = useState<CartItem[]>(() => {
    const saved = localStorage.getItem('vellum_cart');
    return saved ? JSON.parse(saved) : [];
  });
  const [cartOpen, setCartOpen] = useState(false);

  // App navigation state
  const [currentTab, setCurrentTab] = useState<'catalog' | 'orders' | 'admin'>('catalog');

  // Product CRUD states (Admin)
  const [productFormOpen, setProductFormOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  // Success/Error toast feedback states
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Sync cart to localStorage
  useEffect(() => {
    localStorage.setItem('vellum_cart', JSON.stringify(cart));
  }, [cart]);

  // Fetch all products
  const fetchProducts = async () => {
    setLoadingProducts(true);
    try {
      const res = await fetch('/api/products');
      if (res.ok) {
        const data = await res.json();
        setProducts(data);
      }
    } catch (e) {
      console.error('Failed to fetch products:', e);
    } finally {
      setLoadingProducts(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  const triggerFeedback = (type: 'success' | 'error', message: string) => {
    setFeedback({ type, message });
    setTimeout(() => {
      setFeedback(null);
    }, 4000);
  };

  // Cart operations
  const handleAddToCart = (product: Product) => {
    const existing = cart.find(item => item.product.id === product.id);
    const currentQty = existing ? existing.quantity : 0;

    if (currentQty + 1 > product.stock) {
      triggerFeedback('error', `Cannot add more. Only ${product.stock} units available in stock.`);
      return;
    }

    if (existing) {
      setCart(cart.map(item => 
        item.product.id === product.id 
          ? { ...item, quantity: item.quantity + 1 } 
          : item
      ));
    } else {
      setCart([...cart, { product, quantity: 1 }]);
    }
    triggerFeedback('success', `Added "${product.name}" to cart.`);
  };

  const handleUpdateCartQuantity = (productId: number, newQty: number) => {
    if (newQty <= 0) {
      handleRemoveCartItem(productId);
      return;
    }

    const item = cart.find(i => i.product.id === productId);
    if (item && newQty > item.product.stock) {
      triggerFeedback('error', `Cannot increase quantity. Maximum available stock reached.`);
      return;
    }

    setCart(cart.map(item => 
      item.product.id === productId 
        ? { ...item, quantity: newQty } 
        : item
    ));
  };

  const handleRemoveCartItem = (productId: number) => {
    setCart(cart.filter(item => item.product.id !== productId));
  };

  const handleCheckoutSuccess = () => {
    setCart([]);
    triggerFeedback('success', 'Thank you! Your order has been placed successfully.');
    setCurrentTab('orders');
  };

  // Product Admin Operations
  const handleSaveProduct = async (productData: any) => {
    if (!token) return;
    const url = editingProduct ? `/api/products/${editingProduct.id}` : '/api/products';
    const method = editingProduct ? 'PUT' : 'POST';

    const res = await fetch(url, {
      method,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify(productData),
    });

    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || 'Failed to save product');
    }

    triggerFeedback('success', editingProduct ? 'Product updated successfully.' : 'Product created successfully.');
    fetchProducts();
  };

  const handleDeleteProduct = async (product: Product) => {
    if (!token) return;
    if (!confirm(`Are you sure you want to delete "${product.name}" from the catalog?`)) {
      return;
    }

    try {
      const res = await fetch(`/api/products/${product.id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to delete product');
      }

      triggerFeedback('success', 'Product listing deleted successfully.');
      fetchProducts();
    } catch (e: any) {
      triggerFeedback('error', e.message || 'Failed to delete product.');
    }
  };

  // Filtering calculations
  const categories = ['All', ...Array.from(new Set(products.map(p => p.category)))];
  const filteredProducts = products.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          product.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          product.category.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'All' || product.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const cartCount = cart.reduce((acc, item) => acc + item.quantity, 0);

  return (
    <div className="min-h-screen bg-gray-50/50 font-sans text-gray-800 antialiased flex flex-col">
      {/* Dynamic Toast Feedback overlay */}
      <AnimatePresence>
        {feedback && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed top-6 left-1/2 z-50 -translate-x-1/2 flex items-center gap-2 rounded-full px-5 py-3 shadow-xl backdrop-blur-md font-medium text-xs border bg-white/95"
          >
            {feedback.type === 'success' ? (
              <CheckCircle className="h-4 w-4 text-green-600 shrink-0" />
            ) : (
              <AlertCircle className="h-4 w-4 text-red-600 shrink-0" />
            )}
            <span className={feedback.type === 'success' ? 'text-green-800' : 'text-red-800'}>
              {feedback.message}
            </span>
          </motion.div>
        )}
      </AnimatePresence>

      <Navbar
        onCartClick={() => setCartOpen(true)}
        cartCount={cartCount}
        currentTab={currentTab}
        setCurrentTab={setCurrentTab}
      />

      {/* Main Content Areas */}
      <main className="flex-1">
        {currentTab === 'catalog' && (
          <div>
            {/* Elegant Display Hero Section */}
            <section className="bg-white border-b border-gray-100 py-16 sm:py-24">
              <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 text-center">
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="inline-flex items-center gap-1.5 rounded-full bg-gray-50 border border-gray-150 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-gray-500 mb-6"
                >
                  <Sparkles className="h-3.5 w-3.5 text-gray-500" />
                  Now live with Postgres Cloud SQL
                </motion.div>
                <h1 className="font-display text-4xl font-extrabold tracking-tight text-gray-950 sm:text-5xl md:text-6xl max-w-3xl mx-auto leading-tight">
                  Distinctive objects crafted for your everyday work.
                </h1>
                <p className="mt-4 text-base sm:text-lg text-gray-500 max-w-xl mx-auto font-medium">
                  A high-fidelity minimalist catalog backed by full-stack Express APIs, user roles, and transactional checkout tracking.
                </p>

                {/* Search Bar */}
                <div className="mt-10 max-w-md mx-auto relative">
                  <Search className="absolute left-4 top-3.5 h-4 w-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search by name, description, category..."
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    className="w-full rounded-2xl border border-gray-200 bg-gray-50/50 pl-11 pr-4 py-3 text-sm text-gray-950 placeholder-gray-400 focus:bg-white focus:border-gray-950 focus:outline-none focus:ring-1 focus:ring-gray-950 transition-all"
                  />
                </div>
              </div>
            </section>

            {/* Catalog Grid Section */}
            <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 mb-8">
                <div>
                  <h2 className="text-xl font-bold tracking-tight text-gray-950">Store Catalogue</h2>
                  <p className="text-xs text-gray-500 mt-0.5">Filter through meticulously designed premium assets.</p>
                </div>

                {/* Category selectors */}
                <div className="flex flex-wrap items-center gap-1.5">
                  <Filter className="h-3.5 w-3.5 text-gray-400 mr-1.5 hidden md:block" />
                  {categories.map(cat => (
                    <button
                      key={cat}
                      onClick={() => setSelectedCategory(cat)}
                      className={`rounded-full px-3.5 py-1.5 text-xs font-semibold transition-all ${
                        selectedCategory === cat
                          ? 'bg-gray-950 text-white'
                          : 'bg-white border border-gray-150 text-gray-600 hover:text-gray-900'
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              </div>

              {/* Grid */}
              {loadingProducts ? (
                <div className="flex flex-col items-center justify-center py-24 text-gray-400">
                  <RefreshCw className="h-8 w-8 animate-spin mb-3 text-gray-950" />
                  <p className="text-xs">Gathering catalog items from Cloud SQL...</p>
                </div>
              ) : filteredProducts.length === 0 ? (
                <div className="rounded-3xl border border-dashed border-gray-200 bg-white p-16 text-center">
                  <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-gray-50 text-gray-400 mb-4">
                    <ShoppingBag className="h-6 w-6" />
                  </div>
                  <h3 className="text-sm font-semibold text-gray-900">No matching products</h3>
                  <p className="mt-1 text-xs text-gray-500">We couldn't find any products fitting your search query.</p>
                </div>
              ) : (
                <motion.div 
                  layout
                  className="grid grid-cols-1 gap-x-6 gap-y-8 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
                >
                  <AnimatePresence mode="popLayout">
                    {filteredProducts.map(product => (
                      <ProductCard
                        key={product.id}
                        product={product}
                        onAddToCart={handleAddToCart}
                        isAdmin={dbUser?.role === 'admin'}
                        onEdit={(prod) => {
                          setEditingProduct(prod);
                          setProductFormOpen(true);
                        }}
                        onDelete={handleDeleteProduct}
                      />
                    ))}
                  </AnimatePresence>
                </motion.div>
              )}
            </section>
          </div>
        )}

        {currentTab === 'orders' && (
          <OrdersList isAdminView={false} />
        )}

        {currentTab === 'admin' && dbUser?.role === 'admin' && (
          <AdminPortal
            products={products}
            onAddProductClick={() => {
              setEditingProduct(null);
              setProductFormOpen(true);
            }}
            onEditProductClick={(prod) => {
              setEditingProduct(prod);
              setProductFormOpen(true);
            }}
            onDeleteProduct={handleDeleteProduct}
          />
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-gray-100 bg-white py-12 shrink-0">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-center">
          <div>
            <span className="font-display font-bold text-gray-900">Vellum Store</span>
            <span className="text-xs font-medium text-gray-400 ml-2">© 2026 susmithamungara28</span>
          </div>
          <div className="text-xs text-gray-400 font-semibold uppercase tracking-widest">
            React 19 • Express 4 • PostgreSQL Cloud SQL
          </div>
        </div>
      </footer>

      {/* Cart Drawer Overlay */}
      <Cart
        isOpen={cartOpen}
        onClose={() => setCartOpen(false)}
        cartItems={cart}
        onUpdateQuantity={handleUpdateCartQuantity}
        onRemoveItem={handleRemoveCartItem}
        onCheckoutSuccess={handleCheckoutSuccess}
      />

      {/* Admin Product Management Modal Form */}
      <ProductForm
        product={editingProduct}
        isOpen={productFormOpen}
        onClose={() => {
          setProductFormOpen(false);
          setEditingProduct(null);
        }}
        onSave={handleSaveProduct}
      />
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <StoreApp />
    </AuthProvider>
  );
}
