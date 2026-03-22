import axios from 'axios';
import { CALAMBA_BOUNDS } from '../calamba.bounds';

export interface PlaceResult {
  name: string;
  address: string;
  lat: number;
  lng: number;
  osm_id?: number;
}

/**
 * Uses Photon (OpenStreetMap based) to search for places.
 * Free and no API key required.
 * Results are biased/restricted to Calamba bounding box.
 */
export const placesApi = {
  searchPlaces: async (query: string): Promise<PlaceResult[]> => {
    if (!query || query.length < 2) return [];

    // Photon bbox format: [lonMin, latMin, lonMax, latMax]
    const bbox = `${CALAMBA_BOUNDS.lngMin},${CALAMBA_BOUNDS.latMin},${CALAMBA_BOUNDS.lngMax},${CALAMBA_BOUNDS.latMax}`;
    
    try {
      const response = await axios.get('https://photon.komoot.io/api/', {
        params: {
          q: query,
          limit: 5,
          bbox: bbox,
          // location_bias: calamba center could also be used but bbox is stronger
        },
      });

      const features = response.data.features || [];
      
      return features.map((f: any) => {
        const props = f.properties;
        const [lng, lat] = f.geometry.coordinates;
        
        // Build a readable address
        const parts = [
          props.street,
          props.district || props.suburb,
          props.city || props.town,
        ].filter(Boolean);
        
        return {
          name: props.name || props.street || 'Unnamed Place',
          address: parts.join(', ') || props.state || 'Calamba City',
          lat,
          lng,
          osm_id: props.osm_id,
        };
      });
    } catch (error) {
      console.error('Photon Search Error:', error);
      return [];
    }
  },
};
