import { Routes, Route } from 'react-router-dom'
import AnalyticsTracker from './app/AnalyticsTracker'
import Layout from './app/Layout'
import HomePage from './pages/Home'
import MatchesPage from './pages/Matches'
import MatchesMapPage from './pages/MatchesMap'
import MatchDetailPage from './pages/MatchDetail'
import MatchCreatePage from './pages/MatchCreate'
import TeamsPage from './pages/Teams'
import TeamDetailPage from './pages/TeamDetail'
import LoginPage from './pages/Login'
import PrivateRoute from './app/PrivateRoute'
import SignupPage from './pages/Signup'
import KakaoCallbackPage from './pages/auth/KakaoCallback'
import OAuthFailurePage from './pages/auth/OAuthFailure'
import KakaoSignupCompletePage from './pages/auth/KakaoSignupComplete'
import MyPage from './pages/MyPage'
import MyTeamMembersPage from './pages/MyTeamMembers'
import MyTeamPostsPage from './pages/MyTeamPosts'
import MyNotificationsPage from './pages/MyNotifications'
import MyMatchesPage from './pages/MyMatches'
import TeamCreatePage from './pages/TeamCreate'

function App() {
  return (
    <>
      <AnalyticsTracker />
      <Layout>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/matches" element={<MatchesPage />} />
          <Route path="/matches/map" element={<MatchesMapPage />} />
          <Route path="/matches/:matchId" element={<MatchDetailPage />} />
          <Route path="/matches/create" element={<PrivateRoute><MatchCreatePage /></PrivateRoute>} />
          <Route path="/teams" element={<TeamsPage />} />
          <Route path="/teams/:teamId" element={<TeamDetailPage />} />
          <Route path="/teams/create" element={<PrivateRoute><TeamCreatePage /></PrivateRoute>} />
          <Route path="/mypage" element={<PrivateRoute><MyPage /></PrivateRoute>} />
          <Route path="/mypage/team-members" element={<PrivateRoute><MyTeamMembersPage /></PrivateRoute>} />
          <Route path="/mypage/team-posts" element={<PrivateRoute><MyTeamPostsPage /></PrivateRoute>} />
          <Route path="/mypage/notifications" element={<PrivateRoute><MyNotificationsPage /></PrivateRoute>} />
          <Route path="/mypage/matches" element={<PrivateRoute><MyMatchesPage /></PrivateRoute>} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/signup" element={<SignupPage />} />
          <Route path="/auth/kakao/callback" element={<KakaoCallbackPage />} />
          <Route path="/auth/kakao/signup" element={<KakaoSignupCompletePage />} />
          <Route path="/auth/kakao/failure" element={<OAuthFailurePage />} />
        </Routes>
      </Layout>
    </>
  )
}

export default App
