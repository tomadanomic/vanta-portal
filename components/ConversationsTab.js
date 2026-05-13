'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL?.trim(),
  process.env.NEXT_PUBLIC_SUPABASE_KEY?.replace(/\s/g, '')
)

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
      const { data, error } = await supabase
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
            return {
              userId,
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
      const { data, error } = await supabase
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
          userId: selectedUser,
          message: replyText
        })
      })

      if (response.ok) {
        setReplyText('')
        await loadUserMessages(selectedUser)
        await loadConversations()
      }
    } catch (err) {
      console.error('Error sending reply:', err)
    } finally {
      setSending(false)
    }
  }

  const filteredConversations = filter === 'all' 
    ? conversations 
    : filter === 'unanswered'
    ? conversations.filter(c => c.hasUnanswered)
    : conversations.filter(c => c.isAnswered)

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 min-h-screen lg:min-h-96">
      {/* Left Panel: Conversations List */}
      <div className="lg:col-span-1 rounded-2xl backdrop-blur-xl bg-gradient-to-br from-white/40 to-white/20 dark:from-white/5 dark:to-white/10 border border-white/50 dark:border-white/10 p-6 flex flex-col h-fit lg:sticky lg:top-40">
        <div className="mb-6 pb-6 border-b border-white/20 dark:border-white/10">
          <h3 className="text-sm font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wide mb-4">
            💬 Conversations
          </h3>
          <div className="flex gap-2 flex-wrap">
            {['all', 'unanswered', 'answered'].map(f => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-3 py-1 rounded-lg text-xs font-medium transition ${
                  filter === f
                    ? 'bg-slate-900 dark:bg-white text-white dark:text-black'
                    : 'bg-slate-100/50 dark:bg-slate-900/50 text-slate-600 dark:text-slate-400'
                }`}
              >
                {f === 'all' ? 'All' : f === 'unanswered' ? '🔴 Unanswered' : '✅ Answered'}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-2 overflow-y-auto">
          {isLoading ? (
            <div className="text-center py-8 text-slate-500 dark:text-slate-400 text-sm">
              Loading...
            </div>
          ) : filteredConversations.length === 0 ? (
            <div className="text-center py-8 text-slate-500 dark:text-slate-400 text-sm">
              No conversations
            </div>
          ) : (
            filteredConversations.map(conv => (
              <button
                key={conv.userId}
                onClick={() => {
                  setSelectedUser(conv.userId)
                  loadUserMessages(conv.userId)
                }}
                className={`w-full text-left p-4 rounded-xl backdrop-blur-xl border transition-all ${
                  selectedUser === conv.userId
                    ? 'bg-gradient-to-br from-blue-500/20 to-blue-400/10 dark:from-blue-600/30 dark:to-blue-500/20 border-blue-400/50 dark:border-blue-500/50 ring-2 ring-blue-400/30'
                    : 'bg-gradient-to-br from-white/30 to-white/10 dark:from-white/5 dark:to-white/0 border-white/30 dark:border-white/10 hover:border-white/50 dark:hover:border-white/20'
                }`}
              >
                <div className="flex items-start justify-between gap-2 mb-2">
                  <p className="text-slate-900 dark:text-white font-medium text-sm truncate">
                    ID: {conv.userId}
                  </p>
                  {conv.hasUnanswered && (
                    <span className="flex-shrink-0 flex items-center gap-1 px-2 py-1 rounded-full bg-orange-100 dark:bg-orange-900/40 text-orange-700 dark:text-orange-400 text-xs font-semibold whitespace-nowrap">
                      <span className="w-2 h-2 bg-orange-500 rounded-full animate-pulse"></span>
                      New
                    </span>
                  )}
                </div>
                <p className="text-sm text-slate-600 dark:text-slate-400 truncate mb-2 line-clamp-2">
                  {conv.lastMessage.event_data}
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-500">
                  {conv.messageCount} message{conv.messageCount !== 1 ? 's' : ''}
                </p>
              </button>
            ))
          )}
        </div>
      </div>

      {/* Right Panel: Message Thread */}
      <div className="lg:col-span-2">
        {selectedUser ? (
          <div className="rounded-2xl backdrop-blur-xl bg-gradient-to-br from-white/40 to-white/20 dark:from-white/5 dark:to-white/10 border border-white/50 dark:border-white/10 h-full flex flex-col overflow-hidden">
            {/* Header with Clear Divider */}
            <div className="border-b-2 border-slate-200 dark:border-slate-800 p-6 backdrop-blur-sm bg-white/50 dark:bg-slate-900/50">
              <p className="text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-2 font-semibold">
                Customer ID
              </p>
              <p className="text-lg font-semibold text-slate-900 dark:text-white">{selectedUser}</p>
            </div>

            {/* Messages with Clear Divider */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-gradient-to-b from-transparent to-slate-50/50 dark:to-slate-900/20">
              {userMessages.length === 0 ? (
                <div className="flex items-center justify-center h-full text-slate-500 dark:text-slate-400">
                  No messages yet
                </div>
              ) : (
                userMessages.map((msg, idx) => (
                  <div
                    key={idx}
                    className={`flex ${msg.event_type === 'ADMIN_REPLY' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div className="flex flex-col gap-1">
                      <div
                        className={`max-w-sm px-4 py-3 rounded-2xl backdrop-blur-sm ${
                          msg.event_type === 'ADMIN_REPLY'
                            ? 'bg-gradient-to-br from-blue-500 to-blue-600 text-white rounded-br-none'
                            : 'bg-gradient-to-br from-slate-200/70 to-slate-100/70 dark:from-slate-800/70 dark:to-slate-900/70 text-slate-900 dark:text-slate-100 rounded-bl-none border border-white/30 dark:border-white/10'
                        }`}
                      >
                        <p className="text-sm break-words">{msg.event_data}</p>
                      </div>
                      <p className={`text-xs px-2 ${
                        msg.event_type === 'ADMIN_REPLY'
                          ? 'text-blue-600 dark:text-blue-400 text-right'
                          : 'text-slate-500 dark:text-slate-400 text-left'
                      }`}>
                        {new Date(msg.created_at).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Reply Input with Clear Divider */}
            <div className="border-t-2 border-slate-200 dark:border-slate-800 p-6 backdrop-blur-sm bg-white/50 dark:bg-slate-900/50">
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wide mb-3">
                Reply as Matt
              </label>
              <div className="flex gap-3">
                <input
                  type="text"
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && sendReply()}
                  placeholder="Type your message..."
                  className="flex-1 px-4 py-3 rounded-xl bg-white/60 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white placeholder:text-slate-500 dark:placeholder:text-slate-400 focus:outline-none focus:border-blue-500 dark:focus:border-blue-400 focus:ring-2 focus:ring-blue-400/20 transition backdrop-blur-sm"
                />
                <button
                  onClick={sendReply}
                  disabled={!replyText.trim() || sending}
                  className="px-6 py-3 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 disabled:from-slate-400 disabled:to-slate-500 text-white font-medium rounded-xl transition-all disabled:opacity-50"
                >
                  Send
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="rounded-2xl backdrop-blur-xl bg-gradient-to-br from-white/40 to-white/20 dark:from-white/5 dark:to-white/10 border border-white/50 dark:border-white/10 h-full flex items-center justify-center">
            <div className="text-center">
              <p className="text-3xl mb-2">💬</p>
              <p className="text-slate-500 dark:text-slate-400">
                Select a conversation from the left to start replying
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
