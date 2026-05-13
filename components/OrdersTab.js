'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@supabase/supabase-js'

let supabase = null

function getSupabase() {
  if (!supabase) {
    supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL?.trim(),
      process.env.NEXT_PUBLIC_SUPABASE_KEY?.replace(/\s/g, '')
    )
  }
  return supabase
}

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
    <div className="space-y-4 sm:space-y-6 w-full overflow-x-hidden">
      {/* Stats Grid - Mobile Responsive */}
      <div className="grid grid-cols-3 gap-2 sm:gap-4">
        {[
          { label: 'Total', value: stats.total, color: 'from-slate-500 to-slate-600' },
          { label: 'Pending', value: stats.pending, color: 'from-amber-500 to-amber-600' },
          { label: 'Delivered', value: stats.delivered, color: 'from-emerald-500 to-emerald-600' }
        ].map((stat, idx) => (
          <div
            key={idx}
            className="relative rounded-lg sm:rounded-2xl backdrop-blur-xl bg-gradient-to-br from-white/40 to-white/20 dark:from-white/5 dark:to-white/10 border border-white/50 dark:border-white/10 p-3 sm:p-6 overflow-hidden"
          >
            <div className={`absolute inset-0 bg-gradient-to-br ${stat.color} opacity-5`}></div>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 font-medium mb-1 sm:mb-2 relative z-10 truncate">
              {stat.label}
            </p>
            <p className="text-xl sm:text-3xl font-semibold text-slate-900 dark:text-white relative z-10">
              {stat.value}
            </p>
          </div>
        ))}
      </div>

      {/* Date Filters - Mobile Optimized */}
      <div className="rounded-lg sm:rounded-2xl backdrop-blur-xl bg-gradient-to-br from-white/40 to-white/20 dark:from-white/5 dark:to-white/10 border border-white/50 dark:border-white/10 p-3 sm:p-6">
        <p className="text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wide mb-3">
          📅 Date
        </p>
        <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="flex-1 px-3 py-2 text-sm rounded-lg bg-white/50 dark:bg-slate-900/50 border border-white/30 dark:border-white/10 text-slate-900 dark:text-white focus:outline-none focus:border-blue-500 transition"
            placeholder="From"
          />
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="flex-1 px-3 py-2 text-sm rounded-lg bg-white/50 dark:bg-slate-900/50 border border-white/30 dark:border-white/10 text-slate-900 dark:text-white focus:outline-none focus:border-blue-500 transition"
            placeholder="To"
          />
          {(startDate || endDate) && (
            <button
              onClick={() => {
                setStartDate('')
                setEndDate('')
              }}
              className="px-3 py-2 text-sm bg-slate-200 dark:bg-slate-800 text-slate-900 dark:text-white font-medium rounded-lg hover:bg-slate-300 dark:hover:bg-slate-700 transition"
            >
              Clear
            </button>
          )}
        </div>
      </div>

      {/* Filter Tabs - Mobile Compact */}
      <div className="flex gap-2 border-b border-slate-200 dark:border-slate-800 pb-3 overflow-x-auto -mx-4 px-4 sm:mx-0 sm:px-0">
        {['all', 'pending', 'delivered'].map(status => (
          <button
            key={status}
            onClick={() => setFilter(status)}
            className={`px-3 py-2 text-xs sm:text-sm font-medium whitespace-nowrap rounded-lg transition ${
              filter === status
                ? 'bg-slate-900 dark:bg-white text-white dark:text-black'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            {status === 'all' ? 'All' : status === 'pending' ? 'Pending' : 'Delivered'}
          </button>
        ))}
      </div>

      {/* Compact Orders Table - Responsive */}
      <div className="rounded-lg sm:rounded-2xl backdrop-blur-xl bg-gradient-to-br from-white/40 to-white/20 dark:from-white/5 dark:to-white/10 border border-white/50 dark:border-white/10 overflow-hidden">
        {isLoading ? (
          <div className="text-center py-8 text-slate-500 dark:text-slate-400 text-sm">Loading...</div>
        ) : filteredOrders.length === 0 ? (
          <div className="text-center py-8 text-slate-500 dark:text-slate-400 text-sm">No orders</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/20 dark:border-white/10">
                  <th className="px-3 sm:px-6 py-3 text-left text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase">
                    Order
                  </th>
                  <th className="px-3 sm:px-6 py-3 text-left text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase">
                    Customer
                  </th>
                  <th className="hidden sm:table-cell px-3 sm:px-6 py-3 text-left text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase">
                    Product
                  </th>
                  <th className="px-3 sm:px-6 py-3 text-left text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase">
                    Amount
                  </th>
                  <th className="px-3 sm:px-6 py-3 text-left text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/10 dark:divide-white/5">
                {filteredOrders.map(order => (
                  <tr
                    key={order.id}
                    onClick={() => setSelectedOrder(order)}
                    className="cursor-pointer hover:bg-white/20 dark:hover:bg-white/5 transition text-xs sm:text-sm"
                  >
                    <td className="px-3 sm:px-6 py-3 font-mono text-slate-900 dark:text-slate-300 truncate">
                      {order.id.slice(0, 6).toUpperCase()}
                    </td>
                    <td className="px-3 sm:px-6 py-3 text-slate-900 dark:text-slate-300 font-medium truncate">
                      {order.customer_name.split(' ')[0]}
                    </td>
                    <td className="hidden sm:table-cell px-3 sm:px-6 py-3 text-slate-700 dark:text-slate-400">
                      {order.product_name.split(',')[0]}
                    </td>
                    <td className="px-3 sm:px-6 py-3 font-semibold text-slate-900 dark:text-white">
                      AED {order.total_amount}
                    </td>
                    <td className="px-3 sm:px-6 py-3">
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium whitespace-nowrap ${
                        order.delivery_status === 'pending'
                          ? 'bg-amber-100/50 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400'
                          : 'bg-emerald-100/50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400'
                      }`}>
                        {order.delivery_status === 'pending' ? '⏳' : '✅'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Order Detail Modal - Mobile Safe */}
      {selectedOrder && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-3 sm:p-4">
          <div className="bg-white dark:bg-slate-950 rounded-t-3xl sm:rounded-3xl max-w-4xl w-full max-h-[90vh] sm:max-h-96 overflow-y-auto border border-slate-200 dark:border-slate-800 shadow-2xl">
            <div className="sticky top-0 bg-white dark:bg-slate-950 border-b border-slate-200 dark:border-slate-800 p-4 sm:p-6 flex justify-between items-start sm:items-center gap-2">
              <div className="min-w-0 flex-1">
                <p className="text-xs text-slate-500 dark:text-slate-400 font-mono mb-1 truncate">
                  Order {selectedOrder.id.slice(0, 6).toUpperCase()}
                </p>
                <h3 className="text-lg sm:text-2xl font-semibold text-slate-900 dark:text-white truncate">
                  {selectedOrder.customer_name}
                </h3>
              </div>
              <button
                onClick={() => setSelectedOrder(null)}
                className="flex-shrink-0 text-2xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition"
              >
                ✕
              </button>
            </div>

            <div className="p-4 sm:p-6 space-y-6 sm:grid sm:grid-cols-2 sm:gap-8">
              {/* Order Details */}
              <div className="space-y-4 sm:space-y-6">
                <div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-2 font-semibold">
                    Details
                  </p>
                  <div className="space-y-2 sm:space-y-3">
                    <div>
                      <p className="text-xs text-slate-600 dark:text-slate-400">Product</p>
                      <p className="text-sm sm:text-base text-slate-900 dark:text-white font-medium break-words">
                        {selectedOrder.product_name}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-600 dark:text-slate-400">Qty</p>
                      <p className="text-sm sm:text-base text-slate-900 dark:text-white font-medium">
                        {selectedOrder.quantity}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-600 dark:text-slate-400">Total</p>
                      <p className="text-lg sm:text-2xl font-semibold text-slate-900 dark:text-white">
                        AED {selectedOrder.total_amount}
                      </p>
                    </div>
                  </div>
                </div>

                <div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-2 font-semibold">
                    Customer
                  </p>
                  <div className="space-y-2 sm:space-y-3">
                    <div>
                      <p className="text-xs text-slate-600 dark:text-slate-400">Phone</p>
                      <p className="text-sm text-slate-900 dark:text-white font-mono break-all">
                        {selectedOrder.customer_phone}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-600 dark:text-slate-400">Address</p>
                      <p className="text-sm text-slate-900 dark:text-white break-words">
                        {selectedOrder.address}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-600 dark:text-slate-400">Delivery</p>
                      <p className="text-sm text-slate-900 dark:text-white">
                        {selectedOrder.delivery_date}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col gap-2">
                  {selectedOrder.delivery_status === 'pending' && (
                    <>
                      <button
                        onClick={() => markAsDelivered(selectedOrder.id)}
                        className="w-full px-3 py-2 text-sm bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white font-medium rounded-lg transition-all"
                      >
                        ✓ Delivered
                      </button>
                      <button
                        onClick={() => cancelOrder(selectedOrder.id)}
                        className="w-full px-3 py-2 text-sm bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white font-medium rounded-lg transition-all"
                      >
                        ✕ Cancel
                      </button>
                    </>
                  )}
                  <button
                    onClick={() => setSelectedOrder(null)}
                    className="w-full px-3 py-2 text-sm bg-slate-200 dark:bg-slate-800 text-slate-900 dark:text-white font-medium rounded-lg hover:bg-slate-300 dark:hover:bg-slate-700 transition"
                  >
                    Close
                  </button>
                </div>
              </div>

              {/* Conversation Preview - Hidden on very small screens */}
              <div className="hidden sm:flex bg-slate-50 dark:bg-slate-900/50 rounded-xl p-4 flex-col h-64">
                <p className="text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-3 font-semibold">
                  Chat
                </p>
                <div className="flex-1 overflow-y-auto space-y-2 mb-3">
                  {conversations.length === 0 ? (
                    <p className="text-xs text-slate-500 dark:text-slate-400 text-center py-4">
                      No messages
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
                  className="w-full px-3 py-2 text-xs bg-blue-500 hover:bg-blue-600 text-white font-medium rounded-lg transition"
                >
                  Full Chat
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
