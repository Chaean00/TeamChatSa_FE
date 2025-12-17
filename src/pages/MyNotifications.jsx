import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { api } from '../shared/api/client'
import Button from '../shared/ui/Button.jsx'

function MyNotificationsPage() {
  const navigate = useNavigate()
  const [notifications, setNotifications] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [unreadCount, setUnreadCount] = useState(0)
  const [filter, setFilter] = useState('unread') // 'all', 'unread'

  useEffect(() => {
    fetchUnreadCount()
    fetchNotifications()
  }, [])

  useEffect(() => {
    fetchNotifications()
  }, [filter])

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
      // 필터에 따라 다른 API 엔드포인트 호출
      let endpoint = '/v1/notifications'
      if (filter === 'all') {
        endpoint = '/v1/notifications/all'
      }
      // filter === 'unread'일 때는 기본 엔드포인트 사용
      
      const res = await api.get(endpoint)
      const notificationsData = res.data?.data || []
      
      setNotifications(notificationsData)
    } catch (error) {
      console.error('알림 목록 조회 실패:', error)
      setNotifications([])
    } finally {
      setIsLoading(false)
    }
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
        
        // NotificationBell 컴포넌트에 알림 개수 갱신 이벤트 발생
        window.dispatchEvent(new CustomEvent('notification-read'))
      } catch (error) {
        console.error('알림 읽음 처리 실패:', error)
      }
    }

    // 해당 페이지로 이동
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
      
      // NotificationBell 컴포넌트에 알림 개수 갱신 이벤트 발생
      window.dispatchEvent(new CustomEvent('notification-read'))
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
    
    return date.toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  // 알림 타입별 아이콘
  const getNotificationIcon = (type) => {
    switch (type) {
      case 'MATCH_APPLICATION':
        return (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        )
      case 'TEAM_JOIN_APPLICATION':
        return (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
          </svg>
        )
      default:
        return (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
          </svg>
        )
    }
  }

  return (
    <section className="py-10 sm:py-14">
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-3xl font-semibold text-ink">알림 내역</h2>
            <p className="text-mute text-sm mt-1">
              {unreadCount > 0 && (
                <span className="text-primary-600 font-medium">{unreadCount}개의 읽지 않은 알림</span>
              )}
              {unreadCount === 0 && <span>모든 알림을 확인했습니다.</span>}
            </p>
          </div>
          {unreadCount > 0 && (
            <Button
              variant="ghost"
              onClick={handleMarkAllAsRead}
              className="text-sm"
            >
              모두 읽음
            </Button>
          )}
        </div>

        {/* 필터 탭 */}
        <div className="flex gap-2 mb-6 border-b border-gray-200">
          <button
            onClick={() => setFilter('unread')}
            className={`px-4 py-2 text-sm font-medium transition-colors border-b-2 ${
              filter === 'unread'
                ? 'border-primary-600 text-primary-600'
                : 'border-transparent text-mute hover:text-ink'
            }`}
          >
            읽지 않음
            {unreadCount > 0 && (
              <span className="ml-1 text-xs bg-primary-500 text-white rounded-full px-1.5 py-0.5">
                {unreadCount}
              </span>
            )}
          </button>
          <button
            onClick={() => setFilter('all')}
            className={`px-4 py-2 text-sm font-medium transition-colors border-b-2 ${
              filter === 'all'
                ? 'border-primary-600 text-primary-600'
                : 'border-transparent text-mute hover:text-ink'
            }`}
          >
            전체
          </button>
        </div>

        {/* 알림 목록 */}
        <div className="space-y-3">
          {isLoading ? (
            <div className="rounded-2xl border border-gray-100 bg-white/80 shadow-card p-12 text-center">
              <div className="w-8 h-8 border-2 border-gray-300 border-t-primary-500 rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-mute">로딩 중...</p>
            </div>
          ) : notifications.length === 0 ? (
            <div className="rounded-2xl border border-gray-100 bg-white/80 shadow-card p-12 text-center">
              <svg
                className="w-16 h-16 mx-auto mb-4 text-gray-300"
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
              <p className="text-mute text-lg mb-2">
                {filter === 'unread' ? '읽지 않은 알림이 없습니다.' : '알림이 없습니다.'}
              </p>
              <p className="text-mute text-sm">
                {filter === 'unread' ? '모든 알림을 확인했습니다.' : '새로운 알림이 도착하면 여기에 표시됩니다.'}
              </p>
            </div>
          ) : (
            notifications.map((notification) => (
              <div
                key={notification.id}
                onClick={() => handleNotificationClick(notification)}
                className={`rounded-xl border p-4 cursor-pointer transition-all hover:shadow-md ${
                  !notification.isRead
                    ? 'border-primary-200 bg-primary-50/50 shadow-sm'
                    : 'border-gray-100 bg-white/80 shadow-card'
                }`}
              >
                <div className="flex items-start gap-4">
                  {/* 아이콘 */}
                  <div className={`flex-shrink-0 mt-0.5 ${
                    !notification.isRead ? 'text-primary-600' : 'text-gray-400'
                  }`}>
                    {getNotificationIcon(notification.type)}
                  </div>

                  {/* 내용 */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <h3 className={`font-semibold text-base ${
                        !notification.isRead ? 'text-ink' : 'text-gray-600'
                      }`}>
                        {notification.title}
                      </h3>
                      {!notification.isRead && (
                        <span className="flex-shrink-0 w-2 h-2 bg-primary-500 rounded-full mt-2"></span>
                      )}
                    </div>
                    <p className={`text-sm mb-2 ${
                      !notification.isRead ? 'text-gray-700' : 'text-gray-500'
                    }`}>
                      {notification.content}
                    </p>
                    <div className="flex items-center justify-between">
                      <p className="text-xs text-gray-400">
                        {formatDate(notification.createdAt)}
                      </p>
                      {notification.link && (
                        <span className="text-xs text-primary-600 font-medium">
                          자세히 보기 →
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </section>
  )
}

export default MyNotificationsPage

