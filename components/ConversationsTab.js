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

export default function ConversationsTab() {
  const [conversations, setConversations] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [selectedUser, setSelectedUser] = useState(null)
  const [userMessages, setUserMessages] = useState([])
  const [replyText, setReplyText] = useState('')
  const [sending, setSending] = useState(false)
  const [filter, setFilter] = useState('all')

  useEffect(() => {
    loadConversations()
    const interval = setInterval(loadConversations, 3000)
    return () => clearInterval(interval)
  }, [])

  async function loadConversations() {
    try {
      const sb = getSupabase()
      const { data, error } = await sb
        .from('conversations')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error

      const grouped = {}
      const answeredUsers = new Set()

      data?.forEach(conv => {
        if (conv.event_type === 'ADMIN_REPLY') {
          answeredUsers.add(conv.telegram_user_id)
        }
        if (!grouped[conv.telegram_user_id]) {
          grouped[conv.telegram_user_id] = []
        }
        grouped[conv.telegram_user_id].push(conv)
      })

      setConversations(
        Object.entries(grouped)
          .map(([userId, msgs]) => {
            const lastMessage = msgs[0]
            const hasUnanswered = msgs.some(
              m => m.event_type === 'CUSTOMER_QUESTION' && !answeredUsers.has(userId)
            )
            // Extract customer name if available
            const customerName = msgs.find(m => m.customer_name)?.customer_name || `User ${userId.slice(-8)}`
            
            return {
              userId,
              customerName,
              lastMessage,
              messageCount: msgs.length,
              hasUnanswered,
              isAnswered: answeredUsers.has(userId)
            }
          })
          .sort((a, b) => (b.hasUnanswered ? 1 : -1))
      )

      setIsLoading(false)
    } catch (err) {
      console.error('Error loading conversations:', err)
    }
  }

  async function loadUserMessages(userId) {
    try {
      const sb = getSupabase()
      const { data, error } = await sb
        .from('conversations')
        .select('*')
        .eq('telegram_user_id', userId)
        .order('created_at', { ascending: true })

      if (error) throw error
      setUserMessages(data || [])
    } catch (err) {
      console.error('Error loading messages:', err)
    }
  }

  async function sendReply() {
    if (!replyText.trim() || !selectedUser) return

    setSending(true)
    try {
      const response = await fetch('/api/send-admin-reply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          telegram_user_id: selectedUser,
          message: replyText
        })
      })

      if (!response.ok) throw new Error('Failed to send reply')
      
      setReplyText('')
      await loadConversations()
      await loadUserMessages(selectedUser)
    } catch (err) {
      console.error('Error sending reply:', err)
    } finally {
      setSending(false)
    }
  }

  const filteredConversations =
    filter === 'unanswered'
      ? conversations.filter(c => c.hasUnanswered)
      : filter === 'answered'
      ? conversations.filter(c => c.isAnswered)
      : conversations

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[calc(100vh-180px)]">
      {/* Left: Conversation List */}
      <div className="lg:col-span-1 bg-white border border-[#ECECEC] rounded-[14px] flex flex-col shadow-[0_1px_2px_rgba(0,0,0,0.04),0_1px_6px_rgba(0,0,0,0.04)]">
        {/* List Header */}
        <div className="p-4 border-b border-[#ECECEC]">
          <h3 className="text-[#0A0A0A] font-600 text-sm">Conversations</h3>
          <p className="text-[#8A8A8E] text-xs mt-1">{filteredConversations.length} total</p>
        </div>

        {/* Filter Pills */}
        <div className="px-4 pt-3 pb-2 flex gap-2">
          {['all', 'unanswered', 'answered'].map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 py-1.5 rounded-[10px] text-xs font-500 transition-all ${
                filter === f
                  ? 'bg-[#0F1729] text-white'
                  : 'bg-transparent text-[#545458] hover:bg-[#FAFAF7] border border-[#ECECEC]'
              }`}
            >
              {f === 'all' ? 'All' : f === 'unanswered' ? 'Unanswered' : 'Answered'}
            </button>
          ))}
        </div>

        {/* Messages List */}
        <div className="flex-1 overflow-y-auto">
          {isLoading ? (
            <div className="flex items-center justify-center h-full text-[#8A8A8E] text-xs">
              Loading conversations...
            </div>
          ) : filteredConversations.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center p-4">
              <p className="text-[#545458] text-xs mb-2">No conversations yet</p>
              <p className="text-[#8A8A8E] text-xs">Once customers message the bot, they'll appear here</p>
            </div>
          ) : (
            filteredConversations.map(conv => (
              <button
                key={conv.userId}
                onClick={() => {
                  setSelectedUser(conv.userId)
                  loadUserMessages(conv.userId)
                }}
                className={`w-full text-left px-4 py-3 border-b border-[#ECECEC] transition-colors ${
                  selectedUser === conv.userId
                    ? 'bg-[#F5F5F5] border-l-3 border-l-[#0F1729]'
                    : 'hover:bg-[#FAFAF7]'
                }`}
              >
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="flex-1 min-w-0">
                    <p className="text-[#0A0A0A] font-600 text-sm truncate">
                      {conv.customerName}
                    </p>
                  </div>
                  {conv.hasUnanswered && (
                    <span className="flex-shrink-0 w-2 h-2 rounded-full bg-[#B06000] mt-1.5"></span>
                  )}
                </div>
                <p className="text-[#545458] text-xs truncate mb-1 line-clamp-1">
                  {conv.lastMessage?.event_data || conv.lastMessage?.message || '(no text)'}
                </p>
                <div className="flex items-center justify-between">
                  <p className="text-[#8A8A8E] text-xs">
                    {conv.messageCount} message{conv.messageCount !== 1 ? 's' : ''}
                  </p>
                  <p className="text-[#8A8A8E] text-xs">
                    {new Date(conv.lastMessage?.created_at).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </p>
                </div>
              </button>
            ))
          )}
        </div>
      </div>

      {/* Right: Message Thread */}
      <div className="lg:col-span-2">
        {selectedUser ? (
          <div className="bg-white border border-[#ECECEC] rounded-[14px] h-full flex flex-col shadow-[0_1px_2px_rgba(0,0,0,0.04),0_1px_6px_rgba(0,0,0,0.04)]">
            {/* Header */}
            <div className="p-4 border-b border-[#ECECEC]">
              <p className="text-[#8A8A8E] text-xs uppercase tracking-widest font-600 mb-1">
                Chat with
              </p>
              <p className="text-[#0A0A0A] font-600 text-base break-all">
                {conversations.find(c => c.userId === selectedUser)?.customerName || selectedUser}
              </p>
              <p className="text-[#8A8A8E] text-xs mt-1">
                {userMessages.length} message{userMessages.length !== 1 ? 's' : ''}
              </p>
            </div>

            {/* Messages Thread */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-[#FAFAF7]">
              {userMessages.length === 0 ? (
                <div className="flex items-center justify-center h-full">
                  <div className="text-center">
                    <p className="text-[#545458] text-sm">No messages in this conversation</p>
                    <p className="text-[#8A8A8E] text-xs mt-1">Messages will appear as the customer responds</p>
                  </div>
                </div>
              ) : (
                userMessages.map((msg, idx) => {
                  const isAdmin = msg.event_type === 'ADMIN_REPLY'
                  return (
                    <div
                      key={idx}
                      className={`flex ${isAdmin ? 'justify-end' : 'justify-start'}`}
                    >
                      <div className="flex flex-col gap-1 max-w-xs">
                        <div
                          className={`px-4 py-3 rounded-[14px] break-words text-sm ${
                            isAdmin
                              ? 'bg-[#0F1729] text-white rounded-br-none shadow-[0_1px_2px_rgba(0,0,0,0.04),0_1px_6px_rgba(0,0,0,0.04)]'
                              : 'bg-white text-[#0A0A0A] border border-[#ECECEC] rounded-bl-none'
                          }`}
                        >
                          {msg.event_data || msg.message || '(empty message)'}
                        </div>
                        <p className={`text-xs px-2 ${
                          isAdmin
                            ? 'text-[#0F1729] text-right'
                            : 'text-[#8A8A8E] text-left'
                        }`}>
                          {new Date(msg.created_at).toLocaleTimeString([], {
                            hour: '2-digit',
                            minute: '2-digit',
                            second: '2-digit'
                          })}
                        </p>
                      </div>
                    </div>
                  )
                })
              )}
            </div>

            {/* Reply Composer */}
            <div className="p-4 border-t border-[#ECECEC] bg-white">
              <div className="flex gap-3">
                <textarea
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  placeholder="Type your reply..."
                  className="flex-1 px-4 py-2 text-sm rounded-[10px] border border-[#ECECEC] bg-white text-[#0A0A0A] placeholder:text-[#8A8A8E] focus:outline-none focus:border-[#0F1729] focus:ring-1 focus:ring-[#0F1729]/20 resize-none"
                  rows="3"
                />
              </div>
              <button
                onClick={sendReply}
                disabled={!replyText.trim() || sending}
                className="w-full mt-3 px-4 py-2 rounded-[10px] bg-[#0F1729] text-white text-sm font-600 hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-opacity"
              >
                {sending ? 'Sending...' : 'Send Reply'}
              </button>
            </div>
          </div>
        ) : (
          <div className="bg-white border border-[#ECECEC] rounded-[14px] h-full flex items-center justify-center shadow-[0_1px_2px_rgba(0,0,0,0.04),0_1px_6px_rgba(0,0,0,0.04)]">
            <div className="text-center">
              <p className="text-[#545458] text-sm">Select a conversation to view messages</p>
              <p className="text-[#8A8A8E] text-xs mt-1">Choose a customer from the list</p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
