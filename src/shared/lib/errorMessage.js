export function getErrorMessage(error, fallback = '요청을 처리하지 못했습니다.') {
  const backendMessage = error?.response?.data?.message || error?.response?.data?.error
  if (typeof backendMessage === 'string' && backendMessage.trim()) {
    return backendMessage.trim()
  }

  if (error?.code === 'ERR_NETWORK') {
    return '네트워크 연결을 확인해주세요.'
  }

  const message = typeof error?.message === 'string' ? error.message.trim() : ''
  if (message && message !== 'Network Error') {
    return message
  }

  return fallback
}
