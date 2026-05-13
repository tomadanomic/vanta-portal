'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL?.trim(),
  process.env.NEXT_PUBLIC_SUPABASE_KEY?.replace(/\s/g, '')
)

export default function OrdersTab() {
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

  async function markAsDelivered(orderId) {
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
      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="rounded-lg border border-gray-900 bg-gray-950/50 p-6 backdrop-blur-sm">
          <p className="text-gray-500 text-sm font-medium mb-2">Total Orders</p>
          <p className="text-4xl font-semibold text-white">{stats.total}</p>
        </div>
        <div className="rounded-lg border border-gray-900 bg-gray-950/50 p-6 backdrop-blur-sm">
          <p className="text-gray-500 text-sm font-medium mb-2">Pending Delivery</p>
          <p className="text-4xl font-semibold text-yellow-400">{stats.pending}</p>
        </div>
        <div className="rounded-lg border border-gray-900 bg-gray-950/50 p-6 backdrop-blur-sm">
          <p className="text-gray-500 text-sm font-medium mb-2">Delivered</p>
          <p className="text-4xl font-semibold text-green-400">{stats.delivered}</p>
        </div>
        <div className="rounded-lg border border-gray-900 bg-gray-950/50 p-6 backdrop-blur-sm">
          <p className="text-gray-500 text-sm font-medium mb-2">Cash Collected</p>
          <p className="text-4xl font-semibold text-blue-400">AED {stats.collectedCash}</p>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2 border-b border-gray-900 pb-4">
        {['all', 'pending', 'delivered'].map(status => (
          <button
            key={status}
            onClick={() => setFilter(status)}
            className={`px-3 py-2 rounded-lg text-sm font-medium transition ${
              filter === status
                ? 'bg-white text-black'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            {status === 'all' ? 'All Orders' : status === 'pending' ? 'Pending' : 'Delivered'}
          </button>
        ))}
      </div>

      {/* Orders List */}
      <div className="space-y-4">
        {isLoading ? (
          <div className="text-center py-12 text-gray-500">Loading orders...</div>
        ) : filteredOrders.length === 0 ? (
          <div className="text-center py-12 text-gray-500">No orders found</div>
        ) : (
          filteredOrders.map(order => (
            <div
              key={order.id}
              className="rounded-lg border border-gray-900 bg-gray-950/50 p-6 backdrop-blur-sm hover:border-gray-800 transition"
            >
              {/* Header */}
              <div className="flex justify-between items-start mb-4">
                <div>
                  <p className="text-sm text-gray-500 font-mono mb-1">Order {order.id.slice(0, 8).toUpperCase()}</p>
                  <p className="text-lg font-semibold text-white">{order.product_name}</p>
                </div>
                <div className="flex items-center gap-3">
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                    order.delivery_status === 'pending'
                      ? 'bg-yellow-900/30 text-yellow-400'
                      : 'bg-green-900/30 text-green-400'
                  }`}>
                    {order.delivery_status === 'pending' ? '⏳ Pending' : '✅ Delivered'}
                  </span>
                </div>
              </div>

              {/* Customer Info */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-4 pb-4 border-b border-gray-900">
                <div>
                  <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Customer</p>
                  <p className="text-white font-medium">{order.customer_name}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Phone</p>
                  <p className="text-white">{order.customer_phone}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Quantity</p>
                  <p className="text-white">{order.quantity} units</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Total</p>
                  <p className="text-white font-semibold text-lg">AED {order.total_amount}</p>
                </div>
              </div>

              {/* Delivery Info */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-4 pb-4 border-b border-gray-900">
                <div>
                  <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Delivery Date</p>
                  <p className="text-white">{order.delivery_date}</p>
                </div>
                <div className="sm:col-span-2">
                  <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Address</p>
                  <p className="text-white">{order.address}</p>
                </div>
              </div>

              {/* Footer with Action */}
              <div className="flex justify-between items-center">
                <p className="text-xs text-gray-600">
                  {new Date(order.created_at).toLocaleDateString()} at {new Date(order.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                </p>
                {order.delivery_status === 'pending' && (
                  <button
                    onClick={() => markAsDelivered(order.id)}
                    className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white text-sm font-medium rounded-lg transition"
                  >
                    ✓ Mark Delivered
                  </button>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
