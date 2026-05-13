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
    
    // Refresh orders every 5 seconds instead of real-time
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

  const handleExportCSV = async () => {
    const csv = [
      ['Order ID', 'Customer ID', 'Product', 'Qty', 'Address', 'Status', 'Created'].join(','),
      ...filteredOrders.map(o => [
        o.id,
        o.telegram_user_id,
        o.product_name,
        o.quantity,
        `"${o.address}"`,
        o.status,
        new Date(o.created_at).toLocaleString()
      ].join(','))
    ].join('\n')

    const blob = new Blob([csv], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `vanta-orders-${new Date().toISOString().split('T')[0]}.csv`
    a.click()
  }

  return (
    <div className="space-y-6">
      {/* Controls */}
      <div className="flex gap-4 items-center flex-wrap">
        <div className="flex gap-2">
          {['all', 'pending', 'confirmed', 'delivered'].map(status => (
            <button
              key={status}
              onClick={() => setFilter(status)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                filter === status
                  ? 'bg-blue-600 text-white'
                  : 'bg-dark-secondary text-gray-400 hover:text-white'
              }`}
            >
              {status.charAt(0).toUpperCase() + status.slice(1)}
            </button>
          ))}
        </div>
        <button
          onClick={handleExportCSV}
          className="ml-auto px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm font-medium transition"
        >
          📥 Export CSV
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-dark-secondary rounded-lg p-4 border border-dark-tertiary">
          <p className="text-gray-400 text-sm mb-1">Total Orders</p>
          <p className="text-3xl font-bold">{orders.length}</p>
        </div>
        <div className="bg-dark-secondary rounded-lg p-4 border border-dark-tertiary">
          <p className="text-gray-400 text-sm mb-1">Pending</p>
          <p className="text-3xl font-bold text-yellow-400">{orders.filter(o => o.status === 'pending').length}</p>
        </div>
        <div className="bg-dark-secondary rounded-lg p-4 border border-dark-tertiary">
          <p className="text-gray-400 text-sm mb-1">Confirmed</p>
          <p className="text-3xl font-bold text-blue-400">{orders.filter(o => o.status === 'confirmed').length}</p>
        </div>
        <div className="bg-dark-secondary rounded-lg p-4 border border-dark-tertiary">
          <p className="text-gray-400 text-sm mb-1">Delivered</p>
          <p className="text-3xl font-bold text-green-400">{orders.filter(o => o.status === 'delivered').length}</p>
        </div>
      </div>

      {/* Orders List */}
      <div className="bg-dark-secondary rounded-lg border border-dark-tertiary overflow-hidden">
        {isLoading ? (
          <div className="p-8 text-center text-gray-400">Loading orders...</div>
        ) : filteredOrders.length === 0 ? (
          <div className="p-8 text-center text-gray-400">No orders found</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-dark-tertiary bg-dark/50">
                  <th className="px-6 py-3 text-left text-gray-400 font-medium">Order ID</th>
                  <th className="px-6 py-3 text-left text-gray-400 font-medium">Product</th>
                  <th className="px-6 py-3 text-left text-gray-400 font-medium">Qty</th>
                  <th className="px-6 py-3 text-left text-gray-400 font-medium">Address</th>
                  <th className="px-6 py-3 text-left text-gray-400 font-medium">Status</th>
                  <th className="px-6 py-3 text-left text-gray-400 font-medium">Created</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-dark-tertiary">
                {filteredOrders.map(order => (
                  <tr key={order.id} className="hover:bg-dark/50 transition">
                    <td className="px-6 py-4 text-blue-400 font-mono text-xs">{order.id.slice(0, 8)}</td>
                    <td className="px-6 py-4">{order.product_name}</td>
                    <td className="px-6 py-4">{order.quantity}x</td>
                    <td className="px-6 py-4 text-gray-400 text-xs max-w-xs truncate">{order.address}</td>
                    <td className="px-6 py-4">
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                        order.status === 'pending' ? 'bg-yellow-900/30 text-yellow-400' :
                        order.status === 'confirmed' ? 'bg-blue-900/30 text-blue-400' :
                        'bg-green-900/30 text-green-400'
                      }`}>
                        {order.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-gray-400 text-xs">{new Date(order.created_at).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
