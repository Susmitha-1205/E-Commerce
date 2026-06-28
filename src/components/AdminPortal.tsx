import React, { useState } from 'react';
import { Product } from '../types.ts';
import { Plus, Edit, Trash2, Package, ListOrdered, ShieldCheck, DollarSign } from 'lucide-react';
import { OrdersList } from './OrdersList.tsx';
import { motion } from 'motion/react';

interface AdminPortalProps {
  products: Product[];
  onAddProductClick: () => void;
  onEditProductClick: (product: Product) => void;
  onDeleteProduct: (product: Product) => void;
}

export const AdminPortal: React.FC<AdminPortalProps> = ({
  products,
  onAddProductClick,
  onEditProductClick,
  onDeleteProduct,
}) => {
  const [activeTab, setActiveTab] = useState<'products' | 'orders'>('products');

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
      {/* Intro section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 border-b border-gray-100 pb-6 mb-8">
        <div>
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-6 w-6 text-amber-600" />
            <h1 className="text-2xl font-bold tracking-tight text-gray-950">
              Merchant Admin Workspace
            </h1>
          </div>
          <p className="text-xs text-gray-500 mt-1">
            Maintain catalogs, stock updates, and oversee fulfillment processes securely.
          </p>
        </div>

        {/* Tab switchers */}
        <div className="flex rounded-full bg-gray-100 p-1.5 self-start">
          <button
            onClick={() => setActiveTab('products')}
            className={`flex items-center gap-1.5 rounded-full px-4 py-2 text-xs font-semibold transition-all ${
              activeTab === 'products'
                ? 'bg-white text-gray-950 shadow-sm'
                : 'text-gray-500 hover:text-gray-900'
            }`}
          >
            <Package className="h-4 w-4" />
            Catalog Products
          </button>
          <button
            onClick={() => setActiveTab('orders')}
            className={`flex items-center gap-1.5 rounded-full px-4 py-2 text-xs font-semibold transition-all ${
              activeTab === 'orders'
                ? 'bg-white text-gray-950 shadow-sm'
                : 'text-gray-500 hover:text-gray-900'
            }`}
          >
            <ListOrdered className="h-4 w-4" />
            Fulfillment Orders
          </button>
        </div>
      </div>

      {activeTab === 'orders' ? (
        <OrdersList isAdminView={true} />
      ) : (
        <div>
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-lg font-bold text-gray-950">Products Catalogue</h2>
              <p className="text-xs text-gray-500">Current active listings available to buyers.</p>
            </div>
            <button
              onClick={onAddProductClick}
              className="flex items-center gap-1.5 rounded-xl bg-gray-950 px-4 py-2.5 text-xs font-semibold text-white shadow-md shadow-gray-950/10 hover:bg-gray-800 transition-all active:scale-95"
            >
              <Plus className="h-4 w-4" />
              Add Product
            </button>
          </div>

          {/* Products Table/List */}
          <div className="overflow-x-auto rounded-2xl border border-gray-100 bg-white">
            <table className="w-full border-collapse text-left text-sm">
              <thead className="bg-gray-50/75 text-xs font-bold uppercase tracking-wider text-gray-400 border-b border-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-4">Item</th>
                  <th scope="col" className="px-6 py-4">Category</th>
                  <th scope="col" className="px-6 py-4">Price</th>
                  <th scope="col" className="px-6 py-4">Stock</th>
                  <th scope="col" className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50 font-medium">
                {products.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-10 text-center text-xs text-gray-500">
                      No products found. Add your first product catalog listing above!
                    </td>
                  </tr>
                ) : (
                  products.map((product) => {
                    const formattedPrice = (product.price / 100).toLocaleString('en-US', {
                      style: 'currency',
                      currency: 'USD',
                    });

                    return (
                      <tr key={product.id} className="hover:bg-gray-50/30 transition-all">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <img
                              src={product.imageUrl}
                              alt={product.name}
                              className="h-10 w-10 rounded-lg object-cover bg-gray-50 border border-gray-100"
                              referrerPolicy="no-referrer"
                            />
                            <div>
                              <div className="font-bold text-gray-950 text-sm">{product.name}</div>
                              <div className="text-xs text-gray-400 font-medium line-clamp-1 max-w-xs">{product.description}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className="rounded-full bg-gray-100 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-gray-600">
                            {product.category}
                          </span>
                        </td>
                        <td className="px-6 py-4 font-mono font-bold text-gray-950">
                          {formattedPrice}
                        </td>
                        <td className="px-6 py-4">
                          {product.stock <= 0 ? (
                            <span className="text-xs font-bold text-red-600">Out of stock</span>
                          ) : product.stock <= 3 ? (
                            <span className="text-xs font-bold text-amber-600">Low Stock ({product.stock})</span>
                          ) : (
                            <span className="text-xs font-bold text-gray-600">{product.stock} units</span>
                          )}
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => onEditProductClick(product)}
                              className="rounded-lg p-1.5 text-gray-500 hover:bg-gray-50 hover:text-gray-900 transition-all active:scale-95"
                              title="Edit product"
                            >
                              <Edit className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => onDeleteProduct(product)}
                              className="rounded-lg p-1.5 text-red-500 hover:bg-red-50 hover:text-red-700 transition-all active:scale-95"
                              title="Delete product"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
