# OpenStreetMap Nominatim API Compliance

This document outlines how our backend service complies with the OpenStreetMap (OSM) Nominatim API usage rules.

## ✅ Compliance Features Implemented

### 1. Rate Limiting
- **Maximum 1 request per second**: Implemented automatic rate limiting in `src/services/geocoder.ts`
- **Automatic waiting**: If requests are made too quickly, the system automatically waits to maintain compliance
- **Global rate limiting**: Applied across the entire application, not per user

### 2. Proper Identification
- **Custom User-Agent**: Set to `SIH-Backend/1.0 (Smart India Hackathon Project; https://github.com/SagnikGos/sih-backend; sagnik.gos@gmail.com)`
- **Clear application identification**: Includes project name, repository URL, and contact email

### 3. Caching
- **In-memory caching**: Results are cached to avoid duplicate requests for the same coordinates
- **Coordinate rounding**: Nearby coordinates (within ~11m) are grouped to reduce API calls
- **Cache persistence**: Cached results persist for the duration of the application session

### 4. Attribution
- **Required attribution**: All API responses include `© OpenStreetMap contributors`
- **Automatic inclusion**: Attribution is automatically added to all geocoding-related responses
- **ODbL compliance**: Data usage acknowledges the Open Database License

### 5. Error Handling
- **Rate limit detection**: Automatically detects 429 (Too Many Requests) errors
- **Graceful degradation**: Falls back to coordinates if geocoding fails
- **Extended wait times**: Implements longer wait times after rate limit violations

## 🚫 Prohibited Uses Avoided

- **No auto-complete**: Geocoding is only used for reverse geocoding of specific coordinates
- **No systematic queries**: Only individual coordinate lookups, no bulk data downloading
- **No scraping**: Only using the reverse geocoding endpoint as intended

## 📊 Usage Patterns

### When Geocoding Occurs
- Only when creating new issues with geotag coordinates
- Only for reverse geocoding (coordinates → place name)
- Cached results prevent duplicate requests

### Rate Limiting Behavior
```
Request 1: Immediate (first request)
Request 2: Waits 1 second after Request 1
Request 3: Waits 1 second after Request 2
...and so on
```

### Caching Behavior
```
Coordinates (40.7128, -74.0060) → Cached
Coordinates (40.7129, -74.0061) → Uses cache (nearby coordinates)
Coordinates (40.8000, -74.1000) → New API request
```

## 🔧 Technical Implementation

### Files Modified
- `src/services/geocoder.ts`: Core geocoding service with rate limiting and caching
- `src/routes/issues.ts`: API responses include OSM attribution

### Key Functions
- `enforceRateLimit()`: Ensures 1 request per second maximum
- `createCacheKey()`: Groups nearby coordinates for efficient caching
- `directNominatimRequest()`: Direct HTTP fallback with proper headers
- `getOSMAttribution()`: Returns required attribution text
- `getDetailedAttribution()`: Returns detailed attribution information
- `clearGeocodingCache()`: Clears the geocoding cache
- `getCacheStats()`: Returns cache statistics
- `reverseGeocode()`: Main geocoding function with compliance features

## 📝 API Response Format

All geocoding-related API responses now include attribution:

```json
{
  "issues": [...],
  "attribution": "© OpenStreetMap contributors"
}
```

## ⚠️ Important Notes

1. **Single Machine**: This implementation is designed for single-machine deployment
2. **Memory Cache**: Cache is in-memory and will reset on application restart
3. **Production Considerations**: For high-traffic production use, consider:
   - Persistent caching (Redis, database)
   - Load balancing with shared rate limiting
   - Paid geocoding services for commercial use

## 🚀 Usage Example

```typescript
import { 
  reverseGeocode, 
  getOSMAttribution, 
  getDetailedAttribution,
  clearGeocodingCache,
  getCacheStats 
} from './services/geocoder.js';

// This will automatically handle rate limiting and caching
const result = await reverseGeocode(40.7128, -74.0060);
console.log(result.placeName); // "New York, NY"

// Get attribution for display
console.log(getOSMAttribution()); // "© OpenStreetMap contributors"
console.log(getDetailedAttribution()); // "Geocoding data © OpenStreetMap contributors, licensed under ODbL"

// Cache management
const stats = getCacheStats();
console.log(`Cache has ${stats.size} entries`);

// Clear cache if needed
clearGeocodingCache();
```

## 🧪 Testing

### Test Scripts
- `test_geocoding.js`: Tests the main geocoding functionality
- `test_direct_http.js`: Tests direct HTTP requests to verify User-Agent headers

### Running Tests
```bash
# Build the project first
npm run build

# Test the geocoding service
node test_geocoding.js

# Test direct HTTP requests
node test_direct_http.js
```

## 🔧 Troubleshooting

### If you still get 403 Forbidden errors:

1. **Check User-Agent**: The direct HTTP fallback ensures proper headers
2. **Verify Rate Limiting**: Ensure you're not making requests too quickly
3. **Clear Cache**: Use `clearGeocodingCache()` to reset cached results
4. **Check IP Blocking**: Your IP might be temporarily blocked from previous violations

### Debug Steps:
```typescript
// Check cache stats
console.log(getCacheStats());

// Clear cache and try again
clearGeocodingCache();

// Test with a single coordinate
const result = await reverseGeocode(40.7128, -74.0060);
```

This implementation ensures full compliance with OSM Nominatim API rules while providing efficient geocoding services for your application.
