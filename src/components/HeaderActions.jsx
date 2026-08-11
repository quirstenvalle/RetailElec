import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { assets } from '../constants/assets'
import {
  fetchNotifications,
  markAllNotificationsRead,
  markNotificationRead,
} from '../api/notificationsApi'

function timeAgo(iso) {
  const diff = Date.now() - new Date(iso).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'Just now'
  if (mins < 60) return `${mins}m ago`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  return `${days}d ago`
}

function HeaderActions({ user, profilePath, onNotificationsChange }) {
  const navigate = useNavigate()
  const [notifications, setNotifications] = useState([])
  const [openPanel, setOpenPanel] = useState(null)
  const rootRef = useRef(null)

  const unreadCount = notifications.filter((item) => item.unread).length

  const loadNotifications = async () => {
    try {
      const rows = await fetchNotifications()
      setNotifications(rows)
      onNotificationsChange?.(rows)
    } catch (error) {
      console.error(error)
    }
  }

  useEffect(() => {
    loadNotifications()
    const timer = setInterval(loadNotifications, 20000)
    return () => clearInterval(timer)
  }, [user?.id])

  useEffect(() => {
    const onClickOutside = (event) => {
      if (!rootRef.current?.contains(event.target)) {
        setOpenPanel(null)
      }
    }
    document.addEventListener('mousedown', onClickOutside)
    return () => document.removeEventListener('mousedown', onClickOutside)
  }, [])

  const handleOpenNotification = async (item) => {
    if (item.unread) {
      await markNotificationRead(item.id)
      setNotifications((prev) =>
        prev.map((row) => (row.id === item.id ? { ...row, unread: false, readAt: new Date().toISOString() } : row)),
      )
    }
    setOpenPanel(null)
    if (item.link) navigate(item.link)
  }

  const handleMarkAll = async () => {
    await markAllNotificationsRead()
    setNotifications((prev) =>
      prev.map((row) => ({ ...row, unread: false, readAt: row.readAt || new Date().toISOString() })),
    )
  }

  return (
    <div className="header-actions" ref={rootRef}>
      <div className="header-action">
        <button
          type="button"
          className="icon-btn icon-32"
          aria-label="Notifications"
          aria-expanded={openPanel === 'notifications'}
          onClick={() => setOpenPanel((prev) => (prev === 'notifications' ? null : 'notifications'))}
        >
          <img src={assets.iconBell} alt="" />
          {unreadCount > 0 ? <span className="notif-badge">{unreadCount > 9 ? '9+' : unreadCount}</span> : null}
        </button>
        {openPanel === 'notifications' ? (
          <div className="header-dropdown notif-dropdown">
            <div className="header-dropdown__head">
              <strong>Notifications</strong>
              <button type="button" className="link-orange" onClick={handleMarkAll} disabled={!unreadCount}>
                Mark all read
              </button>
            </div>
            <div className="header-dropdown__list">
              {notifications.length === 0 ? (
                <p className="header-dropdown__empty">No notifications yet.</p>
              ) : (
                notifications.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    className={`notif-item${item.unread ? ' unread' : ''}`}
                    onClick={() => handleOpenNotification(item)}
                  >
                    <div>
                      <strong>{item.title}</strong>
                      <span>{item.body}</span>
                    </div>
                    <small>{timeAgo(item.createdAt)}</small>
                  </button>
                ))
              )}
            </div>
          </div>
        ) : null}
      </div>

      <Link to={profilePath} className="icon-btn icon-36" aria-label="Profile">
        <img src={assets.iconAvatar} alt="" />
      </Link>
    </div>
  )
}

export default HeaderActions
