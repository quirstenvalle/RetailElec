import { useEffect } from 'react'

function Toast({ message, onClose }) {
  useEffect(() => {
    if (!message) {
      return undefined
    }
    const timer = window.setTimeout(onClose, 2200)
    return () => window.clearTimeout(timer)
  }, [message, onClose])

  if (!message) {
    return null
  }

  return (
    <div className="app-toast" role="status" aria-live="polite">
      {message}
    </div>
  )
}

export default Toast
