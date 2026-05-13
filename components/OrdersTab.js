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
  const [selectedOrder, setSelectedOrder] = useState(null)
  const [conversations, setConversations] = useState([])
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')

  useEffect(() => {
    loadOrders()
    const interval = setInterval(loadOrders, 5000)
    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    if (selectedOrder) {
      loadConversations(selectedOrder.telegram_user_id)
    }
  }, [selectedOrder])

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

  async function loadConversations(userId) {
    try {
      const { data, error } = await supabase
        .from('conversations')
        .select('*')
        .eq('telegram_user_id', userId)
        .order('created_at', { ascending: true })

      if (error) throw error
      setConversations(data || [])
    } catch (err) {
      console.error('Error loading conversations:', err)
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
      if (selectedOrder?.id === orderId) {
        setSelectedOrder({ ...selectedOrder, delivery_status: 'delivered' })
      }
    } catch (err) {
      console.error('Error updating order:', err)
    }
  }

  async function cancelOrder(orderId) {
    try {
      const { error } = await supabase
        .from('orders')
        .update({ delivery_status: 'cancelled', status: 'cancelled' })
        .eq('id', orderId)

      if (error) throw error
      await loadOrders()
      if (selectedOrder?.id === orderId) {
        setSelectedOrder({ ...selectedOrder, delivery_status: 'cancelled' })
      }
    } catch (err) {
      console.error('Error cancelling order:', err)
    }
  }

  const filteredOrders = (filter === 'all' 
    ? orders 
    : orders.filter(o => o.delivery_status === filter)).filter(o => {
      const orderDate = new Date(o.created_at)
      if (startDate && new Date(startDate) > orderDate) return false
      if (endDate) {
        const endOfDay = new Date(endDate)
        endOfDay.setHours(23, 59, 59, 999)
        if (endOfDay < orderDate) return false
      }
      return true
    })

  const stats = {
    total: orders.length,
    pending: orders.filter(o => o.delivery_status === 'pending').length,
    delivered: orders.filter(o => o.delivery_status === 'delivered').length,
  }

  return (
    <div className="space-y-6">
      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { label: 'Total Orders', value: stats.total, color: 'from-slate-500 to-slate-600' },
          { label: 'Pending', value: stats.pending, color: 'from-amber-500 to-amber-600' },
          { label: 'Delivered', value: stats.delivered, color: 'from-emerald-500 to-emerald-600' }
        ].map((stat, idx) => (
          <div
            key={idx}
            className="relative rounded-2xl backdrop-blur-xl bg-gradient-to-br from-white/40 to-white/20 dark:from-white/5 dark:to-white/10 border border-white/50 dark:border-white/10 p-6 overflow-hidden"
          >
            <div className={`absolute inset-0 bg-gradient-to-br ${stat.color} opacity-5`}></div>
            <p className="text-slate-600 dark:text-slate-400 text-sm font-medium mb-2 relative z-10">
              {stat.label}
            </p>
            <p className="text-3xl font-semibold text-slate-900 dark:text-white relative z-10">
              {stat.value}
            </p>
          </div>
        ))}
      </div>

      {/* Date Filters */}
      <div className="rounded-2xl backdrop-blur-xl bg-gradient-to-br from-white/40 to-white/20 dark:from-white/5 dark:to-white/10 border border-white/50 dark:border-white/10 p-6">
        <p className="text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wide mb-4">
          📅 Filter by Date
        </p>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div>
            <label className="block text-xs text-slate-600 dark:text-slate-400 mb-2">From</label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-white/50 dark:bg-slate-900/50 border border-white/30 dark:border-white/10 text-slate-900 dark:text-white text-sm focus:outline-none focus:border-blue-500 transition"
            />
          </div>
          <div>
            <label className="block text-xs text-slate-600 dark:text-slate-400 mb-2">To</label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-white/50 dark:bg-slate-900/50 border border-white/30 dark:border-white/10 text-slate-900 dark:text-white text-sm focus:outline-none focus:border-blue-500 transition"
            />
          </div>
          {(startDate || endDate) && (
            <div className="sm:col-span-2 flex items-end">
              <button
                onClick={() => {
                  setStartDate('')
                  setEndDate('')
                }}
                className="w-full px-3 py-2 bg-slate-200 dark:bg-slate-800 text-slate-900 dark:text-white text-sm font-medium rounded-lg hover:bg-slate-300 dark:hover:bg-slate-700 transition"
              >
                Clear Dates
              </button>
            </div>
          )}
        </div>
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

      {/* Compact Orders Table */}
      <div className="rounded-2xl backdrop-blur-xl bg-gradient-to-br from-white/40 to-white/20 dark:from-white/5 dark:to-white/10 border border-white/50 dark:border-white/10 overflow-hidden">
        {isLoading ? (
          <div className="text-center py-12 text-slate-500 dark:text-slate-400">Loading orders...</div>
        ) : filteredOrders.length === 0 ? (
          <div className="text-center py-12 text-slate-500 dark:text-slate-400">No orders found</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-white/20 dark:border-white/10">
                  <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wide">
                    Order
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wide">
                    Customer
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wide">
                    Product
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wide">
                    Amount
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wide">
                    Status
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wide">
                    Date
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/10 dark:divide-white/5">
                {filteredOrders.map(order => (
                  <tr
                    key={order.id}
                    onClick={() => setSelectedOrder(order)}
                    className="cursor-pointer hover:bg-white/20 dark:hover:bg-white/5 transition group"
                  >
                    <td className="px-6 py-4 text-sm font-mono text-slate-900 dark:text-slate-300">
                      {order.id.slice(0, 8).toUpperCase()}
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-900 dark:text-slate-300 font-medium">
                      {order.customer_name}
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-700 dark:text-slate-400">
                      {order.product_name.split(',')[0]}
                    </td>
                    <td className="px-6 py-4 text-sm font-semibold text-slate-900 dark:text-white">
                      AED {order.total_amount}
                    </td>
                    <td className="px-6 py-4 text-sm">
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                        order.delivery_status === 'pending'
                          ? 'bg-amber-100/50 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400'
                          : 'bg-emerald-100/50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400'
                      }`}>
                        {order.delivery_status === 'pending' ? '⏳ Pending' : '✅ Delivered'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-500 dark:text-slate-400">
                      {new Date(order.created_at).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Order Detail Modal */}
      {selectedOrder && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-950 rounded-3xl max-w-4xl w-full max-h-96 overflow-y-auto border border-slate-200 dark:border-slate-800 shadow-2xl">
            <div className="sticky top-0 bg-white dark:bg-slate-950 border-b border-slate-200 dark:border-slate-800 p-6 flex justify-between items-center">
              <div>
                <p className="text-sm text-slate-500 dark:text-slate-400 font-mono mb-1">
                  Order {selectedOrder.id.slice(0, 8).toUpperCase()}
                </p>
                <h3 className="text-2xl font-semibold text-slate-900 dark:text-white">
                  {selectedOrder.customer_name}
                </h3>
              </div>
              <button
                onClick={() => setSelectedOrder(null)}
                className="text-2xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition"
              >
                ✕
              </button>
            </div>

            <div className="p-6 grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Order Details */}
              <div className="space-y-6">
                <div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-2">
                    Order Details
                  </p>
                  <div className="space-y-3">
                    <div>
                      <p className="text-sm text-slate-600 dark:text-slate-400">Product</p>
                      <p className="text-slate-900 dark:text-white font-medium">{selectedOrder.product_name}</p>
                    </div>
                    <div>
                      <p className="text-sm text-slate-600 dark:text-slate-400">Quantity</p>
                      <p className="text-slate-900 dark:text-white font-medium">{selectedOrder.quantity} units</p>
                    </div>
                    <div>
                      <p className="text-sm text-slate-600 dark:text-slate-400">Total Amount</p>
                      <p className="text-2xl font-semibold text-slate-900 dark:text-white">
                        AED {selectedOrder.total_amount}
                      </p>
                    </div>
                  </div>
                </div>

                <div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-2">
                    Customer Info
                  </p>
                  <div className="space-y-3">
                    <div>
                      <p className="text-sm text-slate-600 dark:text-slate-400">Phone</p>
                      <p className="text-slate-900 dark:text-white font-medium">{selectedOrder.customer_phone}</p>
                    </div>
                    <div>
                      <p className="text-sm text-slate-600 dark:text-slate-400">Address</p>
                      <p className="text-slate-900 dark:text-white">{selectedOrder.address}</p>
                    </div>
                    <div>
                      <p className="text-sm text-slate-600 dark:text-slate-400">Delivery Date</p>
                      <p className="text-slate-900 dark:text-white">{selectedOrder.delivery_date}</p>
                    </div>
                  </div>
                </div>

                <div className="flex gap-2">
                  {selectedOrder.delivery_status === 'pending' && (
                    <>
                      <button
                        onClick={() => markAsDelivered(selectedOrder.id)}
                        className="flex-1 px-4 py-2 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white font-medium rounded-lg transition-all"
                      >
                        ✓ Mark Delivered
                      </button>
                      <button
                        onClick={() => cancelOrder(selectedOrder.id)}
                        className="flex-1 px-4 py-2 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white font-medium rounded-lg transition-all"
                      >
                        ✕ Cancel Order
                      </button>
                    </>
                  )}
                  <button
                    onClick={() => setSelectedOrder(null)}
                    className="px-4 py-2 bg-slate-200 dark:bg-slate-800 text-slate-900 dark:text-white font-medium rounded-lg hover:bg-slate-300 dark:hover:bg-slate-700 transition"
                  >
                    Close
                  </button>
                </div>
              </div>

              {/* Conversation Thread */}
              <div className="bg-slate-50 dark:bg-slate-900/50 rounded-xl p-4 flex flex-col h-64">
                <p className="text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-3 font-semibold">
                  Conversation
                </p>
                <div className="flex-1 overflow-y-auto space-y-2 mb-3">
                  {conversations.length === 0 ? (
                    <p className="text-sm text-slate-500 dark:text-slate-400 text-center py-4">
                      No messages yet
                    </p>
                  ) : (
                    conversations.map((msg, idx) => (
                      <div
                        key={idx}
                        className={`flex ${msg.event_type === 'ADMIN_REPLY' ? 'justify-end' : 'justify-start'}`}
                      >
                        <div
                          className={`max-w-xs px-3 py-2 rounded-lg text-xs ${
                            msg.event_type === 'ADMIN_REPLY'
                              ? 'bg-blue-500 text-white rounded-br-none'
                              : 'bg-slate-200 dark:bg-slate-800 text-slate-900 dark:text-slate-100 rounded-bl-none'
                          }`}
                        >
                          {msg.event_data}
                        </div>
                      </div>
                    ))
                  )}
                </div>
                <button
                  onClick={() => {
                    setSelectedOrder(null)
                    setActiveTab('conversations')
                  }}
                  className="w-full px-3 py-2 bg-blue-500 hover:bg-blue-600 text-white text-sm font-medium rounded-lg transition"
                >
                  💬 Full Chat
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
