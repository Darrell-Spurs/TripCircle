import axios from 'axios';

const API_KEY = process.env.GOOGLE_MAPS_API_KEY;

interface LatLng {
  lat: number;
  lng: number;
}

interface GeocodeResponse {
  lat: number;
  lng: number;
  formattedAddress: string;
}

interface Place {
  placeId: string;
  name: string;
  address: string;
  lat: number;
  lng: number;
  phone?: string;
  website?: string;
  rating?: number;
  photoUrl?: string;
}

interface PlaceDetails {
  placeId: string;
  name: string;
  address: string;
  lat: number;
  lng: number;
  phone?: string;
  website?: string;
  rating?: number;
  photos?: string[];
  openingHours?: string[];
}

export class GoogleMapsService {
  /**
   * 將地址轉換為經緯度座標
   */
  static async geocodeAddress(address: string): Promise<GeocodeResponse | null> {
    if (!API_KEY) {
      console.warn('Google Maps API key not configured');
      return null;
    }

    try {
      this.apiCallCount++;
      const response = await axios.get('https://maps.googleapis.com/maps/api/geocode/json', {
        params: {
          address,
          key: API_KEY,
          region: 'tw', // Taiwan
          language: 'zh-TW',
        },
      });

      if (response.data.status === 'OK' && response.data.results.length > 0) {
        const result = response.data.results[0];
        const location = result.geometry.location;

        return {
          lat: location.lat,
          lng: location.lng,
          formattedAddress: result.formatted_address,
        };
      }

      console.warn(`Geocoding failed for address: ${address}`, response.data.status);
      return null;
    } catch (error) {
      console.error('Geocoding error:', error);
      return null;
    }
  }

  /**
   * 搜尋餐廳（使用 Places API Text Search）
   */
  static async searchPlaces(query: string, location?: LatLng): Promise<Place[]> {
    if (!API_KEY) {
      console.warn('Google Maps API key not configured');
      return [];
    }

    try {
      this.apiCallCount++;
      const params: any = {
        query: `餐廳 ${query}`,
        key: API_KEY,
        language: 'zh-TW',
        type: 'restaurant',
      };

      // 如果有指定位置，加入 locationbias
      if (location) {
        params.location = `${location.lat},${location.lng}`;
        params.radius = 10000; // 10km
      }

      const response = await axios.get('https://maps.googleapis.com/maps/api/place/textsearch/json', {
        params,
      });

      if (response.data.status === 'OK') {
        return response.data.results.map((place: any) => ({
          placeId: place.place_id,
          name: place.name,
          address: place.formatted_address,
          lat: place.geometry.location.lat,
          lng: place.geometry.location.lng,
          rating: place.rating,
          phone: place.formatted_phone_number,
          photoUrl: place.photos?.[0] 
            ? `https://maps.googleapis.com/maps/api/place/photo?maxwidth=400&photoreference=${place.photos[0].photo_reference}&key=${API_KEY}`
            : undefined,
        }));
      }

      console.warn(`Places search failed`, response.data.status);
      return [];
    } catch (error) {
      console.error('Places search error:', error);
      return [];
    }
  }

  /**
   * 取得餐廳詳細資訊
   */
  static async getPlaceDetails(placeId: string): Promise<PlaceDetails | null> {
    if (!API_KEY) {
      console.warn('Google Maps API key not configured');
      return null;
    }

    try {
      this.apiCallCount++;
      const response = await axios.get('https://maps.googleapis.com/maps/api/place/details/json', {
        params: {
          place_id: placeId,
          key: API_KEY,
          language: 'zh-TW',
          fields: 'place_id,name,formatted_address,geometry,formatted_phone_number,website,rating,photos,opening_hours',
        },
      });

      if (response.data.status === 'OK' && response.data.result) {
        const result = response.data.result;
        const location = result.geometry.location;

        return {
          placeId: result.place_id,
          name: result.name,
          address: result.formatted_address,
          lat: location.lat,
          lng: location.lng,
          phone: result.formatted_phone_number,
          website: result.website,
          rating: result.rating,
          photos: result.photos?.slice(0, 5).map((photo: any) =>
            `https://maps.googleapis.com/maps/api/place/photo?maxwidth=800&photoreference=${photo.photo_reference}&key=${API_KEY}`
          ),
          openingHours: result.opening_hours?.weekday_text,
        };
      }

      console.warn(`Place details failed for place_id: ${placeId}`, response.data.status);
      return null;
    } catch (error) {
      console.error('Place details error:', error);
      return null;
    }
  }

  /**
   * 監控 API 呼叫次數（效能監控）
   */
  private static apiCallCount = 0;

  static getApiCallCount(): number {
    return this.apiCallCount;
  }

  static resetApiCallCount(): void {
    this.apiCallCount = 0;
  }
}
