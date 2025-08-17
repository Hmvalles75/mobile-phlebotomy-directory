'use client'

import { useState, useEffect } from 'react'

interface ServiceArea {
  id: string
  name: string
  type: 'city' | 'region' | 'county'
  state: string
  providerCount: number
  coordinates?: {
    lat: number
    lng: number
  }
}

interface ServiceAreaMapProps {
  areas: ServiceArea[]
  center?: {
    lat: number
    lng: number
  }
  zoom?: number
  className?: string
  showProviderCount?: boolean
}

export function ServiceAreaMap({ 
  areas, 
  center = { lat: 39.8283, lng: -98.5795 }, // Geographic center of US
  zoom = 6,
  className = '',
  showProviderCount = true
}: ServiceAreaMapProps) {
  const [selectedArea, setSelectedArea] = useState<ServiceArea | null>(null)
  const [isMapLoaded, setIsMapLoaded] = useState(false)

  // For demo purposes, we'll create a simple visual map representation
  // In production, you'd integrate with Google Maps API or similar
  
  useEffect(() => {
    // Simulate map loading
    const timer = setTimeout(() => setIsMapLoaded(true), 1000)
    return () => clearTimeout(timer)
  }, [])

  return (
    <div className={`bg-white rounded-lg shadow-md overflow-hidden ${className}`}>
      <div className="p-4 border-b border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900">
          Service Area Coverage
        </h3>
        <p className="text-sm text-gray-600">
          Mobile phlebotomy services available in {areas.length} locations
        </p>
      </div>
      
      <div className="relative">
        {/* Placeholder map - replace with actual Google Maps integration */}
        <div className="h-64 bg-gradient-to-br from-blue-50 to-green-50 relative overflow-hidden">
          {!isMapLoaded ? (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center">
                <div className="text-4xl mb-2">🗺️</div>
                <p className="text-gray-600">Loading map...</p>
              </div>
            </div>
          ) : (
            <>
              {/* Simulated map background */}
              <div className="absolute inset-0 opacity-20">
                <svg 
                  viewBox="0 0 400 200" 
                  className="w-full h-full"
                  style={{ background: 'linear-gradient(45deg, #e5f3ff 25%, #f0f9ff 25%, #f0f9ff 50%, #e5f3ff 50%, #e5f3ff 75%, #f0f9ff 75%)' }}
                >
                  {/* Simulated geography patterns */}
                  <path d="M0,50 Q100,30 200,50 T400,50 L400,0 L0,0 Z" fill="#ddd6fe" opacity="0.3"/>
                  <path d="M0,150 Q150,130 300,150 T400,150 L400,200 L0,200 Z" fill="#dcfce7" opacity="0.3"/>
                </svg>
              </div>
              
              {/* Service area markers */}
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="grid grid-cols-3 gap-4 p-4">
                  {areas.slice(0, 9).map((area, index) => (
                    <button
                      key={area.id}
                      onClick={() => setSelectedArea(area)}
                      className="relative group"
                      style={{
                        transform: `translate(${(index % 3) * 20 - 20}px, ${Math.floor(index / 3) * 15 - 15}px)`
                      }}
                    >
                      {/* Service area pin */}
                      <div className={`w-6 h-6 rounded-full border-2 border-white shadow-lg transition-all group-hover:scale-110 ${
                        area.providerCount > 10 ? 'bg-green-500' :
                        area.providerCount > 5 ? 'bg-yellow-500' :
                        area.providerCount > 0 ? 'bg-blue-500' : 'bg-gray-400'
                      }`}>
                        <div className="absolute -top-1 -right-1 w-4 h-4 bg-primary-600 text-white text-xs rounded-full flex items-center justify-center">
                          {area.providerCount}
                        </div>
                      </div>
                      
                      {/* Tooltip */}
                      <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <div className="bg-gray-900 text-white text-xs rounded px-2 py-1 whitespace-nowrap">
                          {area.name}
                          {showProviderCount && (
                            <span className="block text-gray-300">
                              {area.providerCount} provider{area.providerCount !== 1 ? 's' : ''}
                            </span>
                          )}
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>
        
        {/* Legend */}
        <div className="absolute bottom-2 left-2 bg-white bg-opacity-90 rounded p-2 text-xs">
          <div className="flex flex-col space-y-1">
            <div className="flex items-center space-x-1">
              <div className="w-3 h-3 bg-green-500 rounded-full"></div>
              <span>10+ providers</span>
            </div>
            <div className="flex items-center space-x-1">
              <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
              <span>5-10 providers</span>
            </div>
            <div className="flex items-center space-x-1">
              <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
              <span>1-5 providers</span>
            </div>
            <div className="flex items-center space-x-1">
              <div className="w-3 h-3 bg-gray-400 rounded-full"></div>
              <span>No providers</span>
            </div>
          </div>
        </div>
      </div>
      
      {/* Service areas list */}
      <div className="p-4">
        <h4 className="font-medium text-gray-900 mb-3">Coverage Areas</h4>
        <div className="grid grid-cols-2 gap-2 max-h-32 overflow-y-auto">
          {areas.map(area => (
            <button
              key={area.id}
              onClick={() => setSelectedArea(area)}
              className={`text-left p-2 rounded text-sm transition-colors ${
                selectedArea?.id === area.id 
                  ? 'bg-primary-100 text-primary-800' 
                  : 'hover:bg-gray-50'
              }`}
            >
              <div className="font-medium">{area.name}</div>
              {showProviderCount && (
                <div className="text-gray-600">
                  {area.providerCount} provider{area.providerCount !== 1 ? 's' : ''}
                </div>
              )}
            </button>
          ))}
        </div>
      </div>
      
      {/* Selected area details */}
      {selectedArea && (
        <div className="border-t bg-gray-50 p-4">
          <h5 className="font-semibold text-gray-900">{selectedArea.name}</h5>
          <p className="text-sm text-gray-600 capitalize">
            {selectedArea.type} in {selectedArea.state}
          </p>
          {showProviderCount && (
            <p className="text-sm text-primary-600 font-medium">
              {selectedArea.providerCount > 0 
                ? `${selectedArea.providerCount} mobile phlebotomy provider${selectedArea.providerCount !== 1 ? 's' : ''} available`
                : 'No providers currently available'
              }
            </p>
          )}
          <button
            onClick={() => setSelectedArea(null)}
            className="mt-2 text-xs text-gray-500 hover:text-gray-700"
          >
            Close details
          </button>
        </div>
      )}
    </div>
  )
}

// Helper component for a simple coverage indicator
export function CoverageIndicator({ 
  providerCount, 
  className = '' 
}: { 
  providerCount: number
  className?: string 
}) {
  const getColor = () => {
    if (providerCount > 10) return 'bg-green-500'
    if (providerCount > 5) return 'bg-yellow-500'
    if (providerCount > 0) return 'bg-blue-500'
    return 'bg-gray-400'
  }

  const getLabel = () => {
    if (providerCount > 10) return 'Excellent Coverage'
    if (providerCount > 5) return 'Good Coverage'
    if (providerCount > 0) return 'Limited Coverage'
    return 'No Coverage'
  }

  return (
    <div className={`flex items-center space-x-2 ${className}`}>
      <div className={`w-3 h-3 rounded-full ${getColor()}`}></div>
      <span className="text-sm text-gray-600">
        {getLabel()} ({providerCount} provider{providerCount !== 1 ? 's' : ''})
      </span>
    </div>
  )
}

export default ServiceAreaMap