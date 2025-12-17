import { useState, useEffect, useRef, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { api } from '../shared/api/client'
import Button from '../shared/ui/Button.jsx'

function MatchesMapPage() {
  const navigate = useNavigate()
  const mapRef = useRef(null)
  const mapInstanceRef = useRef(null)
  const markersRef = useRef([])
  const clustererRef = useRef(null)
  const [isMapLoaded, setIsMapLoaded] = useState(false)
  const [matches, setMatches] = useState([])
  const [isLoading, setIsLoading] = useState(false)
  const [showSearchButton, setShowSearchButton] = useState(false)
  const [currentBounds, setCurrentBounds] = useState(null)
  const [error, setError] = useState(null)
  
  // 필터 상태
  const [tempFilters, setTempFilters] = useState({
    startDate: '',
    endDate: '',
    region: '',
    headCount: '',
  })
  
  const [appliedFilters, setAppliedFilters] = useState({
    startDate: '',
    endDate: '',
    region: '',
    headCount: '',
  })
  
  // 한국 시도 목록
  const regions = [
    { value: '', label: '전체' },
    { value: '서울', label: '서울' },
    { value: '부산', label: '부산' },
    { value: '대구', label: '대구' },
    { value: '인천', label: '인천' },
    { value: '광주', label: '광주' },
    { value: '대전', label: '대전' },
    { value: '울산', label: '울산' },
    { value: '세종', label: '세종' },
    { value: '경기', label: '경기' },
    { value: '강원', label: '강원' },
    { value: '충청북도', label: '충북' },
    { value: '충청남도', label: '충남' },
    { value: '전북특별자치도', label: '전북' },
    { value: '전라남도', label: '전남' },
    { value: '경상북도', label: '경북' },
    { value: '경상남도', label: '경남' },
    { value: '제주특별자치도', label: '제주' },
  ]

  // 카카오맵 스크립트 로드 (클러스터 라이브러리 포함)
  useEffect(() => {
    const apiKey = import.meta.env.VITE_KAKAO_MAP_API_KEY
    
    if (!apiKey) {
      console.error('카카오맵 API 키가 설정되지 않았습니다.')
      return
    }

    if (window.kakao && window.kakao.maps) {
      setIsMapLoaded(true)
      return
    }

    const script = document.createElement('script')
    script.src = `//dapi.kakao.com/v2/maps/sdk.js?appkey=${apiKey}&libraries=services,clusterer&autoload=false`
    script.async = true
    
    script.onload = () => {
      window.kakao.maps.load(() => {
        setIsMapLoaded(true)
      })
    }

    document.head.appendChild(script)
  }, [])

  // 지도 초기화
  useEffect(() => {
    if (!isMapLoaded || !window.kakao || !window.kakao.maps || mapInstanceRef.current) {
      return
    }

    const container = mapRef.current
    if (!container) return

    try {
      const options = {
        center: new window.kakao.maps.LatLng(37.5665, 126.9780), // 서울시청
        level: 5
      }

      const map = new window.kakao.maps.Map(container, options)
      mapInstanceRef.current = map

      // 마커 클러스터러 생성 (클러스터러가 사용 가능한 경우)
      if (window.kakao.maps.MarkerClusterer) {
        const clusterer = new window.kakao.maps.MarkerClusterer({
          map: map,
          averageCenter: true,
          minLevel: 4,
          calculator: [10, 30, 50], // 클러스터 크기
          styles: [
            {
              width: '40px',
              height: '40px',
              background: 'rgba(59, 130, 246, 0.8)',
              borderRadius: '50%',
              color: '#fff',
              textAlign: 'center',
              fontWeight: 'bold',
              lineHeight: '40px',
            },
            {
              width: '50px',
              height: '50px',
              background: 'rgba(59, 130, 246, 0.8)',
              borderRadius: '50%',
              color: '#fff',
              textAlign: 'center',
              fontWeight: 'bold',
              lineHeight: '50px',
            },
            {
              width: '60px',
              height: '60px',
              background: 'rgba(59, 130, 246, 0.8)',
              borderRadius: '50%',
              color: '#fff',
              textAlign: 'center',
              fontWeight: 'bold',
              lineHeight: '60px',
            },
          ],
        })
        clustererRef.current = clusterer
      } else {
        console.warn('MarkerClusterer가 로드되지 않았습니다. 클러스터링 없이 진행합니다.')
      }

      // 지도 이동 이벤트 리스너 (쓰로틀링 적용)
      let boundsUpdateTimer = null
      const updateBoundsThrottled = () => {
        if (boundsUpdateTimer) return
        boundsUpdateTimer = setTimeout(() => {
          if (mapInstanceRef.current) {
            const bounds = mapInstanceRef.current.getBounds()
            const swLatlng = bounds.getSouthWest()
            const neLatlng = bounds.getNorthEast()
            setCurrentBounds({
              swLat: swLatlng.getLat(),
              swLng: swLatlng.getLng(),
              neLat: neLatlng.getLat(),
              neLng: neLatlng.getLng(),
            })
            setShowSearchButton(true)
          }
          boundsUpdateTimer = null
        }, 200) // 200ms 쓰로틀링
      }

      window.kakao.maps.event.addListener(map, 'dragend', updateBoundsThrottled)
      window.kakao.maps.event.addListener(map, 'zoom_changed', updateBoundsThrottled)

      // 초기 바운드 설정
      const bounds = map.getBounds()
      const swLatlng = bounds.getSouthWest()
      const neLatlng = bounds.getNorthEast()
      setCurrentBounds({
        swLat: swLatlng.getLat(),
        swLng: swLatlng.getLng(),
        neLat: neLatlng.getLat(),
        neLng: neLatlng.getLng(),
      })
      setShowSearchButton(true) // 초기 로드 시에도 검색 버튼 활성화
    } catch (error) {
      console.error('지도 초기화 중 오류 발생:', error)
      setError('지도를 불러오는 중 오류가 발생했습니다.')
    }
  }, [isMapLoaded])

  // 날짜/시간 포맷팅 함수
  const formatMatchDateTime = (matchDate, matchTime) => {
    if (!matchDate) return ''
    
    try {
      const date = new Date(matchDate)
      if (isNaN(date.getTime())) return matchDate
      
      const month = date.getMonth() + 1
      const day = date.getDate()
      const weekdays = ['일', '월', '화', '수', '목', '금', '토']
      const weekday = weekdays[date.getDay()]
      const timeText = matchTime ? ` ${matchTime}` : ''
      
      return `${month}/${day}(${weekday})${timeText}`
    } catch {
      return matchDate
    }
  }

  // 마커 업데이트 함수
  const updateMarkers = useCallback((matchesData) => {
    if (!mapInstanceRef.current) return

    try {
      // 기존 마커 제거
      markersRef.current.forEach(marker => {
        marker.setMap(null)
      })
      markersRef.current = []

      // 클러스터러가 있으면 클리어
      if (clustererRef.current) {
        clustererRef.current.clear()
      }

      if (matchesData.length === 0) return

      // 같은 위치의 매치들을 그룹화 (좌표를 반올림하여 그룹화)
      const groupedMatches = {}
      const coordinatePrecision = 0.0001 // 약 10m 정도의 오차 허용

      // 성능 최적화: for 루프 사용
      for (let i = 0; i < matchesData.length; i++) {
        const match = matchesData[i]
        if (!match.lat || !match.lng) continue

        // 좌표를 반올림하여 그룹 키 생성
        const roundedLat = Math.round(match.lat / coordinatePrecision) * coordinatePrecision
        const roundedLng = Math.round(match.lng / coordinatePrecision) * coordinatePrecision
        const key = `${roundedLat}_${roundedLng}`

        if (!groupedMatches[key]) {
          groupedMatches[key] = {
            lat: roundedLat,
            lng: roundedLng,
            matches: []
          }
        }
        groupedMatches[key].matches.push(match)
      }

      // 그룹별로 마커 생성
      const markers = Object.values(groupedMatches).map((group) => {
        const position = new window.kakao.maps.LatLng(group.lat, group.lng)
        
        // 카카오 기본 마커 사용 (image 옵션 제거)
        const marker = new window.kakao.maps.Marker({
          position: position,
        })

        // 같은 위치의 매치 리스트 HTML 생성 (지연 생성)
        const uniqueId = `match-list-${group.lat}-${group.lng}`
        
        // HTML 생성 함수 (인포윈도우가 열릴 때만 실행)
        const generateMatchesListHTML = () => {
          let html = ''
          for (let i = 0; i < group.matches.length; i++) {
            const match = group.matches[i]
            const dateTime = formatMatchDateTime(match.matchDate, match.matchTime)
            const borderBottom = i < group.matches.length - 1 ? '1px solid #e5e7eb' : 'none'
            
            html += `
              <div 
                class="match-item"
                style="padding: 12px; border-bottom: ${borderBottom}; cursor: pointer; transition: background-color 0.15s;"
                onclick="window.location.href='/matches/${match.postId}'"
              >
                <div style="font-weight: 600; margin-bottom: 6px; font-size: 14px; color: #111827; line-height: 1.4;">
                  ${(match.matchTitle || '매치').replace(/</g, '&lt;').replace(/>/g, '&gt;')}
                </div>
                <div style="display: flex; flex-direction: column; gap: 4px;">
                  ${match.headCount ? `
                    <div style="display: flex; align-items: center; gap: 6px; font-size: 12px; color: #6b7280;">
                      <span style="display: inline-block; width: 4px; height: 4px; background: #3b82f6; border-radius: 50%;"></span>
                      ${match.headCount} vs ${match.headCount}
                    </div>
                  ` : ''}
                  <div style="display: flex; align-items: center; gap: 6px; font-size: 12px; color: #6b7280;">
                    <span style="display: inline-block; width: 4px; height: 4px; background: #10b981; border-radius: 50%;"></span>
                    ${dateTime}
                  </div>
                  ${match.teamName ? `
                    <div style="display: flex; align-items: center; gap: 6px; font-size: 12px; color: #6b7280;">
                      <span style="display: inline-block; width: 4px; height: 4px; background: #f59e0b; border-radius: 50%;"></span>
                      ${(match.teamName || '').replace(/</g, '&lt;').replace(/>/g, '&gt;')}
                    </div>
                  ` : ''}
                  ${match.teamLevel ? `
                    <div style="display: flex; align-items: center; gap: 6px; font-size: 12px; color: #6b7280;">
                      <span style="display: inline-block; width: 4px; height: 4px; background: #8b5cf6; border-radius: 50%;"></span>
                      Level <span style="font-weight: 600; color: #111827;">${(match.teamLevel || '').replace(/</g, '&lt;').replace(/>/g, '&gt;')}</span>
                    </div>
                  ` : ''}
                </div>
              </div>
            `
          }
          return html
        }

        // 인포윈도우 생성
        const infoWindow = new window.kakao.maps.InfoWindow({
          content: `
            <div id="${uniqueId}" style="width: 320px; max-height: 450px; background: white; border-radius: 12px; box-shadow: 0 10px 25px rgba(0, 0, 0, 0.15); overflow: hidden;">
              <div style="padding: 14px 16px; background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%); color: white; font-weight: 600; font-size: 14px; display: flex; align-items: center; gap: 8px;">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
                  <circle cx="12" cy="10" r="3"></circle>
                </svg>
                ${group.matches.length}개의 매치
              </div>
              <div id="${uniqueId}-list" style="max-height: 400px; overflow-y: auto; background: white;"></div>
            </div>
          `,
          removable: false,
          disableAutoPan: false, // 카카오맵이 자동으로 지도를 이동시켜 인포윈도우가 보이도록
        })

        // 인포윈도우가 열릴 때 스타일 및 이벤트 추가
        let isInfoWindowOpen = false
        let closeTimeout = null

        // CSS 스타일 한 번만 생성 (전역)
        if (!document.getElementById('match-list-style')) {
          const globalStyle = document.createElement('style')
          globalStyle.id = 'match-list-style'
          globalStyle.textContent = `
            .match-item:hover {
              background-color: #f9fafb !important;
            }
            /* 카카오맵 인포윈도우가 지도 위에 표시되도록 */
            .info_window {
              z-index: 10000 !important;
            }
          `
          document.head.appendChild(globalStyle)
        }

        const openInfoWindow = () => {
          if (isInfoWindowOpen) return
          isInfoWindowOpen = true
          
          // 인포윈도우 열기
          infoWindow.open(mapInstanceRef.current, marker)
          
          // 콘텐츠 로드
          setTimeout(() => {
            const listElement = document.getElementById(`${uniqueId}-list`)
            if (listElement && !listElement.innerHTML) {
              listElement.innerHTML = generateMatchesListHTML()
            }
          }, 100)
          
          // 이벤트 리스너 추가
          setTimeout(() => {
            const infoElement = document.getElementById(uniqueId)
            const listElement = document.getElementById(`${uniqueId}-list`)
            
            if (infoElement && !infoElement.dataset.listenersAdded) {
              infoElement.dataset.listenersAdded = 'true'
              
              const handleMouseEnter = () => {
                if (closeTimeout) {
                  clearTimeout(closeTimeout)
                  closeTimeout = null
                }
              }

              const handleMouseLeave = () => {
                closeTimeout = setTimeout(() => {
                  if (isInfoWindowOpen) {
                    infoWindow.close()
                    isInfoWindowOpen = false
                    if (infoElement) {
                      infoElement.dataset.listenersAdded = 'false'
                    }
                  }
                }, 150)
              }

              infoElement.addEventListener('mouseenter', handleMouseEnter)
              infoElement.addEventListener('mouseleave', handleMouseLeave)
              
              if (listElement) {
                listElement.addEventListener('mouseenter', handleMouseEnter)
                listElement.addEventListener('mouseleave', handleMouseLeave)
              }
            }
          }, 150)
        }

        const closeInfoWindow = () => {
          if (closeTimeout) {
            clearTimeout(closeTimeout)
            closeTimeout = null
          }
          closeTimeout = setTimeout(() => {
            if (isInfoWindowOpen) {
              infoWindow.close()
              isInfoWindowOpen = false
            }
          }, 150)
        }

        // 마커 클릭 이벤트 (단일 매치인 경우)
        if (group.matches.length === 1) {
          window.kakao.maps.event.addListener(marker, 'click', () => {
            navigate(`/matches/${group.matches[0].postId}`)
          })
        }

        // 마커 마우스오버 이벤트
        window.kakao.maps.event.addListener(marker, 'mouseover', () => {
          openInfoWindow()
        })

        window.kakao.maps.event.addListener(marker, 'mouseout', () => {
          closeInfoWindow()
        })

        return marker
      })

      markersRef.current = markers

      // 클러스터러가 있으면 사용, 없으면 직접 마커 추가
      if (clustererRef.current) {
        clustererRef.current.addMarkers(markers)
      } else {
        markers.forEach(marker => marker.setMap(mapInstanceRef.current))
      }
    } catch (error) {
      console.error('마커 업데이트 중 오류 발생:', error)
    }
  }, [navigate])

  // 매치 데이터 조회
  const fetchMatches = useCallback(async (filtersToUse = null) => {
    if (!currentBounds) return

    setIsLoading(true)
    setError(null)

    try {
      // 파라미터로 전달된 필터가 있으면 사용, 없으면 appliedFilters 사용
      const filters = filtersToUse !== null ? filtersToUse : appliedFilters

      const params = {
        swLat: currentBounds.swLat,
        swLng: currentBounds.swLng,
        neLat: currentBounds.neLat,
        neLng: currentBounds.neLng,
      }

      // 필터 파라미터 추가
      if (filters.startDate) {
        params.startDate = filters.startDate
      }
      if (filters.endDate) {
        params.endDate = filters.endDate
      }
      if (filters.region) {
        params.region = filters.region
      }
      if (filters.headCount) {
        params.headCount = parseInt(filters.headCount, 10)
      }

      const res = await api.get('/v1/matches/map', { params })
      const matchesData = res.data?.data || []

      setMatches(matchesData)
      updateMarkers(matchesData)
    } catch (e) {
      const errorMessage = e.response?.data?.message || e.message || '매치 목록을 불러오는데 실패했습니다.'
      setError(errorMessage)
      console.error('매치 조회 오류:', e)
    } finally {
      setIsLoading(false)
      setShowSearchButton(false)
    }
  }, [currentBounds, appliedFilters, updateMarkers])


  const handleFilterChange = (name, value) => {
    setTempFilters(prev => ({
      ...prev,
      [name]: value,
    }))
  }

  const applyFilters = () => {
    setAppliedFilters(tempFilters)
    if (currentBounds) {
      // tempFilters를 직접 전달하여 즉시 적용
      fetchMatches(tempFilters)
    }
  }

  const resetFilters = () => {
    const emptyFilters = {
      startDate: '',
      endDate: '',
      region: '',
      headCount: '',
    }
    setTempFilters(emptyFilters)
    setAppliedFilters(emptyFilters)
    if (currentBounds) {
      // 빈 필터를 직접 전달하여 즉시 적용
      fetchMatches(emptyFilters)
    }
  }

  const handleSearchClick = () => {
    fetchMatches()
  }

  return (
    <section className="py-10 sm:py-14">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div className="grid gap-2">
          <h2 className="text-3xl font-semibold text-ink">지도로 매치 찾기</h2>
          <p className="text-mute">지도를 이동하여 원하는 지역의 매치를 찾아보세요.</p>
        </div>
        <div className="flex gap-2">
          <Button 
            onClick={() => navigate('/matches')} 
            variant="ghost" 
            className="w-full sm:w-auto"
          >
            목록 보기
          </Button>
          <Button 
            onClick={() => navigate('/matches/create')} 
            className="w-full sm:w-auto"
          >
            매치 등록하기
          </Button>
        </div>
      </div>

      {/* 필터 섹션 */}
      <div className="rounded-2xl border border-gray-100 bg-white/80 shadow-card p-6 mb-6">
        <div className="grid gap-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-ink">필터</h3>
            <button
              onClick={resetFilters}
              className="text-sm text-mute hover:text-ink transition-colors"
            >
              초기화
            </button>
          </div>
          
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <label className="grid gap-1">
              <span className="text-sm text-mute">시작 날짜</span>
              <input
                type="date"
                value={tempFilters.startDate}
                onChange={(e) => handleFilterChange('startDate', e.target.value)}
                className="border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-200 text-sm"
              />
            </label>
            
            <label className="grid gap-1">
              <span className="text-sm text-mute">종료 날짜</span>
              <input
                type="date"
                value={tempFilters.endDate}
                onChange={(e) => handleFilterChange('endDate', e.target.value)}
                min={tempFilters.startDate || undefined}
                className="border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-200 text-sm"
              />
            </label>
            
            <label className="grid gap-1">
              <span className="text-sm text-mute">지역</span>
              <select
                value={tempFilters.region}
                onChange={(e) => handleFilterChange('region', e.target.value)}
                className="border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-200 text-sm"
              >
                {regions.map((region) => (
                  <option key={region.value} value={region.value}>
                    {region.label}
                  </option>
                ))}
              </select>
            </label>
            
            <label className="grid gap-1">
              <span className="text-sm text-mute">경기 인원</span>
              <select
                value={tempFilters.headCount}
                onChange={(e) => handleFilterChange('headCount', e.target.value)}
                className="border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-200 text-sm"
              >
                <option value="">전체</option>
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
          </div>
          
          <div className="flex justify-end pt-2">
            <Button onClick={applyFilters} className="px-6">
              적용
            </Button>
          </div>
        </div>
      </div>

      {/* 지도 영역 */}
      <div className="relative rounded-2xl border border-gray-100 bg-white shadow-card" style={{ overflow: 'visible' }}>
        {!isMapLoaded && (
          <div className="w-full h-[600px] flex items-center justify-center bg-gray-50">
            <p className="text-mute">지도를 불러오는 중...</p>
          </div>
        )}
        <div
          ref={mapRef}
          className={`w-full h-[600px] ${!isMapLoaded ? 'hidden' : ''}`}
          style={{ overflow: 'visible' }}
        />
        
        {/* 검색 버튼 */}
        {showSearchButton && !isLoading && (
          <div className="absolute top-4 left-1/2 transform -translate-x-1/2 z-10">
            <Button
              onClick={handleSearchClick}
              className="px-6 py-3 shadow-lg"
            >
              현재 지도에서 검색하기
            </Button>
          </div>
        )}

        {/* 로딩 오버레이 */}
        {isLoading && (
          <div className="absolute inset-0 bg-white/80 flex items-center justify-center z-10">
            <div className="flex flex-col items-center gap-2">
              <div className="w-8 h-8 border-2 border-gray-300 border-t-primary-500 rounded-full animate-spin"></div>
              <p className="text-mute text-sm">매치를 불러오는 중...</p>
            </div>
          </div>
        )}

        {/* 에러 메시지 */}
        {error && (
          <div className="absolute top-4 right-4 bg-red-50 border border-red-200 text-red-600 px-4 py-2 rounded-lg text-sm z-10">
            {error}
          </div>
        )}
      </div>

      {/* 매치 개수 표시 */}
      {matches.length > 0 && (
        <div className="mt-4 text-center text-sm text-mute">
          현재 지도에서 <span className="font-semibold text-ink">{matches.length}개</span>의 매치를 찾았습니다.
        </div>
      )}
    </section>
  )
}

export default MatchesMapPage

