function MatchesPage() {
  return (
    <section className="py-10 sm:py-14">
      <div className="grid gap-2">
        <h2 className="text-3xl font-semibold text-ink">매치 찾기</h2>
        <p className="text-mute">지역, 날짜, 시간대, 구장 유형으로 손쉽게 필터링하세요.</p>
      </div>
      <div className="mt-6 grid sm:grid-cols-3 gap-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="rounded-xl border border-gray-100 p-4 bg-white/70 shadow-card">
            <div className="text-ink font-medium">서울 · 주중 저녁</div>
            <div className="text-mute text-sm">합정 풋살장 · 7:00 PM</div>
          </div>
        ))}
      </div>
    </section>
  )
}

export default MatchesPage

