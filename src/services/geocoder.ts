import NodeGeocoder from 'node-geocoder';

// In-memory cache for geocoding results to avoid duplicate requests
const geocodingCache = new Map<string, GeocoderResult | null>();

// Rate limiting: Track last request time to ensure max 1 request per second
let lastRequestTime = 0;
const MIN_REQUEST_INTERVAL = 1000; // 1 second in milliseconds

// OSM Nominatim API configuration
const NOMINATIM_BASE_URL = 'https://nominatim.openstreetmap.org';
const USER_AGENT = 'SIH-Backend/1.0 (Smart India Hackathon Project; https://github.com/SagnikGos/sih-backend; sagnik.gos@gmail.com)';

// Configure the geocoder with proper OSM compliance
const options = {
  provider: 'openstreetmap' as const,
  userAgent: USER_AGENT,
  // Add timeout to prevent hanging requests
  timeout: 10000, // 10 seconds
  // Force HTTP adapter to ensure headers are properly set
  httpAdapter: 'fetch',
  extra: {
    // Additional options for OSM compliance
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

/**
 * Rate limiting function to ensure max 1 request per second to OSM Nominatim API
 */
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

/**
 * Creates a cache key for coordinates
 */
function createCacheKey(lat: number, lng: number): string {
  // Round to 4 decimal places to group nearby coordinates
  const roundedLat = Math.round(lat * 10000) / 10000;
  const roundedLng = Math.round(lng * 10000) / 10000;
  return `${roundedLat},${roundedLng}`;
}

/**
 * Direct HTTP request to OSM Nominatim API as fallback
 * This ensures proper User-Agent headers are sent
 */
async function directNominatimRequest(lat: number, lng: number): Promise<any> {
  const url = `${NOMINATIM_BASE_URL}/reverse?format=json&lat=${lat}&lon=${lng}&addressdetails=1`;
  
  const response = await fetch(url, {
    method: 'GET',
    headers: {
      'User-Agent': USER_AGENT,
      'Accept': 'application/json',
    },
    // Add timeout
    signal: AbortSignal.timeout(10000)
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`HTTP ${response.status}: ${errorText}`);
  }

  const data = await response.json();
  return data;
}

/**
 * Performs reverse geocoding to get place name from coordinates
 * Implements caching and rate limiting for OSM Nominatim API compliance
 * @param lat - Latitude
 * @param lng - Longitude
 * @returns Promise<GeocoderResult | null>
 */
export async function reverseGeocode(lat: number, lng: number): Promise<GeocoderResult | null> {
  // Check cache first to avoid duplicate requests
  const cacheKey = createCacheKey(lat, lng);
  if (geocodingCache.has(cacheKey)) {
    console.log('📋 Using cached geocoding result for coordinates:', lat, lng);
    return geocodingCache.get(cacheKey) || null;
  }

  try {
    // Enforce rate limiting before making the request
    await enforceRateLimit();
    
    console.log('🌍 Making geocoding request to OSM Nominatim API for coordinates:', lat, lng);
    
    let result;
    try {
      // Try node-geocoder first
      const res = await geocoder.reverse({ lat, lon: lng });
      result = res && res.length > 0 ? res[0] : null;
    } catch (geocoderError) {
      console.log('⚠️ node-geocoder failed, trying direct HTTP request...');
      // Fallback to direct HTTP request
      const directResult = await directNominatimRequest(lat, lng);
      result = directResult;
    }
    
    if (!result) {
      console.log('No results found for the given coordinates.');
      geocodingCache.set(cacheKey, null);
      return null;
    }
    
    // Extract place name from the result
    let placeName = '';
    
    // Try to build a meaningful place name from available fields
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
      // Direct API response format
      placeName = result.display_name;
    } else {
      placeName = `${lat}, ${lng}`; // Fallback to coordinates
    }
    
    const geocoderResult = {
      placeName,
      formattedAddress: result.formattedAddress || result.display_name || undefined,
      city: result.city || undefined,
      state: result.state || undefined,
      country: result.country || undefined
    };
    
    // Cache the result
    geocodingCache.set(cacheKey, geocoderResult);
    console.log('✅ Geocoding successful, result cached');
    
    return geocoderResult;
  } catch (err) {
    console.error('An error occurred during reverse geocoding:', err);
    
    // Check if it's a rate limit error
    if (err instanceof Error && (err.message.includes('429') || err.message.includes('403'))) {
      console.error('🚫 Rate limit exceeded or access blocked! Please wait before making more requests.');
      // Wait longer before retrying
      await new Promise(resolve => setTimeout(resolve, 5000));
    }
    
    // Cache the error result to avoid repeated failures
    geocodingCache.set(cacheKey, null);
    return null;
  }
}

/**
 * Returns the required OpenStreetMap attribution information
 * This should be displayed in your application UI
 */
export function getOSMAttribution(): string {
  return "© OpenStreetMap contributors";
}

/**
 * Returns detailed attribution information for display
 */
export function getDetailedAttribution(): string {
  return "Geocoding data © OpenStreetMap contributors, licensed under ODbL";
}

/**
 * Clears the geocoding cache
 * Useful for testing or if you need to reset cached results
 */
export function clearGeocodingCache(): void {
  geocodingCache.clear();
  console.log('🗑️ Geocoding cache cleared');
}

/**
 * Gets cache statistics
 */
export function getCacheStats(): { size: number; keys: string[] } {
  return {
    size: geocodingCache.size,
    keys: Array.from(geocodingCache.keys())
  };
}

export default geocoder;
