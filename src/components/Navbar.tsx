import React from 'react';
import { useAuth } from '../context/AuthContext.tsx';
import { ShoppingCart, LogOut, LogIn, Shield, User as UserIcon } from 'lucide-react';
import { motion } from 'motion/react';

interface NavbarProps {
  onCartClick: () => void;
  cartCount: number;
  currentTab: 'catalog' | 'orders' | 'admin';
  setCurrentTab: (tab: 'catalog' | 'orders' | 'admin') => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  onCartClick,
  cartCount,
  currentTab,
  setCurrentTab,
}) => {
  const { user, dbUser, login, logout, toggleRole, loading } = useAuth();

  return (
    <header className="sticky top-0 z-40 w-full border-b border-gray-100 bg-white/80 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Brand */}
        <div className="flex items-center gap-8">
          <button 
            onClick={() => setCurrentTab('catalog')}
            className="flex items-center gap-2 text-xl font-bold tracking-tight text-gray-950 hover:opacity-90"
          >
            <span className="bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent">
              Vellum
            </span>
            <span className="text-xs font-semibold uppercase tracking-widest text-gray-400">Store</span>
          </button>

          {/* Navigation links */}
          <nav className="hidden md:flex items-center gap-1">
            <button
              onClick={() => setCurrentTab('catalog')}
              className={`rounded-lg px-3 py-2 text-sm font-medium transition-all ${
                currentTab === 'catalog'
                  ? 'bg-gray-50 text-gray-950'
                  : 'text-gray-500 hover:text-gray-900 hover:bg-gray-50'
              }`}
            >
              Shop Catalog
            </button>
            {user && (
              <button
                onClick={() => setCurrentTab('orders')}
                className={`rounded-lg px-3 py-2 text-sm font-medium transition-all ${
                  currentTab === 'orders'
                    ? 'bg-gray-50 text-gray-950'
                    : 'text-gray-500 hover:text-gray-900 hover:bg-gray-50'
                }`}
              >
                Track Orders
              </button>
            )}
            {dbUser?.role === 'admin' && (
              <button
                onClick={() => setCurrentTab('admin')}
                className={`rounded-lg px-3 py-2 text-sm font-medium transition-all flex items-center gap-1.5 ${
                  currentTab === 'admin'
                    ? 'bg-amber-50 text-amber-950 border border-amber-100'
                    : 'text-gray-500 hover:text-amber-900 hover:bg-amber-50/50'
                }`}
              >
                <Shield className="h-4 w-4 text-amber-600" />
                Admin Panel
              </button>
            )}
          </nav>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-4">
          {/* Debug role toggle helper */}
          {user && (
            <div className="hidden lg:flex items-center gap-2 rounded-full border border-dashed border-gray-200 bg-gray-50/50 p-1 pl-3 pr-2 text-xs">
              <span className="text-gray-500 font-medium">Role:</span>
              <span className={`rounded-full px-2 py-0.5 font-bold uppercase tracking-wider text-[10px] ${
                dbUser?.role === 'admin' 
                  ? 'bg-amber-100 text-amber-800' 
                  : 'bg-gray-100 text-gray-800'
              }`}>
                {dbUser?.role || 'user'}
              </span>
              <button
                onClick={() => toggleRole().catch(console.error)}
                className="rounded-full bg-white px-2.5 py-1 font-semibold text-gray-700 shadow-sm border border-gray-200 hover:bg-gray-50 active:scale-95 transition-all"
                title="Toggle User/Admin Role instantly for testing"
              >
                Toggle Role
              </button>
            </div>
          )}

          {/* Cart Icon Button */}
          <button
            onClick={onCartClick}
            className="relative rounded-full p-2.5 text-gray-600 hover:bg-gray-50 hover:text-gray-900 transition-all"
            aria-label="Shopping Cart"
          >
            <ShoppingCart className="h-5 w-5" />
            {cartCount > 0 && (
              <motion.span
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="absolute right-1 top-1 flex h-5 w-5 items-center justify-center rounded-full bg-black text-[10px] font-bold text-white shadow-sm"
              >
                {cartCount}
              </motion.span>
            )}
          </button>

          {/* Authentication Button */}
          {loading ? (
            <div className="h-9 w-20 animate-pulse rounded-full bg-gray-100" />
          ) : user ? (
            <div className="flex items-center gap-3 border-l border-gray-100 pl-4">
              <div className="hidden sm:flex flex-col items-end">
                <span className="text-xs font-semibold text-gray-900 truncate max-w-[120px]">
                  {user.displayName || 'User'}
                </span>
                <span className="text-[10px] text-gray-400 font-medium truncate max-w-[120px]">
                  {user.email}
                </span>
              </div>
              {user.photoURL ? (
                <img
                  src={user.photoURL}
                  alt={user.displayName || 'User'}
                  className="h-8 w-8 rounded-full border border-gray-100"
                  referrerPolicy="no-referrer"
                />
              ) : (
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-100 text-gray-600">
                  <UserIcon className="h-4 w-4" />
                </div>
              )}
              <button
                onClick={() => logout()}
                className="rounded-full p-2 text-gray-500 hover:bg-red-50 hover:text-red-600 transition-all"
                title="Sign Out"
              >
                <LogOut className="h-4 w-4" />
              </button>
            </div>
          ) : (
            <button
              onClick={() => login()}
              className="flex items-center gap-2 rounded-full bg-gray-950 px-4 py-2 text-xs font-semibold text-white shadow-md shadow-gray-950/10 hover:bg-gray-800 active:scale-98 transition-all"
            >
              <LogIn className="h-4 w-4" />
              Sign In
            </button>
          )}
        </div>
      </div>

      {/* Mobile navigation links */}
      <div className="flex md:hidden items-center justify-center gap-4 border-t border-gray-50 bg-white py-2 px-4">
        <button
          onClick={() => setCurrentTab('catalog')}
          className={`text-xs font-semibold px-3 py-1.5 rounded-full ${
            currentTab === 'catalog' ? 'bg-gray-100 text-gray-950' : 'text-gray-500'
          }`}
        >
          Catalog
        </button>
        {user && (
          <button
            onClick={() => setCurrentTab('orders')}
            className={`text-xs font-semibold px-3 py-1.5 rounded-full ${
              currentTab === 'orders' ? 'bg-gray-100 text-gray-950' : 'text-gray-500'
            }`}
          >
            Orders
          </button>
        )}
        {dbUser?.role === 'admin' && (
          <button
            onClick={() => setCurrentTab('admin')}
            className={`text-xs font-semibold px-3 py-1.5 rounded-full ${
              currentTab === 'admin' ? 'bg-amber-50 text-amber-800 border border-amber-100' : 'text-gray-500'
            }`}
          >
            Admin Panel
          </button>
        )}
      </div>

      {/* Mini warning context helper */}
      {user && (
        <div className="lg:hidden flex items-center justify-between border-t border-gray-50 bg-gray-50/80 px-4 py-2 text-xs">
          <div className="flex items-center gap-1">
            <span className="text-gray-500">Current Role:</span>
            <span className="font-bold text-gray-900 uppercase tracking-wide">{dbUser?.role || 'user'}</span>
          </div>
          <button
            onClick={() => toggleRole().catch(console.error)}
            className="rounded bg-white px-2 py-1 text-[10px] font-bold text-gray-600 shadow-sm border border-gray-200 hover:bg-gray-100 transition-all"
          >
            Toggle Role
          </button>
        </div>
      )}
    </header>
  );
};
