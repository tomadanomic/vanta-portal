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

// Product catalog (must match bot's PRODUCTS array)
const PRODUCTS = [
  { id: 1, name: 'Retatrutide Pen 30mg', price: 1500 },
  { id: 2, name: 'NAD+ 500mg', price: 800 },
  { id: 3, name: 'Tesamorelin 5mg', price: 300 },
  { id: 4, name: 'Melanotan 2 10mg', price: 300 },
  { id: 5, name: 'HCG 5000IU', price: 400 },
  { id: 6, name: 'MOTSC 5mg', price: 175 },
  { id: 7, name: 'BPC157 5mg', price: 150 },
  { id: 8, name: 'TB500 5mg', price: 100 },
  { id: 9, name: 'GHKCU 50mg', price: 250 }
]

// Helper: calculate total price from product_name and quantity
function calculateOrderTotal(productName, quantity) {
  const product = PRODUCTS.find(p => p.name === productName)
  if (!product) return 0
  return product.price * (quantity || 1)
}

const STATUS_COLORS = {
  pending: { bg: '#FEF7E0', text: '#B06000', label: 'Pending' },
  in_transit: { bg: '#E8F5FF', text: '#0066CC', label: 'In Transit' },
  delivered: { bg: '#E8F7EC', text: '#137333', label: 'Delivered' },
  cancelled: { bg: '#FFECE9', text: '#B3261E', label: 'Cancelled' }
}

export default function OrdersTab({ setActiveTab }) {
  const [orders, setOrders] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [filter, setFilter] = useState('all')
  const [selectedOrder, setSelectedOrder] = useState(null)
  const [conversations, setConversations] = useState([])
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [dateOpen, setDateOpen] = useState(false)

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
      const sb = getSupabase()
      const { data, error } = await sb
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
      const sb = getSupabase()
      const { data, error } = await sb
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

  async function cancelOrder(orderId) {
    try {
      const sb = getSupabase()
      const { error } = await sb
        .from('orders')
        .update({ status: 'cancelled' })
        .eq('id', orderId)

      if (error) throw error
      await loadOrders()
      setSelectedOrder(null)
    } catch (err) {
      console.error('Error cancelling order:', err)
    }
  }

  async function markDelivered(orderId) {
    try {
      const sb = getSupabase()
      const { error } = await sb
        .from('orders')
        .update({ status: 'delivered' })
        .eq('id', orderId)

      if (error) throw error
      await loadOrders()
      setSelectedOrder(null)
    } catch (err) {
      console.error('Error marking order delivered:', err)
    }
  }

  const filteredOrders = orders.filter(order => {
    const orderDate = new Date(order.created_at)
    const start = startDate ? new Date(startDate) : null
    const end = endDate ? new Date(endDate) : null

    if (start && orderDate < start) return false
    if (end && orderDate > end) return false

    if (filter === 'pending') return order.status === 'pending'
    if (filter === 'delivered') return order.status === 'delivered'
    if (filter === 'cancelled') return order.status === 'cancelled'
    return true
  })

  const stats = {
    total: orders.length,
    pending: orders.filter(o => o.status === 'pending').length,
    delivered: orders.filter(o => o.status === 'delivered').length
  }

  const deliveredRevenue = orders
    .filter(o => o.status === 'delivered')
    .reduce((sum, o) => sum + calculateOrderTotal(o.product_name, o.quantity), 0)

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        {[
          { label: 'Total Orders', value: stats.total, color: 'bg-[#FAFAF7]' },
          { label: 'Pending', value: stats.pending, color: 'bg-[#FEF7E0]' },
          { label: 'Delivered', value: stats.delivered, color: 'bg-[#E8F7EC]' }
        ].map((stat, idx) => (
          <div key={idx} className="bg-white border border-[#ECECEC] rounded-[14px] p-6 shadow-[0_1px_2px_rgba(0,0,0,0.04),0_1px_6px_rgba(0,0,0,0.04)]">
            <p className="text-[#8A8A8E] text-xs uppercase tracking-widest font-600 mb-2">
              {stat.label}
            </p>
            <p className="text-[#0A0A0A] text-3xl font-700">
              {stat.value}
            </p>
          </div>
        ))}
      </div>

      {/* Filters & Date Range */}
      <div className="bg-white border border-[#ECECEC] rounded-[14px] p-4 shadow-[0_1px_2px_rgba(0,0,0,0.04),0_1px_6px_rgba(0,0,0,0.04)]">
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
          <div className="flex gap-2">
            {['all', 'pending', 'delivered', 'cancelled'].map(f => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-3 py-1.5 rounded-[10px] text-xs font-500 transition-all ${
                  filter === f
                    ? 'bg-[#0F1729] text-white'
                    : 'bg-transparent text-[#545458] hover:bg-[#FAFAF7] border border-[#ECECEC]'
                }`}
              >
                {f === 'all' ? 'All' : f.charAt(0).toUpperCase() + f.slice(1).replace('_', ' ')}
              </button>
            ))}
          </div>

          <div className="relative ml-auto">
            <button
              onClick={() => setDateOpen(!dateOpen)}
              className="px-4 py-2 rounded-[10px] border border-[#ECECEC] bg-white text-[#0A0A0A] text-xs font-500 hover:bg-[#FAFAF7] transition-colors"
            >
              {startDate && endDate
                ? `${new Date(startDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} – ${new Date(endDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: '2-digit' })}`
                : 'Select dates'}
            </button>
            {dateOpen && (
              <div className="absolute right-0 mt-2 bg-white border border-[#ECECEC] rounded-[14px] p-4 shadow-lg z-50 min-w-xs">
                <div className="space-y-3">
                  <div>
                    <label className="text-xs text-[#8A8A8E] font-600 mb-1 block">Start Date</label>
                    <input
                      type="date"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      className="w-full px-3 py-2 rounded-[10px] border border-[#ECECEC] text-xs"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-[#8A8A8E] font-600 mb-1 block">End Date</label>
                    <input
                      type="date"
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                      className="w-full px-3 py-2 rounded-[10px] border border-[#ECECEC] text-xs"
                    />
                  </div>
                  <button
                    onClick={() => setDateOpen(false)}
                    className="w-full px-3 py-1.5 rounded-[10px] bg-[#0F1729] text-white text-xs font-600"
                  >
                    Apply
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Orders List */}
      <div className="bg-white border border-[#ECECEC] rounded-[14px] overflow-hidden shadow-[0_1px_2px_rgba(0,0,0,0.04),0_1px_6px_rgba(0,0,0,0.04)]">
        {isLoading ? (
          <div className="flex items-center justify-center h-40">
            <p className="text-[#8A8A8E] text-xs">Loading orders...</p>
          </div>
        ) : filteredOrders.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-40 p-4">
            <p className="text-[#545458] text-sm font-500">No orders found</p>
            <p className="text-[#8A8A8E] text-xs mt-1">Orders placed via Telegram bot will appear here</p>
          </div>
        ) : (
          <div className="divide-y divide-[#ECECEC]">
            {filteredOrders.map(order => (
              <button
                key={order.id}
                onClick={() => setSelectedOrder(order)}
                className="w-full p-4 text-left hover:bg-[#FAFAF7] transition-colors"
              >
                <div className="flex items-center justify-between gap-4 flex-wrap">
                  <div className="flex-1 min-w-[200px]">
                    <p className="font-mono text-xs text-[#8A8A8E] mb-1">
                      Order #{order.id.slice(0, 8)}
                    </p>
                    <p className="text-[#0A0A0A] font-600 text-sm">
                      {order.customer_name}
                    </p>
                  </div>

                  <div className="flex-1 min-w-[150px]">
                    <p className="text-[#545458] text-sm line-clamp-1">
                      {order.products?.join(', ') || 'N/A'}
                    </p>
                  </div>

                  <div className="flex items-center gap-4">
                      <p className="text-[#137333] font-600 text-sm min-w-[80px] text-right">
                        ${calculateOrderTotal(order.product_name, order.quantity).toFixed(2)} AED
                      </p>
                    <div
                      className="px-3 py-1.5 rounded-[10px] text-xs font-600 whitespace-nowrap"
                      style={{
                        backgroundColor: STATUS_COLORS[order.status]?.bg,
                        color: STATUS_COLORS[order.status]?.text
                      }}
                    >
                      {STATUS_COLORS[order.status]?.label}
                    </div>
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Order Detail Modal */}
      {selectedOrder && (
        <div className="fixed inset-0 bg-black/40 z-40 flex items-center justify-center p-4">
          <div className="bg-white rounded-[14px] max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-lg">
            <div className="sticky top-0 bg-white border-b border-[#ECECEC] p-6 flex items-center justify-between">
              <div>
                <p className="font-mono text-xs text-[#8A8A8E] mb-1">
                  Order #{selectedOrder.id.slice(0, 8)}
                </p>
                <p className="text-[#0A0A0A] font-600 text-lg">
                  {selectedOrder.customer_name}
                </p>
              </div>
              <button
                onClick={() => setSelectedOrder(null)}
                className="text-[#8A8A8E] hover:text-[#0A0A0A] font-bold text-xl"
              >
                ✕
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* Order Details */}
              <div className="space-y-3">
                <h3 className="text-xs uppercase tracking-widest font-600 text-[#8A8A8E]">
                  Order Details
                </h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <p className="text-[#545458]">Products</p>
                    <p className="text-[#0A0A0A] font-500">{selectedOrder.products?.join(', ')}</p>
                  </div>
                    <div className="flex justify-between">
                      <p className="text-[#545458]">Total</p>
                      <p className="text-[#137333] font-600">
                        ${calculateOrderTotal(selectedOrder.product_name, selectedOrder.quantity).toFixed(2)} AED
                      </p>
                    </div>
                  <div className="flex justify-between">
                    <p className="text-[#545458]">Status</p>
                    <div
                      className="px-3 py-1 rounded-[10px] text-xs font-600"
                      style={{
                        backgroundColor: STATUS_COLORS[selectedOrder.status]?.bg,
                        color: STATUS_COLORS[selectedOrder.status]?.text
                      }}
                    >
                      {STATUS_COLORS[selectedOrder.status]?.label}
                    </div>
                  </div>
                  <div className="flex justify-between">
                    <p className="text-[#545458]">Placed</p>
                    <p className="text-[#0A0A0A]">{new Date(selectedOrder.created_at).toLocaleString()}</p>
                  </div>
                </div>
              </div>

              {/* Delivery Info */}
              <div className="space-y-3 border-t border-[#ECECEC] pt-4">
                <h3 className="text-xs uppercase tracking-widest font-600 text-[#8A8A8E]">
                  Delivery Address
                </h3>
                <p className="text-sm text-[#0A0A0A] whitespace-pre-wrap">
                  {selectedOrder.delivery_address}
                </p>
              </div>

              {/* Conversation Preview */}
              {conversations.length > 0 && (
                <div className="space-y-3 border-t border-[#ECECEC] pt-4">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-xs uppercase tracking-widest font-600 text-[#8A8A8E]">
                      Conversation
                    </h3>
                    <button
                      onClick={() => {
                        setSelectedOrder(null)
                        setActiveTab('conversations')
                      }}
                      className="text-xs font-600 text-[#0F1729] hover:underline"
                    >
                      View All
                    </button>
                  </div>
                  <div className="bg-[#FAFAF7] rounded-[10px] p-4 space-y-2 max-h-48 overflow-y-auto">
                    {conversations.slice(-3).map((msg, idx) => (
                      <div key={idx} className="text-xs">
                        <p className="text-[#545458]">{msg.message}</p>
                        <p className="text-[#8A8A8E] mt-1 text-xs">
                          {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="border-t border-[#ECECEC] pt-4 flex gap-3">
                {selectedOrder.status === 'pending' && (
                  <>
                    <button
                      onClick={() => markDelivered(selectedOrder.id)}
                      className="flex-1 px-4 py-2 rounded-[10px] bg-[#137333] text-white text-sm font-600 hover:opacity-90 transition-opacity"
                    >
                      Mark Delivered
                    </button>
                    <button
                      onClick={() => cancelOrder(selectedOrder.id)}
                      className="flex-1 px-4 py-2 rounded-[10px] bg-[#FFECE9] text-[#B3261E] text-sm font-600 hover:opacity-90 transition-opacity"
                    >
                      Cancel Order
                    </button>
                  </>
                )}
                {selectedOrder.status !== 'cancelled' && selectedOrder.status !== 'delivered' && (
                  <button
                    onClick={() => markDelivered(selectedOrder.id)}
                    className="flex-1 px-4 py-2 rounded-[10px] bg-[#137333] text-white text-sm font-600 hover:opacity-90 transition-opacity"
                  >
                    Mark Delivered
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
