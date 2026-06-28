import React, { useState, useEffect } from 'react';
import { Order } from '../types.ts';
import { useAuth } from '../context/AuthContext.tsx';
import { ShoppingBag, Calendar, MapPin, DollarSign, Clock, RefreshCw, ChevronDown, ChevronUp, Truck, Package, CheckCircle2, XCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface OrdersListProps {
  isAdminView?: boolean;
}

export const OrdersList: React.FC<OrdersListProps> = ({ isAdminView = false }) => {
  const { token, dbUser } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedOrders, setExpandedOrders] = useState<Record<number, boolean>>({});

  const fetchOrders = async () => {
    if (!token) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/orders', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to fetch orders');
      }
      setOrders(data);
    } catch (e: any) {
      setError(e.message || 'Failed to load orders');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, [token, isAdminView]);

  const toggleExpand = (orderId: number) => {
    setExpandedOrders(prev => ({
      ...prev,
      [orderId]: !prev[orderId],
    }));
  };

  const handleUpdateStatus = async (orderId: number, newStatus: string) => {
    if (!token) return;
    try {
      const res = await fetch(`/api/orders/${orderId}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ status: newStatus }),
      });
      const updatedOrder = await res.json();
      if (!res.ok) {
        throw new Error(updatedOrder.error || 'Failed to update order status');
      }

      // Update state
      setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: updatedOrder.status } : o));
    } catch (e: any) {
      alert(e.message || 'Failed to update status');
    }
  };

  const getStatusBadge = (status: Order['status']) => {
    const base = 'rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider ';
    switch (status) {
      case 'pending':
        return <span className={`${base} bg-amber-100 text-amber-800`}>Pending</span>;
      case 'processing':
        return <span className={`${base} bg-blue-100 text-blue-800`}>Processing</span>;
      case 'shipped':
        return <span className={`${base} bg-purple-100 text-purple-800`}>Shipped</span>;
      case 'completed':
        return <span className={`${base} bg-green-100 text-green-800`}>Delivered</span>;
      case 'cancelled':
        return <span className={`${base} bg-red-100 text-red-800`}>Cancelled</span>;
      default:
        return <span className={`${base} bg-gray-100 text-gray-800`}>{status}</span>;
    }
  };

  const getStatusStepIndex = (status: Order['status']) => {
    switch (status) {
      case 'pending': return 0;
      case 'processing': return 1;
      case 'shipped': return 2;
      case 'completed': return 3;
      default: return -1;
    }
  };

  const renderProgressIndicator = (status: Order['status']) => {
    if (status === 'cancelled') {
      return (
        <div className="rounded-xl bg-red-50/60 border border-red-100 p-3.5 flex items-center gap-3">
          <XCircle className="h-5 w-5 text-red-600 shrink-0" />
          <div>
            <span className="font-bold text-red-950 text-xs block">Order Cancelled</span>
            <span className="text-red-600/80 text-[10px] block mt-0.5">This transaction has been terminated and fully voided.</span>
          </div>
        </div>
      );
    }

    const currentStep = getStatusStepIndex(status);
    const steps = [
      { label: 'Placed', desc: 'Order received', icon: ShoppingBag },
      { label: 'Processing', desc: 'Preparing item', icon: Package },
      { label: 'Shipped', desc: 'In transit', icon: Truck },
      { label: 'Delivered', desc: 'Received', icon: CheckCircle2 },
    ];

    return (
      <div className="bg-white rounded-xl border border-gray-100 p-4 sm:p-5">
        <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400 block mb-4 px-1">
          Fulfillment Status
        </span>
        <div className="relative flex items-center justify-between">
          {/* Background Connecting Line */}
          <div className="absolute left-6 right-6 top-5 h-0.5 bg-gray-100 z-0" />
          
          {/* Active Connecting Line Progress */}
          <div 
            className="absolute left-6 top-5 h-0.5 bg-gray-950 transition-all duration-500 z-0"
            style={{ 
              width: `${(currentStep / (steps.length - 1)) * 100}%`,
              maxWidth: 'calc(100% - 3rem)' 
            }} 
          />

          {steps.map((step, idx) => {
            const StepIcon = step.icon;
            const isCompleted = idx < currentStep;
            const isActive = idx === currentStep;
            const isUpcoming = idx > currentStep;

            return (
              <div key={idx} className="flex flex-col items-center flex-1 text-center relative z-10">
                {/* Circle Icon */}
                <div 
                  className={`flex h-10 w-10 items-center justify-center rounded-full transition-all duration-300 ${
                    isCompleted 
                      ? 'bg-gray-950 text-white' 
                      : isActive 
                        ? 'bg-white border-2 border-gray-950 text-gray-950 ring-4 ring-gray-100 font-bold' 
                        : 'bg-white border border-gray-200 text-gray-400'
                  }`}
                >
                  {isCompleted ? (
                    <CheckCircle2 className="h-5 w-5" />
                  ) : (
                    <StepIcon className="h-4.5 w-4.5" />
                  )}
                </div>

                {/* Step labels */}
                <span 
                  className={`text-[10px] sm:text-[11px] font-bold mt-2 transition-colors ${
                    isActive ? 'text-gray-950' : isCompleted ? 'text-gray-950' : 'text-gray-400'
                  }`}
                >
                  {step.label}
                </span>
                <span className="text-[9px] text-gray-400 font-medium hidden sm:block mt-0.5 max-w-[80px] leading-tight">
                  {step.desc}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-gray-400">
        <RefreshCw className="h-8 w-8 animate-spin mb-3 text-gray-950" />
        <p className="text-xs">Synchronizing order logs...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="mx-auto max-w-2xl rounded-2xl bg-red-50 p-4 text-center text-xs font-semibold text-red-700 my-8">
        {error}
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-gray-950">
            {isAdminView ? 'All Orders Management' : 'Your Order History'}
          </h2>
          <p className="text-xs text-gray-500 mt-1">
            {isAdminView 
              ? 'Oversee and update order fulfillment processes for all customers.' 
              : 'Track status and details of your previous purchases.'}
          </p>
        </div>
        <button
          onClick={fetchOrders}
          className="flex items-center gap-1.5 rounded-xl border border-gray-200 bg-white px-3.5 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-50 active:scale-95 transition-all shadow-sm"
        >
          <RefreshCw className="h-3.5 w-3.5" />
          Refresh Log
        </button>
      </div>

      {orders.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-gray-200 bg-white p-12 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-gray-50 text-gray-400 mb-4">
            <ShoppingBag className="h-6 w-6" />
          </div>
          <h3 className="text-sm font-semibold text-gray-900">No orders found</h3>
          <p className="mt-1 text-xs text-gray-500">
            {isAdminView ? 'No customer orders have been logged yet.' : 'Explore our catalog and place your first order!'}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map((order, idx) => {
            const isExpanded = !!expandedOrders[order.id];
            const orderDate = new Date(order.createdAt).toLocaleDateString('en-US', {
              year: 'numeric',
              month: 'long',
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
            });
            const formattedTotal = (order.total / 100).toLocaleString('en-US', {
              style: 'currency',
              currency: 'USD',
            });

            return (
              <motion.div
                layout
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.05 }}
                key={order.id}
                className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm transition-shadow hover:shadow-md"
              >
                {/* Header Summary */}
                <div 
                  onClick={() => toggleExpand(order.id)}
                  className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 cursor-pointer hover:bg-gray-50/50 transition-all select-none"
                >
                  <div className="flex items-center gap-4">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-50 text-gray-700">
                      <ShoppingBag className="h-5 w-5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-gray-950 font-mono">
                          ORDER #{order.id}
                        </span>
                        {getStatusBadge(order.status)}
                      </div>
                      <div className="flex items-center gap-3 text-xs text-gray-400 mt-1 font-medium">
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3.5 w-3.5 text-gray-300" />
                          {orderDate}
                        </span>
                        {isAdminView && order.user && (
                          <span className="rounded-full bg-gray-100 px-2 py-0.5 text-[10px] text-gray-600 font-bold">
                            User: {order.user.email}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between sm:justify-end gap-6 border-t border-gray-50 sm:border-0 pt-3 sm:pt-0">
                    <div className="text-left sm:text-right">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Total Charged</span>
                      <p className="font-mono font-bold text-base text-gray-950 mt-0.5">{formattedTotal}</p>
                    </div>
                    <div>
                      {isExpanded ? <ChevronUp className="h-5 w-5 text-gray-400" /> : <ChevronDown className="h-5 w-5 text-gray-400" />}
                    </div>
                  </div>
                </div>

                {/* Expanded Details */}
                <AnimatePresence>
                  {isExpanded && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="border-t border-gray-50 bg-gray-50/30 px-5 py-4 space-y-4 overflow-hidden"
                    >
                      {/* Visual Status Progress Indicator */}
                      {renderProgressIndicator(order.status)}

                      {/* Shipping Address */}
                      <div className="flex items-start gap-2 text-xs text-gray-600 bg-white rounded-xl p-3 border border-gray-100">
                        <MapPin className="h-4 w-4 text-gray-400 shrink-0 mt-0.5" />
                        <div>
                          <span className="font-bold text-gray-950 block">Shipping Location</span>
                          <span className="text-gray-500 mt-0.5 block">{order.shippingAddress}</span>
                        </div>
                      </div>

                      {/* Items List */}
                      <div className="space-y-2">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400 block px-1">Purchased Items</span>
                        {order.items?.map((item) => {
                          const itemTotalFormatted = ((item.price * item.quantity) / 100).toLocaleString('en-US', {
                            style: 'currency',
                            currency: 'USD',
                          });

                          return (
                            <div 
                              key={item.id}
                              className="flex items-center justify-between gap-4 rounded-xl border border-gray-50 p-2.5 bg-white"
                            >
                              <div className="flex items-center gap-3">
                                {item.product?.imageUrl ? (
                                  <img 
                                    src={item.product.imageUrl} 
                                    alt={item.product.name} 
                                    className="h-10 w-10 rounded-lg object-cover bg-gray-50 border border-gray-100 shrink-0"
                                    referrerPolicy="no-referrer"
                                  />
                                ) : (
                                  <div className="h-10 w-10 bg-gray-100 rounded-lg flex items-center justify-center shrink-0" />
                                )}
                                <div>
                                  <h4 className="text-xs font-bold text-gray-950">
                                    {item.product?.name || 'Deleted Product'}
                                  </h4>
                                  <span className="text-[10px] text-gray-400 font-mono">
                                    {item.quantity}x @ {((item.price) / 100).toLocaleString('en-US', { style: 'currency', currency: 'USD' })}
                                  </span>
                                </div>
                              </div>
                              <span className="font-mono font-bold text-xs text-gray-950">
                                {itemTotalFormatted}
                              </span>
                            </div>
                          );
                        })}
                      </div>

                      {/* Status changer for Admins */}
                      {isAdminView && dbUser?.role === 'admin' && (
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-t border-gray-100 pt-4 px-1">
                          <div className="flex items-center gap-2 text-xs font-semibold text-gray-600">
                            <Clock className="h-4 w-4 text-amber-500" />
                            Update Shipment/Fulfillment Status:
                          </div>
                          <select
                            value={order.status}
                            onChange={(e) => handleUpdateStatus(order.id, e.target.value)}
                            className="rounded-xl border border-gray-200 bg-white px-3 py-1.5 text-xs text-gray-950 focus:border-gray-950 focus:outline-none"
                          >
                            <option value="pending">Pending</option>
                            <option value="processing">Processing</option>
                            <option value="shipped">Shipped</option>
                            <option value="completed">Delivered (Completed)</option>
                            <option value="cancelled">Cancelled</option>
                          </select>
                        </div>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
};
