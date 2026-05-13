'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL?.trim(),
  process.env.NEXT_PUBLIC_SUPABASE_KEY?.replace(/\s/g, '')
)

export default function RevenueTab() {
  const [orders, setOrders] = useState([])
  const [isLoading, setIsLoading] = useState(true)

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

  const delivered = orders.filter(o => o.delivery_status === 'delivered')
  const pending = orders.filter(o => o.delivery_status === 'pending')

  const stats = {
    totalRevenue: orders.reduce((sum, o) => sum + (o.total_amount || 0), 0),
    collectedCash: delivered.reduce((sum, o) => sum + (o.total_amount || 0), 0),
    pendingCash: pending.reduce((sum, o) => sum + (o.total_amount || 0), 0),
    avgOrderValue: orders.length > 0 ? Math.round(orders.reduce((sum, o) => sum + (o.total_amount || 0), 0) / orders.length) : 0,
    totalOrders: orders.length
  }

  return (
    <div className="space-y-8">
      {/* Main Stats */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="rounded-lg border border-gray-900 bg-gradient-to-br from-green-900/20 to-green-900/5 p-8 backdrop-blur-sm">
          <p className="text-gray-400 text-sm font-medium mb-2">💵 Cash Collected</p>
          <p className="text-5xl font-semibold text-green-400">AED {stats.collectedCash}</p>
          <p className="text-sm text-gray-500 mt-3">{delivered.length} delivered orders</p>
        </div>

        <div className="rounded-lg border border-gray-900 bg-gradient-to-br from-yellow-900/20 to-yellow-900/5 p-8 backdrop-blur-sm">
          <p className="text-gray-400 text-sm font-medium mb-2">⏳ Pending Cash</p>
          <p className="text-5xl font-semibold text-yellow-400">AED {stats.pendingCash}</p>
          <p className="text-sm text-gray-500 mt-3">{pending.length} pending orders</p>
        </div>

        <div className="rounded-lg border border-gray-900 bg-gradient-to-br from-blue-900/20 to-blue-900/5 p-8 backdrop-blur-sm">
          <p className="text-gray-400 text-sm font-medium mb-2">📊 Total Revenue</p>
          <p className="text-5xl font-semibold text-blue-400">AED {stats.totalRevenue}</p>
          <p className="text-sm text-gray-500 mt-3">From {stats.totalOrders} orders</p>
        </div>
      </div>

      {/* Secondary Stats */}
      <div className="grid grid-cols-2 gap-4">
        <div className="rounded-lg border border-gray-900 bg-gray-950/50 p-6 backdrop-blur-sm">
          <p className="text-gray-500 text-sm font-medium mb-2">Avg Order Value</p>
          <p className="text-3xl font-semibold text-white">AED {stats.avgOrderValue}</p>
        </div>
        <div className="rounded-lg border border-gray-900 bg-gray-950/50 p-6 backdrop-blur-sm">
          <p className="text-gray-500 text-sm font-medium mb-2">Collection Rate</p>
          <p className="text-3xl font-semibold text-white">
            {orders.length > 0 ? Math.round((delivered.length / orders.length) * 100) : 0}%
          </p>
        </div>
      </div>

      {/* Cash Flow by Product */}
      <div>
        <h3 className="text-lg font-semibold text-white mb-4">Revenue by Product</h3>
        <div className="space-y-3">
          {Object.entries(
            orders.reduce((acc, order) => {
              const product = order.product_name
              acc[product] = (acc[product] || 0) + (order.total_amount || 0)
              return acc
            }, {})
          )
            .sort(([, a], [, b]) => b - a)
            .map(([product, revenue]) => (
              <div key={product} className="rounded-lg border border-gray-900 bg-gray-950/50 p-4 backdrop-blur-sm">
                <div className="flex justify-between items-center">
                  <p className="text-white font-medium">{product}</p>
                  <p className="text-green-400 font-semibold">AED {revenue}</p>
                </div>
                <div className="mt-2 h-2 bg-gray-900 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-green-500/50"
                    style={{ width: `${(revenue / stats.totalRevenue) * 100}%` }}
                  ></div>
                </div>
              </div>
            ))}
        </div>
      </div>

      {/* Recent Collections */}
      <div>
        <h3 className="text-lg font-semibold text-white mb-4">Recent Collections</h3>
        <div className="space-y-2">
          {delivered.slice(0, 10).map(order => (
            <div key={order.id} className="flex justify-between items-center p-4 rounded-lg border border-gray-900 bg-gray-950/50 backdrop-blur-sm">
              <div>
                <p className="text-white font-medium">{order.customer_name}</p>
                <p className="text-sm text-gray-500">{order.product_name}</p>
              </div>
              <p className="text-green-400 font-semibold">AED {order.total_amount}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
