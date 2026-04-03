import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import { initializeAnalytics, trackPageView } from '../shared/lib/analytics'

function AnalyticsTracker() {
  const location = useLocation()

  useEffect(() => {
    initializeAnalytics()
  }, [])

  useEffect(() => {
    trackPageView()
  }, [location.pathname, location.search])

  return null
}

export default AnalyticsTracker
