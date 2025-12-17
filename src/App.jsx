import { Routes, Route } from 'react-router-dom'
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
import MyPage from './pages/MyPage'
import MyTeamMembersPage from './pages/MyTeamMembers'
import MyTeamPostsPage from './pages/MyTeamPosts'
import MyNotificationsPage from './pages/MyNotifications'
import TeamCreatePage from './pages/TeamCreate'

function App() {
  return (
    <Layout>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/matches" element={<PrivateRoute><MatchesPage /></PrivateRoute>} />
        <Route path="/matches/map" element={<PrivateRoute><MatchesMapPage /></PrivateRoute>} />
        <Route path="/matches/:matchId" element={<PrivateRoute><MatchDetailPage /></PrivateRoute>} />
        <Route path="/matches/create" element={<PrivateRoute><MatchCreatePage /></PrivateRoute>} />
        <Route path="/teams" element={<PrivateRoute><TeamsPage /></PrivateRoute>} />
        <Route path="/teams/:teamId" element={<PrivateRoute><TeamDetailPage /></PrivateRoute>} />
        <Route path="/teams/create" element={<PrivateRoute><TeamCreatePage /></PrivateRoute>} />
        <Route path="/mypage" element={<PrivateRoute><MyPage /></PrivateRoute>} />
        <Route path="/mypage/team-members" element={<PrivateRoute><MyTeamMembersPage /></PrivateRoute>} />
        <Route path="/mypage/team-posts" element={<PrivateRoute><MyTeamPostsPage /></PrivateRoute>} />
        <Route path="/mypage/notifications" element={<PrivateRoute><MyNotificationsPage /></PrivateRoute>} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/signup" element={<SignupPage />} />
        <Route path="/auth/kakao/callback" element={<KakaoCallbackPage />} />
        <Route path="/auth/kakao/failure" element={<OAuthFailurePage />} />
      </Routes>
    </Layout>
  )
}

export default App
