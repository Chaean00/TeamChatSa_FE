import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { api } from '../api/client'

function NotificationBell() {
  const navigate = useNavigate()
  const [unreadCount, setUnreadCount] = useState(0)
  const [showDropdown, setShowDropdown] = useState(false)
  const [notifications, setNotifications] = useState([])
  const [isLoading, setIsLoading] = useState(false)
  const dropdownRef = useRef(null)

  // 읽지 않은 알림 개수 조회
  const fetchUnreadCount = async () => {
    try {
      const res = await api.get('/v1/notifications/unread-count')
      setUnreadCount(res.data?.data || 0)
    } catch (error) {
      console.error('알림 개수 조회 실패:', error)
    }
  }

  // 알림 목록 조회
  const fetchNotifications = async () => {
    setIsLoading(true)
    try {
      const res = await api.get('/v1/notifications')
      setNotifications(res.data?.data || [])
    } catch (error) {
      console.error('알림 목록 조회 실패:', error)
    } finally {
      setIsLoading(false)
    }
  }

  // 컴포넌트 마운트 시 알림 개수 조회
  useEffect(() => {
    fetchUnreadCount()
    
    // 주기적으로 알림 개수 갱신 (30초마다)
    const interval = setInterval(() => {
      fetchUnreadCount()
    }, 30000)

    // 다른 페이지에서 알림을 읽었을 때 갱신
    const handleNotificationRead = () => {
      fetchUnreadCount()
    }
    window.addEventListener('notification-read', handleNotificationRead)

    return () => {
      clearInterval(interval)
      window.removeEventListener('notification-read', handleNotificationRead)
    }
  }, [])

  // 드롭다운 외부 클릭 시 닫기
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowDropdown(false)
      }
    }

    if (showDropdown) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [showDropdown])

  // 알림 아이콘 클릭
  const handleBellClick = () => {
    if (!showDropdown) {
      fetchNotifications()
    }
    setShowDropdown(!showDropdown)
  }

  // 알림 클릭 처리
  const handleNotificationClick = async (notification) => {
    // 읽지 않은 알림만 읽음 처리
    if (!notification.isRead) {
      try {
        await api.patch(`/v1/notifications/${notification.id}/read`)
        // 로컬 상태 업데이트
        setNotifications(prev => 
          prev.map(n => n.id === notification.id ? { ...n, isRead: true } : n)
        )
        setUnreadCount(prev => Math.max(0, prev - 1))
      } catch (error) {
        console.error('알림 읽음 처리 실패:', error)
      }
    }

    // 드롭다운 닫기
    setShowDropdown(false)

    // 해당 페이지로 이동 (백엔드에서 제공하는 링크 그대로 사용)
    if (notification.link) {
      navigate(notification.link)
    }
  }

  // 모두 읽음 처리
  const handleMarkAllAsRead = async () => {
    try {
      await api.patch('/v1/notifications/read-all')
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })))
      setUnreadCount(0)
    } catch (error) {
      console.error('모든 알림 읽음 처리 실패:', error)
    }
  }

  // 날짜 포맷팅
  const formatDate = (dateString) => {
    if (!dateString) return ''
    const date = new Date(dateString)
    const now = new Date()
    const diff = now - date
    const minutes = Math.floor(diff / 60000)
    const hours = Math.floor(diff / 3600000)
    const days = Math.floor(diff / 86400000)

    if (minutes < 1) return '방금 전'
    if (minutes < 60) return `${minutes}분 전`
    if (hours < 24) return `${hours}시간 전`
    if (days < 7) return `${days}일 전`
    
    return date.toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' })
  }

  return (
    <div className="relative" ref={dropdownRef}>
      {/* 알림 아이콘 + 뱃지 */}
      <button
        onClick={handleBellClick}
        className="relative p-2 hover:bg-gray-100 rounded-lg transition-colors"
        aria-label="알림"
      >
        <svg
          className="w-6 h-6 text-ink"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
          />
        </svg>
        {unreadCount > 0 && (
          <span className="absolute top-0 right-0 bg-red-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {/* 알림 드롭다운 */}
      {showDropdown && (
        <div className="fixed inset-x-4 top-20 z-[80] mx-auto w-auto max-w-[390px] overflow-hidden rounded-[28px] border border-gray-200 bg-white shadow-lg">
          {/* 헤더 */}
          <div className="p-4 border-b border-gray-100 bg-white flex items-center justify-between">
            <h3 className="font-semibold text-ink text-lg">알림</h3>
            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllAsRead}
                className="text-sm text-primary-600 hover:text-primary-700 font-medium"
              >
                모두 읽음
              </button>
            )}
          </div>

          {/* 알림 목록 */}
          <div className="max-h-[min(60vh,28rem)] overflow-y-auto">
            {isLoading ? (
              <div className="p-8 text-center">
                <div className="w-6 h-6 border-2 border-gray-300 border-t-primary-500 rounded-full animate-spin mx-auto"></div>
                <p className="text-mute text-sm mt-2">로딩 중...</p>
              </div>
            ) : notifications.length === 0 ? (
              <div className="p-8 text-center text-mute">
                <svg
                  className="w-12 h-12 mx-auto mb-2 text-gray-300"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
                  />
                </svg>
                <p className="text-sm">알림이 없습니다</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-100">
                {notifications.map((notification) => (
                  <div
                    key={notification.id}
                    onClick={() => handleNotificationClick(notification)}
                    className={`p-4 cursor-pointer transition-colors hover:bg-gray-50 ${
                      !notification.isRead ? 'bg-blue-50/50' : 'bg-white'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      {/* 읽지 않은 알림 표시 */}
                      {!notification.isRead && (
                        <div className="mt-1.5 w-2 h-2 bg-primary-500 rounded-full flex-shrink-0"></div>
                      )}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <p className={`font-semibold text-sm ${
                            !notification.isRead ? 'text-ink' : 'text-gray-600'
                          }`}>
                            {notification.title}
                          </p>
                        </div>
                        <p className={`text-sm mt-1 ${
                          !notification.isRead ? 'text-gray-700' : 'text-gray-500'
                        }`}>
                          {notification.content}
                        </p>
                        <p className="text-xs text-gray-400 mt-2">
                          {formatDate(notification.createdAt)}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

export default NotificationBell
