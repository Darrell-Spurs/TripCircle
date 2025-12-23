import express, { Response } from 'express';
import axios from 'axios';
import { config } from '../config';

const router = express.Router();

router.get('/search', async (req: express.Request, res: Response) => {
  console.log('[Places Search] Handler called');
  const { keyword, location, lat, lng, language } = req.query;
  
  console.log('[Places Search] Query params:', { keyword, language });

  if (!keyword || typeof keyword !== 'string') {
    console.log('[Places Search] Missing keyword');
    res.status(400).json({ detail: 'keyword is required' });
    return;
  }

  if (!config.googlePlacesApiKey) {
    console.log('[Places Search] API key not configured');
    res.status(503).json({ detail: 'Google Places API key not configured' });
    return;
  }

  try {
    console.log('[Places Search] Starting Google API call...');
    let query = keyword;
    let searchLat: number | undefined = lat ? parseFloat(lat as string) : undefined;
    let searchLng: number | undefined = lng ? parseFloat(lng as string) : undefined;

    // If location string is provided but no coordinates, geocode it first
    if (location && typeof location === 'string' && location.trim() !== '') {
      // Check if location is already in keyword to avoid duplication
      const locationLower = location.toLowerCase();
      const keywordLower = keyword.toLowerCase();
      
      if (!keywordLower.includes(locationLower)) {
        query += ` in ${location}`;
      }

      // If no coordinates provided, geocode the location string
      if (!searchLat || !searchLng) {
        try {
          // Add region bias for Taiwan if location contains Taiwan-related terms
          const geocodeParams: any = {
            address: location,
            key: config.googlePlacesApiKey,
          };
          
          // Add region bias for Taiwan to improve accuracy
          const locationLower = location.toLowerCase();
          if (locationLower.includes('台灣') || 
              locationLower.includes('taiwan') || locationLower.includes('tw') ||
              locationLower.includes('台北') || locationLower.includes('新北') ||
              locationLower.includes('桃園') ||
              locationLower.includes('台中') || locationLower.includes('台南') ||
              locationLower.includes('高雄') || locationLower.includes('新竹') ||
              locationLower.includes('基隆') || locationLower.includes('嘉義') ||
              locationLower.includes('宜蘭') ||
              locationLower.includes('花蓮') ||
              locationLower.includes('台東') ||
              locationLower.includes('屏東') ||
              locationLower.includes('苗栗') ||
              locationLower.includes('彰化') || locationLower.includes('南投') ||
              locationLower.includes('雲林') ||
              locationLower.includes('澎湖') || locationLower.includes('金門') ||
              locationLower.includes('連江')) {
            geocodeParams.region = 'tw'; // Taiwan region code
          }
          
          const geocodeResponse = await axios.get('https://maps.googleapis.com/maps/api/geocode/json', {
            params: geocodeParams,
          });

          if (geocodeResponse.data.status === 'OK' && geocodeResponse.data.results.length > 0) {
            // Try to find the most specific result (prefer city-level results)
            let bestResult = geocodeResponse.data.results[0];
            
            // Look for a result with more specific address components
            for (const result of geocodeResponse.data.results) {
              const components = result.address_components || [];
              // Prefer results that have locality or administrative_area_level_1
              const hasLocality = components.some((c: any) => 
                c.types.includes('locality') || c.types.includes('administrative_area_level_1')
              );
              if (hasLocality) {
                bestResult = result;
                break;
              }
            }
            
            const locationData = bestResult.geometry.location;
            searchLat = locationData.lat;
            searchLng = locationData.lng;
            console.log(`[Places Search] Geocoded "${location}" to coordinates: ${searchLat}, ${searchLng}`);
            console.log(`[Places Search] Geocoded address: ${bestResult.formatted_address}`);
          }
        } catch (geocodeError) {
          console.warn(`[Places Search] Failed to geocode location "${location}":`, geocodeError);
          // Continue without coordinates - will rely on query string only
        }
      }
    }

    const params: any = {
      query,
      key: config.googlePlacesApiKey,
      // Remove type restriction to allow all place types (restaurants, hotels, lodgings, etc.)
      // This allows finding restaurants, hotels, B&Bs, and other accommodations
    };

    // Add language parameter if provided (zh-TW for Traditional Chinese, en for English)
    if (language && typeof language === 'string') {
      params.language = language;
    }

    // Use coordinates for location biasing (overrides IP-based biasing)
    if (searchLat && searchLng) {
      params.location = `${searchLat},${searchLng}`;
      params.radius = 50000; // 50km radius
      console.log(`[Places Search] Using location bias: ${params.location} with ${params.radius}m radius`);
    } else {
      // If no location coordinates, add region bias for Taiwan if query contains Taiwan-related terms
      const queryLower = query.toLowerCase();
      if (queryLower.includes('台灣') || 
          queryLower.includes('taiwan') || queryLower.includes('台北') ||
          queryLower.includes('taipei') || queryLower.includes('新北') ||
          queryLower.includes('桃園') ||
          queryLower.includes('taoyuan') || queryLower.includes('台中') ||
          queryLower.includes('taichung') || queryLower.includes('台南') ||
          queryLower.includes('tainan') || queryLower.includes('高雄') ||
          queryLower.includes('kaohsiung')) {
        // Use region parameter to bias results toward Taiwan
        // Note: region parameter is not directly supported in Text Search API,
        // but we can add it to help with query interpretation
        console.log(`[Places Search] Query appears to be Taiwan-related, using query-based location`);
      }
    }

    const response = await axios.get('https://maps.googleapis.com/maps/api/place/textsearch/json', {
      params,
    });

    // Handle ZERO_RESULTS as valid empty response (not an error)
    if (response.data.status === 'ZERO_RESULTS') {
      console.log('[Places Search] No results found for query');
      res.json({ places: [] });
      return;
    }

    if (response.data.status !== 'OK') {
      res.status(400).json({ detail: `Google Places API error: ${response.data.status}` });
      return;
    }

    const places = response.data.results.slice(0, 20).map((result: any) => ({
      placeId: result.place_id,
      name: result.name,
      address: result.formatted_address,
      lat: result.geometry?.location?.lat,
      lng: result.geometry?.location?.lng,
      rating: result.rating,
      photoReference: result.photos?.[0]?.photo_reference,
    }));

    console.log('[Places Search] Google API call successful, returning places');
    res.json({ places });
  } catch (error: any) {
    console.error('[Places Search] Error caught:', error.message);
    res.status(500).json({ detail: `Error calling Google Places API: ${error.message}` });
  }
});

// Directions between two places (used for trip transportation segments)
router.get('/directions', async (req: express.Request, res: Response) => {
  const { originLat, originLng, destLat, destLng, mode } = req.query;

  if (!originLat || !originLng || !destLat || !destLng) {
    res.status(400).json({ detail: 'originLat, originLng, destLat, and destLng are required' });
    return;
  }

  if (!config.googlePlacesApiKey) {
    res.status(503).json({ detail: 'Google Places API key not configured' });
    return;
  }

  try {
    const allowedModes = ['driving', 'walking', 'bicycling', 'transit'];
    let travelMode = 'driving';

    if (mode && typeof mode === 'string') {
      const lower = mode.toLowerCase();
      if (allowedModes.includes(lower)) {
        travelMode = lower;
      }
    }

    const params = {
      origin: `${originLat},${originLng}`,
      destination: `${destLat},${destLng}`,
      mode: travelMode,
      key: config.googlePlacesApiKey,
    };

    const response = await axios.get('https://maps.googleapis.com/maps/api/directions/json', {
      params,
    });

    if (response.data.status !== 'OK' || !response.data.routes?.length) {
      res.status(400).json({ detail: `Google Directions API error: ${response.data.status}` });
      return;
    }

    const leg = response.data.routes[0].legs?.[0];
    const polyline = response.data.routes[0].overview_polyline?.points;

    if (!leg) {
      res.status(400).json({ detail: 'No route legs returned from Google Directions API' });
      return;
    }

    res.json({
      distanceText: leg.distance?.text,
      distanceValue: leg.distance?.value,
      durationText: leg.duration?.text,
      durationValue: leg.duration?.value,
      polyline,
      mode: travelMode,
    });
  } catch (error: any) {
    res.status(500).json({ detail: `Error calling Google Directions API: ${error.message}` });
  }
});

export default router;

