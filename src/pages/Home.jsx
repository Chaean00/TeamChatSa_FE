import { Link } from 'react-router-dom'
import Button from '../shared/ui/Button.jsx'

function HomePage() {
  const quickLinks = [
    { title: '매치 찾기', desc: '원하는 경기를 바로 찾기', to: '/matches' },
    { title: '팀 찾기', desc: '함께할 팀 둘러보기', to: '/teams' },
    { title: '팀 만들기', desc: '우리 팀 등록하기', to: '/teams/create' },
    { title: '마이페이지', desc: '내 정보와 팀 관리', to: '/mypage' },
  ]

  return (
    <section className="space-y-5 py-4">
      <div className="overflow-hidden rounded-[28px] bg-[linear-gradient(135deg,#0f766e_0%,#0891b2_52%,#67e8f9_100%)] p-6 text-white shadow-card">
        <h1 className="mt-3 text-3xl font-semibold leading-tight">가까운 팀과 매치를 가장 빠르게 연결하세요</h1>
        <p className="mt-3 text-sm text-cyan-50/90">팀 찾기, 매치 찾기, 팀 관리까지 한 곳에서.</p>

        <div className="mt-5 grid grid-cols-2 gap-3">
          <Link to="/matches">
            <Button className="w-full bg-primary-700 text-white hover:bg-primary-800">매치 탐색</Button>
          </Link>
          <Link to="/teams">
            <Button variant="ghost" className="w-full border-white/30 bg-white/10 text-white hover:bg-white/20">팀 둘러보기</Button>
          </Link>
        </div>
      </div>

      <div className="space-y-3">
        {quickLinks.map((item) => (
          <Link key={item.title} to={item.to} className="block rounded-3xl border border-slate-100 bg-white p-4 shadow-[0_10px_24px_rgba(15,23,42,0.05)]">
            <div className="text-base font-semibold text-ink">{item.title}</div>
            <div className="mt-1 text-sm text-mute">{item.desc}</div>
          </Link>
        ))}
      </div>
    </section>
  )
}

export default HomePage
