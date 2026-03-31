import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { api } from '../shared/api/client'
import { getErrorMessage } from '../shared/lib/errorMessage'
import Button from '../shared/ui/Button.jsx'
import KakaoMap from '../shared/components/KakaoMap.jsx'

function MatchCreatePage() {
  const navigate = useNavigate()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState(null)
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    matchDate: '',
    matchTime: '',
    headCount: '',
    lat: '',
    lng: '',
    address: '',
    placeName: '',
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
      // 날짜와 시간을 합쳐서 ISO 형식으로 변환
      const dateTime = formData.matchDate && formData.matchTime
        ? `${formData.matchDate}T${formData.matchTime}:00`
        : formData.matchDate
          ? `${formData.matchDate}T00:00:00`
          : null

      if (!dateTime) {
        throw new Error('매치 날짜를 입력해주세요.')
      }

      if (!formData.lat || !formData.lng) {
        throw new Error('지도에서 매치 장소를 선택해주세요.')
      }

      const payload = {
        title: formData.title,
        content: formData.content,
        matchDate: dateTime,
        lat: parseFloat(formData.lat),
        lng: parseFloat(formData.lng),
        address: formData.address,
      }

      if (formData.placeName) {
        payload.placeName = formData.placeName
      }

      if (formData.headCount) {
        payload.headCount = parseInt(formData.headCount, 10)
      }

      await api.post('/v1/matches', payload)
      
      alert('매치가 성공적으로 등록되었습니다.')
      navigate('/matches', { replace: true })
    } catch (e) {
      setError(getErrorMessage(e, '매치 등록에 실패했습니다.'))
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <section className="py-10 sm:py-14">
      <div className="max-w-2xl mx-auto">
        <div className="grid gap-2 mb-6">
          <h2 className="text-3xl font-semibold text-ink">매치 등록</h2>
          <p className="text-mute">새 매치를 등록하고 상대 팀을 모집해보세요.</p>
        </div>

        <div className="rounded-2xl border border-gray-100 bg-white/80 shadow-card p-6">
          <form 
            onSubmit={onSubmit} 
            onKeyDown={(e) => {
              if (e.key === 'Enter' && e.target.tagName !== 'TEXTAREA') {
                e.preventDefault()
              }
            }}
            className="grid gap-4"
          >
            <label className="grid gap-1">
              <span className="text-sm text-mute">제목 <span className="text-red-500">*</span></span>
              <input
                type="text"
                name="title"
                placeholder="매치 제목을 입력하세요"
                value={formData.title}
                onChange={handleChange}
                required
                maxLength={100}
                className="border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-200"
              />
            </label>

            <label className="grid gap-1">
              <span className="text-sm text-mute">내용 <span className="text-red-500">*</span></span>
              <textarea
                name="content"
                placeholder="매치 상세 내용을 입력하세요"
                value={formData.content}
                onChange={handleChange}
                required
                rows={6}
                className="border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-200 resize-none"
              />
            </label>

            <div className="grid sm:grid-cols-2 gap-4">
              <label className="grid gap-1">
                <span className="text-sm text-mute">매치 날짜 <span className="text-red-500">*</span></span>
                <input
                  type="date"
                  name="matchDate"
                  value={formData.matchDate}
                  onChange={handleChange}
                  required
                  className="border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-200"
                />
              </label>

              <label className="grid gap-1">
                <span className="text-sm text-mute">매치 시간 <span className="text-red-500">*</span></span>
                <input
                  type="time"
                  name="matchTime"
                  value={formData.matchTime}
                  onChange={handleChange}
                  required
                  className="border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-200"
                />
              </label>
            </div>

            <label className="grid gap-1">
              <span className="text-sm text-mute">경기 인원 <span className="text-red-500">*</span></span>
              <select
                name="headCount"
                value={formData.headCount}
                onChange={handleChange}
                required
                className="border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-200"
              >
                <option value="">선택해주세요</option>
                <option value="4">4 vs 4</option>
                <option value="5">5 vs 5</option>
                <option value="6">6 vs 6</option>
                <option value="7">7 vs 7</option>
                <option value="8">8 vs 8</option>
                <option value="9">9 vs 9</option>
                <option value="10">10 vs 10</option>
                <option value="11">11 vs 11</option>
              </select>
            </label>

            <div className="grid gap-1">
              <span className="text-sm text-mute">매치 장소 선택 <span className="text-red-500">*</span></span>
              <KakaoMap
                onLocationSelect={(location) => {
                  setFormData(prev => ({
                    ...prev,
                    lat: location.lat.toString(),
                    lng: location.lng.toString(),
                    address: location.address,
                    placeName: location.placeName || location.address || prev.placeName
                  }))
                }}
                initialLat={formData.lat ? parseFloat(formData.lat) : undefined}
                initialLng={formData.lng ? parseFloat(formData.lng) : undefined}
                initialAddress={formData.address}
                initialPlaceName={formData.placeName}
              />
            </div>

            <label className="grid gap-1">
              <span className="text-sm text-mute">장소명</span>
              <input
                type="text"
                name="placeName"
                placeholder="지도에서 자동으로 입력됩니다"
                value={formData.placeName}
                onChange={handleChange}
                maxLength={120}
                className="border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-200 bg-gray-50"
                readOnly
              />
            </label>

            <label className="grid gap-1">
              <span className="text-sm text-mute">주소 <span className="text-red-500">*</span></span>
              <input
                type="text"
                name="address"
                placeholder="지도에서 자동으로 입력됩니다"
                value={formData.address}
                onChange={handleChange}
                required
                maxLength={255}
                className="border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-200 bg-gray-50"
                readOnly
              />
            </label>

            {error && (
              <p className="text-red-600 text-sm">{error}</p>
            )}

            <div className="grid grid-cols-2 gap-3 pt-2">
              <Button type="submit" disabled={isLoading} className="w-full">
                매치 등록하기
              </Button>
              <Button 
                type="button" 
                variant="ghost" 
                onClick={() => navigate('/matches', { replace: true })}
                disabled={isLoading}
                className="w-full"
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

export default MatchCreatePage
