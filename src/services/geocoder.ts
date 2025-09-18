import NodeGeocoder from 'node-geocoder';

// Configure the geocoder
const options = {
  provider: 'openstreetmap' as const,
  userAgent: 'SIH-Backend/1.0 (sih-backend@example.com)', // Replace with your app info
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
 * Performs reverse geocoding to get place name from coordinates
 * @param lat - Latitude
 * @param lng - Longitude
 * @returns Promise<GeocoderResult | null>
 */
export async function reverseGeocode(lat: number, lng: number): Promise<GeocoderResult | null> {
  try {
    const res = await geocoder.reverse({ lat, lon: lng });
    
    if (res && res.length > 0) {
      const result = res[0];
      
      if (!result) {
        console.log('No results found for the given coordinates.');
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
      } else {
        placeName = `${lat}, ${lng}`; // Fallback to coordinates
      }
      
      return {
        placeName,
        formattedAddress: result.formattedAddress || undefined,
        city: result.city || undefined,
        state: result.state || undefined,
        country: result.country || undefined
      };
    } else {
      console.log('No results found for the given coordinates.');
      return null;
    }
  } catch (err) {
    console.error('An error occurred during reverse geocoding:', err);
    return null;
  }
}

export default geocoder;
