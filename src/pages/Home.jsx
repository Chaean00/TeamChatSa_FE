import Button from '../shared/ui/Button.jsx'

function HomePage() {
  return (
    <section className="py-14 sm:py-20">
      <div className="grid gap-4">
        <h1 className="text-4xl sm:text-5xl font-semibold leading-tight text-ink">
          가까운 상대팀을
          <br className="hidden sm:block" />
          더 빠르고 쉽게 매칭해요
        </h1>
        <p className="text-mute max-w-xl">
          지역, 시간대, 구장 유형에 맞춰 조기축구/풋살 매치를 자동으로 추천받고,
          팀 일정까지 한 번에 관리해보세요.
        </p>
        <div className="flex gap-3 pt-2">
          <Button>지금 매치 찾기</Button>
          <Button variant="ghost">팀 둘러보기</Button>
        </div>
      </div>
      <div className="mt-10 rounded-2xl bg-gradient-to-br from-primary-50 to-white p-6 sm:p-10 shadow-card">
        <div className="grid gap-2">
          <div className="text-sm text-mute">오늘의 인기 매치</div>
          <div className="grid sm:grid-cols-3 gap-3">
            <div className="rounded-xl border border-gray-100 p-4 bg-white/70">
              <div className="text-ink font-medium">서울 · 금요일 저녁</div>
              <div className="text-mute text-sm">합정 풋살장 · 7:00 PM</div>
            </div>
            <div className="rounded-xl border border-gray-100 p-4 bg-white/70">
              <div className="text-ink font-medium">판교 · 토요일 오전</div>
              <div className="text-mute text-sm">N타워 잔디구장 · 10:00 AM</div>
            </div>
            <div className="rounded-xl border border-gray-100 p-4 bg-white/70">
              <div className="text-ink font-medium">부산 · 일요일 오후</div>
              <div className="text-mute text-sm">수영만 풋살장 · 3:00 PM</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

export default HomePage

