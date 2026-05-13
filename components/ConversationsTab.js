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

  useEffect(() => {
    loadConversations()
    const interval = setInterval(loadConversations, 5000)
    return () => clearInterval(interval)
  }, [])

  async function loadConversations() {
    try {
      const { data, error } = await supabase
        .from('conversations')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error

      // Group by user
      const grouped = {}
      data?.forEach(conv => {
        if (!grouped[conv.telegram_user_id]) {
          grouped[conv.telegram_user_id] = []
        }
        grouped[conv.telegram_user_id].push(conv)
      })

      setConversations(Object.entries(grouped).map(([userId, msgs]) => ({
        userId,
        lastMessage: msgs[0],
        messageCount: msgs.length
      })))

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
      }
    } catch (err) {
      console.error('Error sending reply:', err)
    } finally {
      setSending(false)
    }
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 min-h-96">
      {/* Conversations List */}
      <div className="lg:col-span-1">
        <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-4">Conversations</h3>
        <div className="space-y-2">
          {isLoading ? (
            <div className="text-center py-8 text-gray-500">Loading...</div>
          ) : conversations.length === 0 ? (
            <div className="text-center py-8 text-gray-500">No conversations yet</div>
          ) : (
            conversations.map(conv => (
              <button
                key={conv.userId}
                onClick={() => {
                  setSelectedUser(conv.userId)
                  loadUserMessages(conv.userId)
                }}
                className={`w-full text-left p-4 rounded-lg border transition ${
                  selectedUser === conv.userId
                    ? 'border-white bg-gray-900'
                    : 'border-gray-900 bg-gray-950/50 hover:border-gray-800'
                }`}
              >
                <p className="text-white font-medium">ID: {conv.userId}</p>
                <p className="text-sm text-gray-500 truncate">{conv.lastMessage.event_data}</p>
                <p className="text-xs text-gray-600 mt-2">{conv.messageCount} messages</p>
              </button>
            ))
          )}
        </div>
      </div>

      {/* Message Thread */}
      <div className="lg:col-span-2">
        {selectedUser ? (
          <div className="rounded-lg border border-gray-900 bg-gray-950/50 backdrop-blur-sm h-full flex flex-col">
            {/* Header */}
            <div className="border-b border-gray-900 p-4">
              <p className="text-sm text-gray-500">Customer ID</p>
              <p className="text-white font-semibold">{selectedUser}</p>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {userMessages.map((msg, idx) => (
                <div
                  key={idx}
                  className={`flex ${msg.event_type === 'ADMIN_REPLY' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-xs px-4 py-2 rounded-lg ${
                      msg.event_type === 'ADMIN_REPLY'
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-900 text-gray-200'
                    }`}
                  >
                    <p className="text-sm break-words">{msg.event_data}</p>
                    <p className="text-xs mt-1 opacity-70">
                      {new Date(msg.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            {/* Reply Input */}
            <div className="border-t border-gray-900 p-4">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && sendReply()}
                  placeholder="Reply as Matt..."
                  className="flex-1 bg-gray-900 border border-gray-800 text-white px-4 py-2 rounded-lg focus:outline-none focus:border-gray-700"
                />
                <button
                  onClick={sendReply}
                  disabled={!replyText.trim() || sending}
                  className="px-4 py-2 bg-white text-black font-medium rounded-lg hover:bg-gray-100 disabled:opacity-50 transition"
                >
                  Send
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="rounded-lg border border-gray-900 bg-gray-950/50 backdrop-blur-sm h-full flex items-center justify-center">
            <p className="text-gray-500">Select a conversation to reply</p>
          </div>
        )}
      </div>
    </div>
  )
}
