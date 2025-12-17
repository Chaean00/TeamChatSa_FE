import { useEffect, useRef, useState } from 'react'

function KakaoMap({ onLocationSelect, initialLat, initialLng, initialAddress, initialPlaceName, readOnly = false }) {
  const mapRef = useRef(null)
  const mapInstanceRef = useRef(null)
  const markerRef = useRef(null)
  const geocoderRef = useRef(null)
  const [searchKeyword, setSearchKeyword] = useState('')
  const [searchResults, setSearchResults] = useState([])
  const [isSearching, setIsSearching] = useState(false)
  const [isMapLoaded, setIsMapLoaded] = useState(false)

  // 카카오맵 스크립트 동적 로드
  useEffect(() => {
    const apiKey = import.meta.env.VITE_KAKAO_MAP_API_KEY
    
    if (!apiKey) {
      console.error('카카오맵 API 키가 설정되지 않았습니다. .env 파일에 VITE_KAKAO_MAP_API_KEY를 추가해주세요.')
      return
    }

    // 이미 로드되어 있으면 스킵
    if (window.kakao && window.kakao.maps) {
      setIsMapLoaded(true)
      return
    }

    const script = document.createElement('script')
    script.src = `//dapi.kakao.com/v2/maps/sdk.js?appkey=${apiKey}&libraries=services&autoload=false`
    script.async = true
    
    script.onload = () => {
      window.kakao.maps.load(() => {
        setIsMapLoaded(true)
      })
    }

    document.head.appendChild(script)

    return () => {
      // 컴포넌트 언마운트 시 스크립트 제거하지 않음 (다른 컴포넌트에서도 사용 가능)
    }
  }, [])

  useEffect(() => {
    if (!isMapLoaded || !window.kakao || !window.kakao.maps) {
      return
    }

    const container = mapRef.current
    if (!container) return

    // 초기 위치 설정 (서울시청)
    const defaultLat = initialLat || 37.5665
    const defaultLng = initialLng || 126.9780

    const options = {
      center: new window.kakao.maps.LatLng(defaultLat, defaultLng),
      level: 3
    }

    const map = new window.kakao.maps.Map(container, options)
    mapInstanceRef.current = map

    // 마커 생성
    const marker = new window.kakao.maps.Marker({
      position: map.getCenter()
    })
    marker.setMap(map)
    markerRef.current = marker

    // Geocoder 초기화
    geocoderRef.current = new window.kakao.maps.services.Geocoder()

    // 지도 클릭 이벤트 (readOnly가 아닐 때만)
    if (!readOnly) {
      window.kakao.maps.event.addListener(map, 'click', (mouseEvent) => {
        const latlng = mouseEvent.latLng
        marker.setPosition(latlng)
        
        // 좌표를 주소로 변환
        geocoderRef.current.coord2Address(latlng.getLng(), latlng.getLat(), (result, status) => {
          if (status === window.kakao.maps.services.Status.OK) {
            const address = result[0].address.address_name
            const placeName = result[0].road_address?.building_name || address || ''
            
            if (onLocationSelect) {
              onLocationSelect({
                lat: latlng.getLat(),
                lng: latlng.getLng(),
                address: address,
                placeName: placeName
              })
            }
          }
        })
      })
    }

      // 초기 위치가 있으면 설정
      if (initialLat && initialLng) {
        const position = new window.kakao.maps.LatLng(initialLat, initialLng)
        map.setCenter(position)
        marker.setPosition(position)
      }
    }, [isMapLoaded, initialLat, initialLng, onLocationSelect])

  const handleSearch = () => {
    if (!searchKeyword.trim()) return

    if (!isMapLoaded || !window.kakao || !window.kakao.maps) {
      alert('카카오맵 API가 로드되지 않았습니다.')
      return
    }

    setIsSearching(true)
    const places = new window.kakao.maps.services.Places()

    places.keywordSearch(searchKeyword, (data, status) => {
      setIsSearching(false)
      
      if (status === window.kakao.maps.services.Status.OK) {
        setSearchResults(data)
      } else if (status === window.kakao.maps.services.Status.ZERO_RESULT) {
        setSearchResults([])
        alert('검색 결과가 없습니다.')
      } else {
        alert('검색 중 오류가 발생했습니다.')
      }
    })
  }

  const handleSelectPlace = (place) => {
    const position = new window.kakao.maps.LatLng(place.y, place.x)
    
    if (mapInstanceRef.current) {
      mapInstanceRef.current.setCenter(position)
    }
    
    if (markerRef.current) {
      markerRef.current.setPosition(position)
    }

    if (onLocationSelect) {
      const address = place.address_name || place.road_address_name || ''
      const placeName = place.place_name || address || ''
      
      onLocationSelect({
        lat: parseFloat(place.y),
        lng: parseFloat(place.x),
        address: address,
        placeName: placeName
      })
    }

    setSearchResults([])
    setSearchKeyword('')
  }

  return (
    <div className="grid gap-4">
      {!readOnly && (
        <div className="grid gap-2">
          <label className="grid gap-1">
            <span className="text-sm text-mute">장소 검색</span>
            <div className="flex gap-2">
              <input
                type="text"
                value={searchKeyword}
                onChange={(e) => setSearchKeyword(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                placeholder="장소명 또는 주소를 입력하세요"
                className="flex-1 border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-200"
              />
              <button
                type="button"
                onClick={handleSearch}
                disabled={isSearching}
                className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50"
              >
                {isSearching ? '검색 중...' : '검색'}
              </button>
            </div>
          </label>

          {searchResults.length > 0 && (
            <div className="border border-gray-200 rounded-lg max-h-48 overflow-y-auto">
              {searchResults.map((place, index) => (
                <div
                  key={index}
                  onClick={() => handleSelectPlace(place)}
                  className="p-3 border-b border-gray-100 last:border-b-0 cursor-pointer hover:bg-gray-50"
                >
                  <div className="font-medium text-sm text-ink">{place.place_name}</div>
                  <div className="text-xs text-mute mt-1">
                    {place.road_address_name || place.address_name}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      <div className="relative">
        {!isMapLoaded && (
          <div className="w-full h-96 rounded-lg border border-gray-200 flex items-center justify-center bg-gray-50">
            <p className="text-mute">지도를 불러오는 중...</p>
          </div>
        )}
        <div
          ref={mapRef}
          className={`w-full h-96 rounded-lg border border-gray-200 ${!isMapLoaded ? 'hidden' : ''}`}
        />
        {isMapLoaded && !readOnly && (
          <div className="absolute top-2 right-2 bg-white px-2 py-1 rounded text-xs text-mute shadow">
            지도를 클릭하거나 검색하여 장소를 선택하세요
          </div>
        )}
      </div>
    </div>
  )
}

export default KakaoMap

