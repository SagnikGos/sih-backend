import NodeGeocoder from 'node-geocoder';

const geocodingCache = new Map<string, GeocoderResult | null>();
let lastRequestTime = 0;
const MIN_REQUEST_INTERVAL = 1000;

const NOMINATIM_BASE_URL = 'https://nominatim.openstreetmap.org';
const USER_AGENT = 'SIH-Backend/1.0 (Smart India Hackathon Project; https://github.com/SagnikGos/sih-backend; sagnik.gos@gmail.com)';

const options = {
  provider: 'openstreetmap' as const,
  userAgent: USER_AGENT,
  timeout: 10000,
  httpAdapter: 'fetch',
  extra: {
    'User-Agent': USER_AGENT,
    'Accept': 'application/json',
  }
};

const geocoder = NodeGeocoder(options);

export interface GeocoderResult {
  placeName: string;
  formattedAddress?: string | undefined;
  city?: string | undefined;
  state?: string | undefined;
  country?: string | undefined;
}

async function enforceRateLimit(): Promise<void> {
  const now = Date.now();
  const timeSinceLastRequest = now - lastRequestTime;
  
  if (timeSinceLastRequest < MIN_REQUEST_INTERVAL) {
    const waitTime = MIN_REQUEST_INTERVAL - timeSinceLastRequest;
    console.log(`⏳ Rate limiting: Waiting ${waitTime}ms before next geocoding request`);
    await new Promise(resolve => setTimeout(resolve, waitTime));
  }
  
  lastRequestTime = Date.now();
}

function createCacheKey(lat: number, lng: number): string {
  const roundedLat = Math.round(lat * 10000) / 10000;
  const roundedLng = Math.round(lng * 10000) / 10000;
  return `${roundedLat},${roundedLng}`;
}

async function directNominatimRequest(lat: number, lng: number): Promise<any> {
  const url = `${NOMINATIM_BASE_URL}/reverse?format=json&lat=${lat}&lon=${lng}&addressdetails=1`;
  
  const response = await fetch(url, {
    method: 'GET',
    headers: {
      'User-Agent': USER_AGENT,
      'Accept': 'application/json',
    },
    signal: AbortSignal.timeout(10000)
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`HTTP ${response.status}: ${errorText}`);
  }

  const data = await response.json();
  return data;
}

export async function reverseGeocode(lat: number, lng: number): Promise<GeocoderResult | null> {
  const cacheKey = createCacheKey(lat, lng);
  if (geocodingCache.has(cacheKey)) {
    console.log('📋 Using cached geocoding result for coordinates:', lat, lng);
    return geocodingCache.get(cacheKey) || null;
  }

  try {
    await enforceRateLimit();
    console.log('🌍 Making geocoding request to OSM Nominatim API for coordinates:', lat, lng);
    
    let result;
    try {
      const res = await geocoder.reverse({ lat, lon: lng });
      result = res && res.length > 0 ? res[0] : null;
    } catch (geocoderError) {
      console.log('⚠️ node-geocoder failed, trying direct HTTP request...');
      const directResult = await directNominatimRequest(lat, lng);
      result = directResult;
    }
    
    if (!result) {
      console.log('No results found for the given coordinates.');
      geocodingCache.set(cacheKey, null);
      return null;
    }
    
    let placeName = '';
    
    if (result.city && result.state) {
      placeName = `${result.city}, ${result.state}`;
    } else if (result.city) {
      placeName = result.city;
    } else if (result.state) {
      placeName = result.state;
    } else if (result.country) {
      placeName = result.country;
    } else if (result.formattedAddress) {
      placeName = result.formattedAddress;
    } else if (result.display_name) {
      placeName = result.display_name;
    } else {
      placeName = `${lat}, ${lng}`;
    }
    
    const geocoderResult = {
      placeName,
      formattedAddress: result.formattedAddress || result.display_name || undefined,
      city: result.city || undefined,
      state: result.state || undefined,
      country: result.country || undefined
    };
    
    geocodingCache.set(cacheKey, geocoderResult);
    console.log('✅ Geocoding successful, result cached');
    
    return geocoderResult;
  } catch (err) {
    console.error('An error occurred during reverse geocoding:', err);
    
    if (err instanceof Error && (err.message.includes('429') || err.message.includes('403'))) {
      console.error('🚫 Rate limit exceeded or access blocked! Please wait before making more requests.');
      await new Promise(resolve => setTimeout(resolve, 5000));
    }
    
    geocodingCache.set(cacheKey, null);
    return null;
  }
}

export function getOSMAttribution(): string {
  return "© OpenStreetMap contributors";
}

export function getDetailedAttribution(): string {
  return "Geocoding data © OpenStreetMap contributors, licensed under ODbL";
}

export function clearGeocodingCache(): void {
  geocodingCache.clear();
  console.log('🗑️ Geocoding cache cleared');
}

export function getCacheStats(): { size: number; keys: string[] } {
  return {
    size: geocodingCache.size,
    keys: Array.from(geocodingCache.keys())
  };
}

export default geocoder;
