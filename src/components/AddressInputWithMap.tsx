import React, { useState, useEffect, useRef } from 'react';
import { APIProvider, Map, AdvancedMarker, Pin, useMapsLibrary } from '@vis.gl/react-google-maps';
import { MapPin, Locate } from 'lucide-react';

declare global {
  interface Window {
    gm_authFailure?: () => void;
  }
}

interface AddressInputWithMapProps {
  value: string;
  onChange: (val: string) => void;
  error?: string;
}

const API_KEY =
  process.env.GOOGLE_MAPS_PLATFORM_KEY ||
  (import.meta as any).env?.VITE_GOOGLE_MAPS_PLATFORM_KEY ||
  (globalThis as any).GOOGLE_MAPS_PLATFORM_KEY ||
  '';

const hasValidKey = Boolean(API_KEY) && API_KEY !== 'YOUR_API_KEY';

export default function AddressInputWithMap({ value, onChange, error }: AddressInputWithMapProps) {
  const [selectedLocation, setSelectedLocation] = useState<google.maps.LatLngLiteral | null>(null);
  const [mapCenter, setMapCenter] = useState<google.maps.LatLngLiteral>({ lat: 24.7136, lng: 46.6753 }); // Default: Riyadh
  const [zoom, setZoom] = useState(11);

  const [isKeyError, setIsKeyError] = useState(false);

  useEffect(() => {
    window.gm_authFailure = () => {
      setIsKeyError(true);
      setManualMode(true);
      localStorage.setItem('disableMaps', 'true');
    };

    const originalConsoleError = console.error;
    console.error = (...args) => {
      if (typeof args[0] === 'string' && args[0].includes('InvalidKeyMapError')) {
        setIsKeyError(true);
        setManualMode(true);
        localStorage.setItem('disableMaps', 'true');
        return; // Suppress it
      }
      originalConsoleError(...args);
    };

    const handleGoogleMapsError = (event: ErrorEvent) => {
      if (event.message && event.message.includes('InvalidKeyMapError')) {
        setIsKeyError(true);
        setManualMode(true);
        localStorage.setItem('disableMaps', 'true');
      }
    };
    window.addEventListener('error', handleGoogleMapsError);
    return () => {
      window.removeEventListener('error', handleGoogleMapsError);
      console.error = originalConsoleError;
      delete window.gm_authFailure;
    };
  }, []);

  const [manualMode, setManualMode] = useState(() => {
    return localStorage.getItem('disableMaps') === 'true' || !hasValidKey;
  });

  const disableMaps = () => {
    localStorage.setItem('disableMaps', 'true');
    setManualMode(true);
  };

  const handleManualUseCurrentLocation = () => {
    if (!navigator.geolocation) {
      alert("El dispositivo no admite geolocalización");
      return;
    }
    
    onChange("Obteniendo ubicación...");
    
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        try {
          const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&accept-language=es`);
          const data = await res.json();
          if (data && data.display_name) {
            onChange(data.display_name);
          } else {
            onChange(`${latitude}, ${longitude}`);
          }
        } catch (err) {
          console.error("Geocoding error:", err);
          onChange(`${latitude}, ${longitude}`);
        }
      },
      (err) => {
        console.error(err);
        onChange("");
        alert("Error al obtener la ubicación, por favor asegúrese de otorgar permisos de localización");
      }
    );
  };

  if (!hasValidKey || isKeyError || manualMode) {
    return (
      <div className="space-y-1.5 text-left">
        <label className="block text-xs font-bold text-neutral-700">Dirección de Envío y Ciudad *</label>
        <div className="relative">
          <input 
            type="text" 
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder="Ej: Calle Mayor 123, Madrid"
            className={`w-full p-2.5 pl-16 pr-3 bg-neutral-50 border ${error ? 'border-red-500 ring-1 ring-red-500' : 'border-neutral-200'} rounded-lg focus:bg-white focus:ring-2 focus:ring-primary focus:border-transparent transition-all outline-none text-left text-xs`} 
          />
          <div className="absolute left-2 top-2 flex gap-1.5 items-center">
            <button 
              type="button"
              onClick={handleManualUseCurrentLocation}
              className="p-1 bg-neutral-100 rounded text-neutral-600 hover:bg-neutral-200"
              title="Usar mi ubicación actual"
            >
              <Locate size={14} />
            </button>
            <MapPin size={16} className="text-neutral-400" />
          </div>
        </div>
        {error && <p className="text-red-500 text-[10px] mt-0.5">{error}</p>}
      </div>
    );
  }

  return (
    <APIProvider apiKey={API_KEY} version="weekly" language="es" region="ES">
      <div className="space-y-1.5 text-left">
        <label className="block text-xs font-bold text-neutral-700">Dirección de Envío y Ciudad *</label>
        
        <AutocompleteInput 
          value={value} 
          onChange={onChange} 
          error={error} 
          onSelectLocation={(loc) => {
            setSelectedLocation(loc);
            setMapCenter(loc);
            setZoom(16);
          }} 
        />
        
        <div className="relative w-full h-[140px] rounded-lg overflow-hidden border border-neutral-200 shadow-sm mt-1.5">
          <Map
            defaultCenter={mapCenter}
            center={mapCenter}
            zoom={zoom}
            onZoomChanged={(e) => setZoom(e.detail.zoom)}
            mapId="DEMO_MAP_ID"
            style={{ width: '100%', height: '100%' }}
            internalUsageAttributionIds={['gmp_mcp_codeassist_v1_aistudio']}
            gestureHandling="greedy"
            disableDefaultUI
            onClick={(e) => {
              if (e.detail?.latLng) {
                const lat = e.detail.latLng.lat;
                const lng = e.detail.latLng.lng;
                const newLoc = { lat, lng };
                setSelectedLocation(newLoc);
                setMapCenter(newLoc);
                setZoom(16);
                
                // Reverse geocode coordinates to friendly text
                const geocoder = new google.maps.Geocoder();
                geocoder.geocode({ location: newLoc }, (results, status) => {
                  if (status === 'OK' && results && results[0]) {
                    onChange(results[0].formatted_address);
                  }
                });
              }
            }}
          >
            {selectedLocation && (
              <AdvancedMarker position={selectedLocation}>
                <Pin background="#e11d48" glyphColor="#fff" borderColor="#be123c" />
              </AdvancedMarker>
            )}
          </Map>
          
          <div className="absolute bottom-2 left-2 bg-neutral-900/80 backdrop-blur-xs text-[10px] text-white px-2.5 py-1 rounded-md [direction:ltr]">
            Haga clic en el mapa para ajustar la ubicación con precisión
          </div>
        </div>
      </div>
    </APIProvider>
  );
}

interface AutocompleteInputProps {
  value: string;
  onChange: (val: string) => void;
  error?: string;
  onSelectLocation: (loc: google.maps.LatLngLiteral) => void;
}

function AutocompleteInput({ value, onChange, error, onSelectLocation }: AutocompleteInputProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const places = useMapsLibrary('places');
  const [autocomplete, setAutocomplete] = useState<google.maps.places.Autocomplete | null>(null);

  useEffect(() => {
    if (!places || !inputRef.current) return;

    const options = {
      fields: ['geometry', 'formatted_address', 'name']
    };

    const auto = new places.Autocomplete(inputRef.current, options);
    setAutocomplete(auto);
  }, [places]);

  useEffect(() => {
    if (!autocomplete) return;

    const listener = autocomplete.addListener('place_changed', () => {
      const place = autocomplete.getPlace();
      if (place.geometry && place.geometry.location) {
        const lat = place.geometry.location.lat();
        const lng = place.geometry.location.lng();
        onSelectLocation({ lat, lng });
        onChange(place.formatted_address || place.name || '');
      }
    });

    return () => {
      google.maps.event.removeListener(listener);
    };
  }, [autocomplete, onChange, onSelectLocation]);

  const handleUseCurrentLocation = () => {
    if (!navigator.geolocation) {
      alert("El dispositivo no admite geolocalización");
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        const latLng = { lat: latitude, lng: longitude };
        onSelectLocation(latLng);
        
        // Reverse geocode
        const geocoder = new google.maps.Geocoder();
        geocoder.geocode({ location: latLng }, (results, status) => {
          if (status === 'OK' && results && results[0]) {
            onChange(results[0].formatted_address);
          }
        });
      },
      (err) => {
        console.error(err);
        alert("Error al obtener la ubicación, por favor asegúrese de otorgar permisos de localización");
      }
    );
  };

  return (
    <div className="relative">
      <input 
        ref={inputRef}
        type="text" 
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Buscar su dirección o ciudad de entrega..."
        className={`w-full p-2.5 pl-16 pr-3 bg-neutral-50 border ${error ? 'border-red-500 ring-1 ring-red-500' : 'border-neutral-200'} rounded-lg focus:bg-white focus:ring-2 focus:ring-primary focus:border-transparent transition-all outline-none text-left text-xs`} 
      />
      <div className="absolute left-2 top-2 flex gap-1.5 items-center">
        <button 
          type="button"
          onClick={handleUseCurrentLocation}
          className="p-1 bg-neutral-100 rounded text-neutral-600 hover:bg-neutral-200"
          title="Usar mi ubicación actual"
        >
          <Locate size={14} />
        </button>
        <MapPin size={16} className="text-neutral-400" />
      </div>
      {error && <p className="text-red-500 text-[10px] mt-0.5">{error}</p>}
    </div>
  );
}
