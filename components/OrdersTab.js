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
    
    // Refresh orders every 5 seconds
    const interval = setInterval(loadOrders, 5000)
    
    return () => clearInterval(interval)
  }, [])

  async function loadOrders() {
    setIsLoading(true)
    try {
      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Error loading orders:', error)
        setOrders([])
      } else {
        console.log('Orders loaded:', data)
        setOrders(data || [])
      }
    } catch (err) {
      console.error('Exception loading orders:', err)
    } finally {
      setIsLoading(false)
    }
  }

  const filteredOrders = filter === 'all' ? orders : orders.filter(o => o.status === filter)

  const totalRevenue = filteredOrders.reduce((sum, o) => sum + (o.total_amount || 0), 0)

  return (
    <div className="space-y-6">
      {/* Filter Buttons */}
      <div className="flex gap-2 flex-wrap">
        {['all', 'pending', 'completed', 'cancelled'].map(status => (
          <button
            key={status}
            onClick={() => setFilter(status)}
            className={`px-4 py-2 rounded-lg font-medium transition text-sm ${
              filter === status
                ? 'bg-blue-600 text-white'
                : 'bg-dark-secondary text-gray-400 hover:text-white'
            }`}
          >
            {status.charAt(0).toUpperCase() + status.slice(1)} ({orders.filter(o => o.status === status).length})
          </button>
        ))}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-dark-secondary rounded-lg p-4 border border-dark-tertiary">
          <p className="text-gray-400 text-sm mb-1">Total Orders</p>
          <p className="text-2xl font-bold">{filteredOrders.length}</p>
        </div>
        <div className="bg-dark-secondary rounded-lg p-4 border border-dark-tertiary">
          <p className="text-gray-400 text-sm mb-1">Total Revenue</p>
          <p className="text-2xl font-bold text-green-400">AED {totalRevenue}</p>
        </div>
        <div className="bg-dark-secondary rounded-lg p-4 border border-dark-tertiary">
          <p className="text-gray-400 text-sm mb-1">Avg Order</p>
          <p className="text-2xl font-bold">AED {filteredOrders.length > 0 ? Math.round(totalRevenue / filteredOrders.length) : 0}</p>
        </div>
      </div>

      {/* Orders Grid */}
      <div className="space-y-3">
        {isLoading ? (
          <div className="text-center text-gray-400 py-8">Loading orders...</div>
        ) : filteredOrders.length === 0 ? (
          <div className="text-center text-gray-400 py-8">No orders found</div>
        ) : (
          filteredOrders.map(order => (
            <div key={order.id} className="bg-dark-secondary rounded-lg border border-dark-tertiary p-4 hover:border-dark-tertiary/60 transition">
              {/* Header */}
              <div className="flex justify-between items-start mb-3">
                <div>
                  <p className="font-mono text-xs text-gray-500 mb-1">Order #{order.id.slice(0, 8).toUpperCase()}</p>
                  <p className="text-sm text-white font-medium">{order.product_name}</p>
                </div>
                <span className={`px-3 py-1 rounded text-xs font-medium whitespace-nowrap ${
                  order.status === 'pending' ? 'bg-yellow-900/30 text-yellow-400' :
                  order.status === 'completed' ? 'bg-green-900/30 text-green-400' :
                  'bg-red-900/30 text-red-400'
                }`}>
                  {order.status}
                </span>
              </div>

              {/* Grid Info */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-3">
                <div>
                  <p className="text-gray-400 text-xs uppercase tracking-wide">Qty</p>
                  <p className="text-white font-medium">{order.quantity}</p>
                </div>
                <div>
                  <p className="text-gray-400 text-xs uppercase tracking-wide">Total</p>
                  <p className="text-white font-medium">AED {order.total_amount || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-gray-400 text-xs uppercase tracking-wide">Delivery</p>
                  <p className="text-white text-sm">{order.delivery_date || 'ASAP'}</p>
                </div>
                <div>
                  <p className="text-gray-400 text-xs uppercase tracking-wide">Customer</p>
                  <p className="text-white font-mono text-sm">{order.telegram_user_id}</p>
                </div>
              </div>

              {/* Address */}
              <div className="mb-3 pt-3 border-t border-dark-tertiary">
                <p className="text-gray-400 text-xs uppercase tracking-wide mb-1">Delivery Address</p>
                <p className="text-white text-sm break-words">{order.address}</p>
              </div>

              {/* Footer */}
              <div className="flex justify-between items-center pt-3 border-t border-dark-tertiary text-xs text-gray-500">
                <span>{new Date(order.created_at).toLocaleDateString()} {new Date(order.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
