import { Link } from 'react-router-dom'
import Button from '../shared/ui/Button.jsx'

function TeamsPage() {
  return (
    <section className="py-10 sm:py-14">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div className="grid gap-2">
          <h2 className="text-3xl font-semibold text-ink">팀 찾기</h2>
          <p className="text-mute">랭크, 활동지역, 요일, 매너지수 기준으로 팀을 찾아보세요.</p>
        </div>
        <Link to="/teams/create" className="w-full sm:w-auto">
          <Button className="w-full sm:w-auto">팀 생성하기</Button>
        </Link>
      </div>
      <div className="mt-6 grid sm:grid-cols-3 gap-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="rounded-xl border border-gray-100 p-4 bg-white/70 shadow-card">
            <div className="text-ink font-medium">판교 FC</div>
            <div className="text-mute text-sm">판교 · 토/일 오전 · 매너지수 상</div>
          </div>
        ))}
      </div>
    </section>
  )
}

export default TeamsPage

