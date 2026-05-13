'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL?.trim(),
  process.env.NEXT_PUBLIC_SUPABASE_KEY?.replace(/\s/g, '')
)

export default function OrdersTab({ setActiveTab }) {
  const [orders, setOrders] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [filter, setFilter] = useState('all')

  useEffect(() => {
    loadOrders()
    const interval = setInterval(loadOrders, 5000)
    return () => clearInterval(interval)
  }, [])

  async function loadOrders() {
    try {
      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error
      setOrders(data || [])
    } catch (err) {
      console.error('Error loading orders:', err)
    } finally {
      setIsLoading(false)
    }
  }

  async function markAsDelivered(orderId, e) {
    e.stopPropagation()
    try {
      const { error } = await supabase
        .from('orders')
        .update({ delivery_status: 'delivered', status: 'completed' })
        .eq('id', orderId)

      if (error) throw error
      await loadOrders()
    } catch (err) {
      console.error('Error updating order:', err)
    }
  }

  const filteredOrders = filter === 'all' 
    ? orders 
    : orders.filter(o => o.delivery_status === filter)

  const stats = {
    total: orders.length,
    pending: orders.filter(o => o.delivery_status === 'pending').length,
    delivered: orders.filter(o => o.delivery_status === 'delivered').length,
    revenue: orders.reduce((sum, o) => sum + (o.total_amount || 0), 0),
    collectedCash: orders
      .filter(o => o.delivery_status === 'delivered')
      .reduce((sum, o) => sum + (o.total_amount || 0), 0)
  }

  return (
    <div className="space-y-8">
      {/* Stats Grid with Glass Effect */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total Orders', value: stats.total, color: 'from-slate-500 to-slate-600' },
          { label: 'Pending', value: stats.pending, color: 'from-amber-500 to-amber-600' },
          { label: 'Delivered', value: stats.delivered, color: 'from-emerald-500 to-emerald-600' },
          { label: 'Cash Collected', value: `AED ${stats.collectedCash}`, color: 'from-blue-500 to-blue-600' }
        ].map((stat, idx) => (
          <div
            key={idx}
            className="relative rounded-2xl backdrop-blur-xl bg-gradient-to-br from-white/40 to-white/20 dark:from-white/5 dark:to-white/10 border border-white/50 dark:border-white/10 p-6 overflow-hidden group hover:border-white/70 dark:hover:border-white/20 transition"
          >
            <div className={`absolute inset-0 bg-gradient-to-br ${stat.color} opacity-5 group-hover:opacity-10 transition`}></div>
            <p className="text-slate-600 dark:text-slate-400 text-sm font-medium mb-2 relative z-10">
              {stat.label}
            </p>
            <p className="text-4xl font-semibold text-slate-900 dark:text-white relative z-10">
              {stat.value}
            </p>
          </div>
        ))}
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2 border-b border-slate-200 dark:border-slate-800 pb-4">
        {['all', 'pending', 'delivered'].map(status => (
          <button
            key={status}
            onClick={() => setFilter(status)}
            className={`px-3 py-2 rounded-lg text-sm font-medium transition ${
              filter === status
                ? 'bg-slate-900 dark:bg-white text-white dark:text-black'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            {status === 'all' ? 'All Orders' : status === 'pending' ? 'Pending' : 'Delivered'}
          </button>
        ))}
      </div>

      {/* Orders List */}
      <div className="space-y-4">
        {isLoading ? (
          <div className="text-center py-12 text-slate-500 dark:text-slate-400">Loading orders...</div>
        ) : filteredOrders.length === 0 ? (
          <div className="text-center py-12 text-slate-500 dark:text-slate-400">No orders found</div>
        ) : (
          filteredOrders.map(order => (
            <button
              key={order.id}
              onClick={() => setActiveTab('conversations')}
              className="w-full text-left rounded-2xl backdrop-blur-xl bg-gradient-to-br from-white/40 to-white/20 dark:from-white/5 dark:to-white/10 border border-white/50 dark:border-white/10 p-6 hover:border-white/70 dark:hover:border-white/20 hover:shadow-xl transition-all group"
            >
              {/* Header */}
              <div className="flex justify-between items-start mb-4">
                <div>
                  <p className="text-sm text-slate-500 dark:text-slate-400 font-mono mb-1">
                    Order {order.id.slice(0, 8).toUpperCase()}
                  </p>
                  <p className="text-lg font-semibold text-slate-900 dark:text-white group-hover:text-slate-700 dark:group-hover:text-slate-200 transition">
                    {order.product_name}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <span className={`px-3 py-1 rounded-full text-xs font-medium backdrop-blur-sm ${
                    order.delivery_status === 'pending'
                      ? 'bg-amber-100/40 dark:bg-amber-900/40 text-amber-700 dark:text-amber-400 border border-amber-200/50 dark:border-amber-800/50'
                      : 'bg-emerald-100/40 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-400 border border-emerald-200/50 dark:border-emerald-800/50'
                  }`}>
                    {order.delivery_status === 'pending' ? '⏳ Pending' : '✅ Delivered'}
                  </span>
                </div>
              </div>

              {/* Customer Info */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-4 pb-4 border-b border-slate-200/50 dark:border-slate-800/50">
                <div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-1">
                    Customer
                  </p>
                  <p className="text-slate-900 dark:text-white font-medium">{order.customer_name}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-1">
                    Phone
                  </p>
                  <p className="text-slate-900 dark:text-white">{order.customer_phone}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-1">
                    Quantity
                  </p>
                  <p className="text-slate-900 dark:text-white">{order.quantity} units</p>
                </div>
                <div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-1">
                    Total
                  </p>
                  <p className="text-slate-900 dark:text-white font-semibold text-lg">
                    AED {order.total_amount}
                  </p>
                </div>
              </div>

              {/* Delivery Info */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-4 pb-4 border-b border-slate-200/50 dark:border-slate-800/50">
                <div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-1">
                    Delivery Date
                  </p>
                  <p className="text-slate-900 dark:text-white">{order.delivery_date}</p>
                </div>
                <div className="sm:col-span-2">
                  <p className="text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-1">
                    Address
                  </p>
                  <p className="text-slate-900 dark:text-white">{order.address}</p>
                </div>
              </div>

              {/* Footer with Action */}
              <div className="flex justify-between items-center">
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {new Date(order.created_at).toLocaleDateString()} at{' '}
                  {new Date(order.created_at).toLocaleTimeString([], {
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </p>
                {order.delivery_status === 'pending' && (
                  <button
                    onClick={(e) => markAsDelivered(order.id, e)}
                    className="px-4 py-2 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white text-sm font-medium rounded-lg transition-all"
                  >
                    ✓ Mark Delivered
                  </button>
                )}
              </div>
            </button>
          ))
        )}
      </div>
    </div>
  )
}
