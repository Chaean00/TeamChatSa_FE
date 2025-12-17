import { useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { api } from '../shared/api/client'
import { useUser } from '../shared/hook/useUser'
import Button from '../shared/ui/Button.jsx'

function TeamCreatePage() {
  const navigate = useNavigate()
  const { refetch } = useUser()
  const fileInputRef = useRef(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState(null)
  const [imagePreview, setImagePreview] = useState(null)
  const [formData, setFormData] = useState({
    image: null,
    name: '',
    area: '',
    description: '',
    contactType: 'KAKAO',
    contact: '',
    level: '',
  })

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleImageChange = (e) => {
    const file = e.target.files[0]
    if (file) {
      setFormData(prev => ({ ...prev, image: file }))
      // 미리보기 URL 생성
      const reader = new FileReader()
      reader.onloadend = () => {
        setImagePreview(reader.result)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleImageRemove = (e) => {
    e.preventDefault()
    e.stopPropagation()
    setFormData(prev => ({ ...prev, image: null }))
    setImagePreview(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const onSubmit = async (e) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    try {
      let imageUrl = null      // 이미지가 있으면 GCP Cloud Storage에 업로드
      if (formData.image) {
        // 1. 서명된 URL 받기
        const presignRes = await api.post('/v1/gcp/storage/presign-upload', {
          fileName: formData.image.name,
          contentType: formData.image.type,
        })

        const presignData = presignRes.data?.data
        if (!presignData || !presignData.uploadUrl) {
          throw new Error('서명된 URL을 받아오는데 실패했습니다.')
        }

        if (!presignData.publicUrl) {
          throw new Error('공개 URL을 받아오는데 실패했습니다.')
        }

        // 2. 서명된 URL로 이미지 업로드 (PUT 요청)
        const uploadRes = await fetch(presignData.uploadUrl, {
          method: 'PUT',
          body: formData.image,
          headers: {
            'Content-Type': formData.image.type,
          },
        })

        if (!uploadRes.ok) {
          throw new Error('이미지 업로드에 실패했습니다.')
        }

        // 3. 업로드된 이미지의 공개 URL 사용
        imageUrl = presignData.publicUrl
      }

      // 4. 팀 생성 API 호출 (이미지 URL만 전송)
      const payload = {
        name: formData.name,
        area: formData.area,
        description: formData.description || '',
        contactType: formData.contactType,
        contact: formData.contact,
        level: formData.level,
      }
      
      if (imageUrl) {
        payload.imgUrl = imageUrl
      }

      const res = await api.post('/v1/teams', payload)
      
      if (res.data) {
        // 팀 생성 후 사용자 정보 갱신 (teamId, teamRole 업데이트)
        await refetch()
        alert('팀이 성공적으로 생성되었습니다.')
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
            {/* 1. 팀 이미지 */}
            <label className="grid gap-1">
              <span className="text-sm text-mute">팀 이미지</span>
              <div className="space-y-2">
                <div className="relative border border-gray-200 rounded-lg overflow-hidden bg-gray-50 h-64 flex items-center justify-center">
                  {imagePreview ? (
                    <>
                      <img 
                        src={imagePreview} 
                        alt="팀 이미지 미리보기" 
                        className="w-full h-full object-cover"
                      />
                      <button
                        type="button"
                        onClick={handleImageRemove}
                        onMouseDown={(e) => e.preventDefault()}
                        className="absolute top-2 right-2 bg-red-500 hover:bg-red-600 text-white rounded-full w-8 h-8 flex items-center justify-center text-sm transition-colors z-10"
                      >
                        ×
                      </button>
                    </>
                  ) : (
                    <span className="text-mute text-sm">이미지를 선택해주세요</span>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full text-sm py-2 px-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors text-mute"
                >
                  {imagePreview ? '이미지 변경' : '이미지 선택'}
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                  className="hidden"
                />
              </div>
            </label>

            {/* 2. 팀 이름 */}
            <label className="grid gap-1">
              <span className="text-sm text-mute">팀 이름 <span className="text-red-500">*</span></span>
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

            {/* 3. 팀 활동 지역 */}
            <label className="grid gap-1">
              <span className="text-sm text-mute">팀 활동 지역 <span className="text-red-500">*</span></span>
              <input
                type="text"
                name="area"
                placeholder="서울-노원구"
                value={formData.area}
                onChange={handleChange}
                required
                className="border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-200"
              />
              <p className="text-xs text-mute mt-0.5">시/도-구/군 형식으로 입력해주세요. (예: 서울-노원구, 경기-성남시)</p>
            </label>

            {/* 4. 팀 설명 */}
            <label className="grid gap-1">
              <span className="text-sm text-mute">팀 설명</span>
              <textarea
                name="description"
                placeholder="팀 소개를 입력해주세요."
                value={formData.description}
                onChange={handleChange}
                rows={4}
                className="border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-200 resize-none"
              />
            </label>

            {/* 5. 팀 레벨 */}
            <label className="grid gap-1">
              <span className="text-sm text-mute">팀 레벨 <span className="text-red-500">*</span></span>
              <select
                name="level"
                value={formData.level}
                onChange={handleChange}
                required
                className="border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-200"
              >
                <option value="">선택해주세요</option>
                <option value="하하">하하</option>
                <option value="중하">중하</option>
                <option value="중">중</option>
                <option value="중상">중상</option>
                <option value="상">상</option>
              </select>
            </label>

            {/* 6. 연락수단 */}
            <div className="grid gap-2">
              <label className="grid gap-1">
                <span className="text-sm text-mute">연락수단 타입 <span className="text-red-500">*</span></span>
                <select
                  name="contactType"
                  value={formData.contactType}
                  onChange={handleChange}
                  className="border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-200"
                >
                  <option value="KAKAO">카카오톡 ID</option>
                  <option value="PHONE">전화번호</option>
                  <option value="EMAIL">이메일</option>
                </select>
              </label>
              <label className="grid gap-1">
                <span className="text-sm text-mute">연락처 정보 <span className="text-red-500">*</span></span>
                <input
                  type="text"
                  name="contact"
                  placeholder={
                    formData.contactType === 'KAKAO' 
                      ? '카카오톡 ID를 입력해주세요'
                      : formData.contactType === 'PHONE'
                      ? '전화번호를 입력해주세요 (예: 010-1234-5678)'
                      : '이메일을 입력해주세요'
                  }
                  value={formData.contact}
                  onChange={handleChange}
                  required
                  className="border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-200"
                />
              </label>
            </div>

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

