import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { api } from '../shared/api/client'
import Button from '../shared/ui/Button.jsx'

function TeamCreatePage() {
  const navigate = useNavigate()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState(null)
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    region: '',
    activityDay: '',
    level: '',
  })

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const onSubmit = async (e) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    try {
      const res = await api.post('/v1/teams', formData)
      if (res.data) {
        navigate('/teams', { replace: true })
      }
    } catch (e) {
      const errorMessage = e.response?.data?.message || e.message || '팀 생성에 실패했습니다.'
      setError(errorMessage)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <section className="py-10 sm:py-14">
      <div className="max-w-2xl mx-auto">
        <div className="grid gap-2 mb-6">
          <h2 className="text-3xl font-semibold text-ink">팀 생성</h2>
          <p className="text-mute">새로운 팀을 만들고 다른 팀과 매치를 시작해보세요.</p>
        </div>

        <div className="rounded-2xl border border-gray-100 bg-white/80 shadow-card p-6">
          <form onSubmit={onSubmit} className="grid gap-4">
            <label className="grid gap-1">
              <span className="text-sm text-mute">팀명 <span className="text-red-500">*</span></span>
              <input
                type="text"
                name="name"
                placeholder="판교 FC"
                value={formData.name}
                onChange={handleChange}
                required
                className="border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-200"
              />
            </label>

            <label className="grid gap-1">
              <span className="text-sm text-mute">팀 소개</span>
              <textarea
                name="description"
                placeholder="팀 소개를 입력해주세요."
                value={formData.description}
                onChange={handleChange}
                rows={4}
                className="border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-200 resize-none"
              />
            </label>

            <label className="grid gap-1">
              <span className="text-sm text-mute">활동 지역 <span className="text-red-500">*</span></span>
              <input
                type="text"
                name="region"
                placeholder="서울, 경기, 부산 등"
                value={formData.region}
                onChange={handleChange}
                required
                className="border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-200"
              />
            </label>

            <label className="grid gap-1">
              <span className="text-sm text-mute">주 활동 요일</span>
              <select
                name="activityDay"
                value={formData.activityDay}
                onChange={handleChange}
                className="border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-200"
              >
                <option value="">선택해주세요</option>
                <option value="MONDAY">월요일</option>
                <option value="TUESDAY">화요일</option>
                <option value="WEDNESDAY">수요일</option>
                <option value="THURSDAY">목요일</option>
                <option value="FRIDAY">금요일</option>
                <option value="SATURDAY">토요일</option>
                <option value="SUNDAY">일요일</option>
              </select>
            </label>

            <label className="grid gap-1">
              <span className="text-sm text-mute">팀 수준</span>
              <select
                name="level"
                value={formData.level}
                onChange={handleChange}
                className="border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-200"
              >
                <option value="">선택해주세요</option>
                <option value="BEGINNER">초급</option>
                <option value="INTERMEDIATE">중급</option>
                <option value="ADVANCED">고급</option>
                <option value="PROFESSIONAL">전문</option>
              </select>
            </label>

            {error && (
              <p className="text-red-600 text-sm">{error}</p>
            )}

            <div className="flex gap-3 pt-2">
              <Button type="submit" disabled={isLoading} className="flex-1">
                팀 생성하기
              </Button>
              <Button 
                type="button" 
                variant="ghost" 
                onClick={() => navigate('/teams', { replace: true })}
                disabled={isLoading}
              >
                취소
              </Button>
            </div>
          </form>
        </div>
      </div>
    </section>
  )
}

export default TeamCreatePage

