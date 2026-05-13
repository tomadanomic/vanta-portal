'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_KEY
)

export default function ConversationsTab() {
  const [conversations, setConversations] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [selectedUser, setSelectedUser] = useState(null)

  useEffect(() => {
    loadConversations()
    
    // Refresh every 5 seconds instead of real-time
    const interval = setInterval(loadConversations, 5000)

    return () => clearInterval(interval)
  }, [])

  async function loadConversations() {
    setIsLoading(true)
    try {
      const { data, error } = await supabase
        .from('conversations')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Error loading conversations:', error)
        setConversations([])
      } else {
        console.log('Conversations loaded:', data)
        setConversations(data || [])
      }
    } catch (err) {
      console.error('Exception loading conversations:', err)
    } finally {
      setIsLoading(false)
    }
  }

  const uniqueUsers = [...new Set(conversations.map(c => c.telegram_user_id))]
  const userConversations = selectedUser
    ? conversations.filter(c => c.telegram_user_id === selectedUser)
    : []

  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
      {/* Users List */}
      <div className="lg:col-span-1">
        <div className="bg-dark-secondary rounded-lg border border-dark-tertiary overflow-hidden">
          <div className="bg-dark/50 border-b border-dark-tertiary px-4 py-3">
            <h3 className="font-medium text-sm">Users ({uniqueUsers.length})</h3>
          </div>
          <div className="divide-y divide-dark-tertiary max-h-96 overflow-y-auto">
            {uniqueUsers.length === 0 ? (
              <div className="p-4 text-center text-gray-400 text-sm">No conversations</div>
            ) : (
              uniqueUsers.map(userId => {
                const userMsgs = conversations.filter(c => c.telegram_user_id === userId)
                const lastMsg = userMsgs[0]
                return (
                  <button
                    key={userId}
                    onClick={() => setSelectedUser(userId)}
                    className={`w-full text-left px-4 py-3 transition ${
                      selectedUser === userId
                        ? 'bg-blue-600/20 border-l-2 border-blue-500'
                        : 'hover:bg-dark/50'
                    }`}
                  >
                    <p className="font-mono text-xs text-gray-400">ID: {userId}</p>
                    <p className="text-xs text-gray-400 mt-1">{userMsgs.length} messages</p>
                    <p className="text-xs text-gray-500 mt-1">
                      {new Date(lastMsg.created_at).toLocaleDateString()}
                    </p>
                  </button>
                )
              })
            )}
          </div>
        </div>
      </div>

      {/* Conversation */}
      <div className="lg:col-span-3">
        <div className="bg-dark-secondary rounded-lg border border-dark-tertiary overflow-hidden flex flex-col h-96">
          {selectedUser ? (
            <>
              <div className="bg-dark/50 border-b border-dark-tertiary px-4 py-3">
                <h3 className="font-medium text-sm">User {selectedUser}</h3>
              </div>
              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {userConversations.length === 0 ? (
                  <div className="text-center text-gray-400 text-sm">No messages</div>
                ) : (
                  userConversations.map((msg, idx) => (
                    <div key={idx} className="text-sm">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="px-2 py-1 bg-blue-600/20 text-blue-400 rounded text-xs font-mono">
                          {msg.event_type}
                        </span>
                        <span className="text-gray-500 text-xs">
                          {new Date(msg.created_at).toLocaleTimeString()}
                        </span>
                      </div>
                      <p className="text-gray-300 break-words">{msg.event_data}</p>
                    </div>
                  ))
                )}
              </div>
            </>
          ) : (
            <div className="flex items-center justify-center h-full text-gray-400">
              Select a user to view conversation
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
