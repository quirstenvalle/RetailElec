import { useEffect, useState } from 'react'

const CHAT_STORAGE_KEY = 'quinto-store-chat-thread'
const CHAT_CHANNEL = 'quinto-store-chat-channel'

const starterMessages = []

function readChatThread() {
  try {
    const saved = localStorage.getItem(CHAT_STORAGE_KEY)
    if (!saved) return starterMessages
    const parsed = JSON.parse(saved)
    return Array.isArray(parsed) ? parsed : starterMessages
  } catch (error) {
    console.error('Failed to read chat thread', error)
    return starterMessages
  }
}

function AdminChatPage({ compact = false }) {
  const [messages, setMessages] = useState(() => readChatThread())
  const [draft, setDraft] = useState('')
  const [selectedCustomer, setSelectedCustomer] = useState('All')
  const [allConversations, setAllConversations] = useState({})

  useEffect(() => {
    const syncMessages = () => setMessages(readChatThread())
    const channel = typeof BroadcastChannel !== 'undefined' ? new BroadcastChannel(CHAT_CHANNEL) : null

    if (channel) {
      channel.addEventListener('message', (event) => {
        if (event.data?.type === 'chat:update') syncMessages()
      })
    }

    const handleStorage = (event) => {
      if (event.key === CHAT_STORAGE_KEY) syncMessages()
    }

    const timer = window.setInterval(syncMessages, 2000)
    window.addEventListener('storage', handleStorage)

    return () => {
      if (channel) channel.close()
      window.clearInterval(timer)
      window.removeEventListener('storage', handleStorage)
    }
  }, [])

  const pushMessage = (nextThread) => {
    setMessages(nextThread)
    localStorage.setItem(CHAT_STORAGE_KEY, JSON.stringify(nextThread))
    if (typeof BroadcastChannel !== 'undefined') {
      const channel = new BroadcastChannel(CHAT_CHANNEL)
      channel.postMessage({ type: 'chat:update' })
      channel.close()
    }
  }

  useEffect(() => {
    const nextConversations = {}
    for (const message of messages) {
      if (!message.sender || ['Admin', 'Quinto Store'].includes(message.sender)) continue
      nextConversations[message.sender] = nextConversations[message.sender] || []
      nextConversations[message.sender].push(message)
    }
    setAllConversations(nextConversations)
  }, [messages])

  const customerList = Object.keys(allConversations)

  const visibleMessages =
    selectedCustomer === 'All'
      ? customerList.length > 0
        ? allConversations[customerList[0]] || []
        : []
      : messages.filter(
          (message) =>
            message.sender === selectedCustomer ||
            message.sender === 'Admin' ||
            message.sender === 'Quinto Store',
        )

  const handleSubmit = (event) => {
    event.preventDefault()
    const nextMessage = draft.trim()
    if (!nextMessage) return

    const timestamp = new Date().toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
    })

    const adminMessage = {
      id: Date.now(),
      sender: 'Admin',
      text: nextMessage,
      time: timestamp,
    }

    pushMessage([...messages, adminMessage])
    setDraft('')
  }

  if (compact) {
    if (selectedCustomer !== 'All') {
      return (
        <div className="floating-support-panel floating-support-panel--thread">
          <div className="floating-support-card floating-support-card--thread">
            <div className="floating-support-card__title">
              <button
                type="button"
                className="floating-support-back"
                onClick={() => setSelectedCustomer('All')}
                aria-label="Back to customers"
              >
                ‹
              </button>
              <span className="floating-support-icon">💬</span>
              <span>{selectedCustomer}</span>
            </div>
            <div className="chat-thread floating-support-thread" aria-live="polite">
              {visibleMessages.length === 0 ? (
                <p className="floating-support-empty">No messages yet.</p>
              ) : (
                visibleMessages.map((message) => {
                  const isMine = message.sender === 'Admin' || message.sender === 'Quinto Store'
                  return (
                    <div
                      key={message.id}
                      className={`chat-bubble ${isMine ? 'chat-bubble-self' : 'chat-bubble-other'}`}
                    >
                      <div className="chat-meta">
                        <strong>{message.sender}</strong>
                        <span>{message.time}</span>
                      </div>
                      <p>{message.text}</p>
                    </div>
                  )
                })
              )}
            </div>
            <form className="chat-form floating-support-form" onSubmit={handleSubmit}>
              <input
                type="text"
                value={draft}
                onChange={(event) => setDraft(event.target.value)}
                placeholder={`Reply to ${selectedCustomer}...`}
                aria-label="Type a response"
              />
              <button type="submit" className="btn-green">
                Send
              </button>
            </form>
          </div>
        </div>
      )
    }

    return (
      <div className="floating-support-panel">
        <div className="floating-support-card">
          <div className="floating-support-card__title">
            <span className="floating-support-icon">👥</span>
            <span>Customers</span>
          </div>

          {customerList.length === 0 ? (
            <p className="floating-support-empty">No customer chats yet.</p>
          ) : (
            customerList.map((customer) => (
              <button
                key={customer}
                type="button"
                className="floating-support-row"
                onClick={() => setSelectedCustomer(customer)}
              >
                <span className="floating-support-row__icon">◌</span>
                <span>{customer}</span>
                <span className="floating-support-row__arrow">›</span>
              </button>
            ))
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="chat-page">
      <div className="section-head">
        <div>
          <h3>Customer Support Chat</h3>
          <p>Reply to customer questions directly from the admin dashboard.</p>
        </div>
      </div>

      <div className="admin-chat-layout">
        <aside className="admin-chat-list">
          <div className="admin-chat-list__head">
            <h4>Customers</h4>
          </div>
          <button
            type="button"
            className={`admin-chat-person${selectedCustomer === 'All' ? ' active' : ''}`}
            onClick={() => setSelectedCustomer('All')}
          >
            All conversations
          </button>
          {customerList.length === 0 ? (
            <p className="admin-chat-empty">No customer chats yet.</p>
          ) : (
            customerList.map((customer) => (
              <button
                key={customer}
                type="button"
                className={`admin-chat-person${selectedCustomer === customer ? ' active' : ''}`}
                onClick={() => setSelectedCustomer(customer)}
              >
                {customer}
              </button>
            ))
          )}
        </aside>

        <div className="chat-panel admin-chat-panel">
          {selectedCustomer === 'All' ? (
            <div className="admin-chat-all-panel">
              <div className="admin-chat-all-header">
                <h4>All conversations</h4>
              </div>

              {customerList.length === 0 ? (
                <p className="chat-empty">No customer chats yet.</p>
              ) : (
                <div className="admin-chat-all-list">
                  {customerList.map((customer) => (
                    <button
                      key={customer}
                      type="button"
                      className="admin-chat-person"
                      onClick={() => setSelectedCustomer(customer)}
                    >
                      {customer}
                    </button>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <>
              <div className="chat-thread" aria-live="polite">
                {visibleMessages.length === 0 ? (
                  <p className="chat-empty">No messages in this conversation yet.</p>
                ) : (
                  visibleMessages.map((message) => {
                    const isMine = message.sender === 'Admin' || message.sender === 'Quinto Store'
                    return (
                      <div
                        key={message.id}
                        className={`chat-bubble ${isMine ? 'chat-bubble-self' : 'chat-bubble-other'}`}
                      >
                        <div className="chat-meta">
                          <strong>{message.sender}</strong>
                          <span>{message.time}</span>
                        </div>
                        <p>{message.text}</p>
                      </div>
                    )
                  })
                )}
              </div>

              <form className="chat-form" onSubmit={handleSubmit}>
                <input
                  type="text"
                  value={draft}
                  onChange={(event) => setDraft(event.target.value)}
                  placeholder={`Reply to ${selectedCustomer}...`}
                  aria-label="Type a response"
                />
                <button type="submit" className="btn-green">
                  Send
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

export default AdminChatPage
