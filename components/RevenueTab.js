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

export default function RevenueTab() {
  const [orders, setOrders] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [dateOpen, setDateOpen] = useState(false)

  useEffect(() => {
    loadOrders()
    const interval = setInterval(loadOrders, 5000)
    return () => clearInterval(interval)
  }, [])

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

  const filteredOrders = orders.filter(order => {
    const orderDate = new Date(order.created_at)
    const start = startDate ? new Date(startDate) : null
    const end = endDate ? new Date(endDate) : null

    if (start && orderDate < start) return false
    if (end && orderDate > end) return false
    return true
  })

  const collectedRevenue = filteredOrders
    .filter(o => o.status === 'delivered')
    .reduce((sum, o) => sum + calculateOrderTotal(o.product_name, o.quantity), 0)

  const pendingRevenue = filteredOrders
    .filter(o => o.status === 'pending' || o.status === 'in_transit')
    .reduce((sum, o) => sum + calculateOrderTotal(o.product_name, o.quantity), 0)

  const totalRevenue = collectedRevenue + pendingRevenue

  return (
    <div className="space-y-6">
      {/* Revenue Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        {[
          { label: 'Total Revenue', value: totalRevenue, color: 'text-[#0A0A0A]', bg: 'bg-white' },
          { label: 'Collected', value: collectedRevenue, color: 'text-[#137333]', bg: 'bg-[#E8F7EC]' },
          { label: 'Pending', value: pendingRevenue, color: 'text-[#B06000]', bg: 'bg-[#FEF7E0]' }
        ].map((stat, idx) => (
          <div key={idx} className={`${stat.bg} border border-[#ECECEC] rounded-[14px] p-6 shadow-[0_1px_2px_rgba(0,0,0,0.04),0_1px_6px_rgba(0,0,0,0.04)]`}>
            <p className="text-[#8A8A8E] text-xs uppercase tracking-widest font-600 mb-2">
              {stat.label}
            </p>
            <p className={`${stat.color} text-3xl font-700`}>
              ${stat.value.toFixed(2)}
            </p>
          </div>
        ))}
      </div>

      {/* Date Range Filter */}
      <div className="bg-white border border-[#ECECEC] rounded-[14px] p-4 shadow-[0_1px_2px_rgba(0,0,0,0.04),0_1px_6px_rgba(0,0,0,0.04)]">
        <div className="relative w-full sm:w-auto">
          <button
            onClick={() => setDateOpen(!dateOpen)}
            className="px-4 py-2 rounded-[10px] border border-[#ECECEC] bg-white text-[#0A0A0A] text-xs font-500 hover:bg-[#FAFAF7] transition-colors"
          >
            {startDate && endDate
              ? `${new Date(startDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} – ${new Date(endDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: '2-digit' })}`
              : 'Select dates'}
          </button>
          {dateOpen && (
            <div className="absolute left-0 mt-2 bg-white border border-[#ECECEC] rounded-[14px] p-4 shadow-lg z-50 min-w-xs">
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

      {/* Revenue Breakdown */}
      <div className="bg-white border border-[#ECECEC] rounded-[14px] overflow-hidden shadow-[0_1px_2px_rgba(0,0,0,0.04),0_1px_6px_rgba(0,0,0,0.04)]">
        <div className="p-6 border-b border-[#ECECEC]">
          <h3 className="text-[#0A0A0A] font-600 text-base">Revenue by Order</h3>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center h-40">
            <p className="text-[#8A8A8E] text-xs">Loading revenue data...</p>
          </div>
        ) : filteredOrders.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-40 p-4">
            <p className="text-[#545458] text-sm font-500">No orders in this period</p>
            <p className="text-[#8A8A8E] text-xs mt-1">Select different dates to view revenue</p>
          </div>
        ) : (
          <div className="divide-y divide-[#ECECEC]">
            {filteredOrders.map(order => {
              const statusColor =
                order.status === 'delivered'
                  ? { bg: '#E8F7EC', text: '#137333' }
                  : order.status === 'pending' || order.status === 'in_transit'
                  ? { bg: '#FEF7E0', text: '#B06000' }
                  : { bg: '#FFECE9', text: '#B3261E' }

              return (
                <div key={order.id} className="p-4 hover:bg-[#FAFAF7] transition-colors">
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
                          backgroundColor: statusColor.bg,
                          color: statusColor.text
                        }}
                      >
                        {order.status === 'delivered' ? 'Collected' : order.status === 'pending' || order.status === 'in_transit' ? 'Pending' : 'Cancelled'}
                      </div>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Summary */}
      <div className="bg-gradient-to-r from-[#0F1729] to-[#1A2545] rounded-[14px] p-6 text-white shadow-[0_1px_2px_rgba(0,0,0,0.04),0_1px_6px_rgba(0,0,0,0.04)]">
        <p className="text-sm opacity-80 mb-2">Summary</p>
        <div className="text-3xl font-700">
          ${collectedRevenue.toFixed(2)} Collected
        </div>
        <p className="text-sm opacity-70 mt-2">
          {filteredOrders.filter(o => o.status === 'delivered').length} delivered order{filteredOrders.filter(o => o.status === 'delivered').length !== 1 ? 's' : ''} · ${pendingRevenue.toFixed(2)} pending
        </p>
      </div>
    </div>
  )
}
