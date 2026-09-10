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

function getBotReply(message) {
  const text = message.toLowerCase()

  if (text.includes('order') || text.includes('status')) {
    return 'Your order updates are available in the Orders page. Our team can also assist with delivery and tracking questions.'
  }

  if (text.includes('delivery') || text.includes('courier') || text.includes('shipping')) {
    return 'Courier delivery is available and the address can be provided at checkout. The final courier booking is handled by the store admin.'
  }

  if (text.includes('return') || text.includes('refund')) {
    return 'Returns and refunds are handled through our support process. Please share your order number so we can guide you through the next step.'
  }

  if (text.includes('sale') || text.includes('price') || text.includes('discount')) {
    return 'Sale pricing is based on the product promo settings. If a product is marked on sale, the discounted price is shown in the storefront.'
  }

  if (text.includes('product') || text.includes('catalog') || text.includes('inventory') || text.includes('availability')) {
    return 'You can browse the product catalog and categories from the home and category pages. We can help with stock, item selection, or available wholesale units.'
  }

  return 'Thanks for your message. Please tell us your order number or the product you need help with, and we will assist you right away.'
}

function CustomerChatPage({ user, compact = false }) {
  const [messages, setMessages] = useState(() => readChatThread())
  const [draft, setDraft] = useState('')

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

  const currentUserName = user?.name || 'You'

  const handleSubmit = (event) => {
    event.preventDefault()
    const nextMessage = draft.trim()
    if (!nextMessage) return

    const timestamp = new Date().toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
    })

    const customerMessage = {
      id: Date.now(),
      sender: currentUserName,
      text: nextMessage,
      time: timestamp,
    }

    const nextThread = [...messages, customerMessage]
    const autoReply = {
      id: Date.now() + 1,
      sender: 'Quinto Store',
      text: getBotReply(nextMessage),
      time: new Date().toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit',
      }),
    }

    pushMessage([...nextThread, autoReply])
    setDraft('')
  }

  const quickPhrases = ['Order status', 'Courier delivery', 'Return & refund', 'Product availability']

  if (compact) {
    return (
      <div className="chat-page chat-page-compact">
        <div className="chat-panel chat-panel-compact">
          <div className="chat-thread chat-thread-compact" aria-live="polite">
            {messages.length === 0 ? (
              <p className="chat-empty">Send a message to start chatting with Quinto Store support.</p>
            ) : (
              messages.map((message) => {
                const isMine = message.sender === currentUserName
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

          <div className="chat-quick-actions chat-quick-actions-compact">
            {quickPhrases.map((phrase) => (
              <button type="button" key={phrase} onClick={() => setDraft(phrase)}>
                {phrase}
              </button>
            ))}
          </div>

          <form className="chat-form chat-form-compact" onSubmit={handleSubmit}>
            <input
              type="text"
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
              placeholder="Type your message..."
              aria-label="Type a message"
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
    <div className="chat-page">
      <div className="section-head">
        <div>
          <h3>Customer Support Chat</h3>
          <p>Ask about your order, delivery, refunds, or products.</p>
        </div>
      </div>

      <div className="chat-panel">
        <div className="chat-thread" aria-live="polite">
          {messages.map((message) => {
            const isMine = message.sender === currentUserName
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
          })}
        </div>

        <div className="chat-quick-actions">
          {quickPhrases.map((phrase) => (
            <button type="button" key={phrase} onClick={() => setDraft(phrase)}>
              {phrase}
            </button>
          ))}
        </div>

        <form className="chat-form" onSubmit={handleSubmit}>
          <input
            type="text"
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            placeholder="Type your message..."
            aria-label="Type a message"
          />
          <button type="submit" className="btn-green">
            Send
          </button>
        </form>
      </div>
    </div>
  )
}

export default CustomerChatPage
