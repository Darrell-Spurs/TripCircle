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

// Directions between two places using Routes API v2 (used for trip transportation segments)
router.get('/directions', async (req: express.Request, res: Response) => {
  const { originLat, originLng, destLat, destLng, mode, departureTime } = req.query;

  console.log('[Directions] Request received:', { originLat, originLng, destLat, destLng, mode, departureTime });

  if (!originLat || !originLng || !destLat || !destLng) {
    res.status(400).json({ detail: 'originLat, originLng, destLat, and destLng are required' });
    return;
  }

  if (!config.googlePlacesApiKey) {
    res.status(503).json({ detail: 'Google Places API key not configured' });
    return;
  }

  try {
    // Map frontend modes to Routes API v2 travel modes
    const modeMap: Record<string, string> = {
      'driving': 'DRIVE',
      'walking': 'WALK',
      'bicycling': 'BICYCLE',
      'transit': 'TRANSIT',
      'train': 'TRANSIT',
      'subway': 'TRANSIT',
      'bus': 'TRANSIT',
      'plane': 'TRANSIT',
    };

    const allowedModes = ['driving', 'walking', 'bicycling', 'transit', 'train', 'subway', 'bus', 'plane'];
    let travelMode = 'driving';
    let frontendMode = 'driving';

    if (mode && typeof mode === 'string') {
      const lower = mode.toLowerCase();
      if (allowedModes.includes(lower)) {
        travelMode = modeMap[lower] || 'DRIVE';
        frontendMode = lower;
      }
    }

    // Build Routes API v2 request body
    const requestBody: any = {
      origin: {
        location: {
          latLng: {
            latitude: parseFloat(originLat as string),
            longitude: parseFloat(originLng as string),
          },
        },
      },
      destination: {
        location: {
          latLng: {
            latitude: parseFloat(destLat as string),
            longitude: parseFloat(destLng as string),
          },
        },
      },
      travelMode: travelMode,
      computeAlternativeRoutes: false,
    };
    
    // Only set routingPreference for DRIVE mode (not for WALK or BICYCLE)
    if (travelMode === 'DRIVE') {
      requestBody.routingPreference = 'TRAFFIC_AWARE';
    }

    // Add departure time if provided (convert Unix timestamp to RFC3339)
    if (departureTime && typeof departureTime === 'string') {
      const timestamp = parseInt(departureTime, 10);
      if (!isNaN(timestamp) && timestamp > 0) {
        const currentTime = Math.floor(Date.now() / 1000);
        const departureDate = new Date(timestamp * 1000);
        
        if (travelMode === 'TRANSIT') {
          // For transit, always use the provided timestamp (if in future)
          if (timestamp > currentTime) {
            requestBody.departureTime = departureDate.toISOString();
          }
        } else if (travelMode === 'DRIVE') {
          // For driving, only use if it's in the future (at least 1 minute from now)
          if (timestamp > currentTime + 60) {
            requestBody.departureTime = departureDate.toISOString();
          }
          // Otherwise, don't set departureTime to use current traffic
        } else if (travelMode === 'WALK' || travelMode === 'BICYCLE') {
          // For walking/bicycling, only use if it's in the future (at least 1 minute from now)
          // These modes don't accept past timestamps
          if (timestamp > currentTime + 60) {
            requestBody.departureTime = departureDate.toISOString();
          }
          // Otherwise, don't set departureTime (will use current time)
        }
      }
    }

    // Add transit preferences for transit mode
    if (travelMode === 'TRANSIT') {
      requestBody.transitPreferences = {
        allowedTravelModes: ['SUBWAY', 'TRAIN', 'BUS'],
        routingPreference: 'LESS_WALKING',
      };
    }

    console.log('[Directions] Calling Routes API v2 with requestBody:', JSON.stringify(requestBody, null, 2));
    
    const response = await axios.post(
      'https://routes.googleapis.com/directions/v2:computeRoutes',
      requestBody,
      {
        headers: {
          'Content-Type': 'application/json',
          'X-Goog-Api-Key': config.googlePlacesApiKey,
          'X-Goog-FieldMask': 'routes.duration,routes.distanceMeters,routes.polyline,routes.legs.steps,routes.legs.duration,routes.legs.distanceMeters,routes.legs.steps.travelMode,routes.legs.steps.distanceMeters,routes.legs.steps.staticDuration,routes.legs.steps.transitDetails,routes.legs.steps.localizedValues',
        },
      }
    );

    console.log('[Directions] Routes API v2 response status:', response.status);
    console.log('[Directions] Routes API v2 response data structure:', {
      hasRoutes: !!response.data.routes,
      routesLength: response.data.routes?.length || 0,
      firstRouteKeys: response.data.routes?.[0] ? Object.keys(response.data.routes[0]) : [],
    });

    if (!response.data.routes || response.data.routes.length === 0) {
      console.error('[Directions] No routes in response:', JSON.stringify(response.data, null, 2));
      res.status(400).json({ detail: 'No routes returned from Google Routes API' });
      return;
    }

    const route = response.data.routes[0];
    const leg = route.legs?.[0];

    console.log('[Directions] Route structure:', {
      hasLegs: !!route.legs,
      legsLength: route.legs?.length || 0,
      firstLegKeys: leg ? Object.keys(leg) : [],
      routeDuration: route.duration,
      routeDistanceMeters: route.distanceMeters,
      legDuration: leg?.duration,
      legDistanceMeters: leg?.distanceMeters,
    });

    if (!leg) {
      console.error('[Directions] No leg in route:', JSON.stringify(route, null, 2));
      res.status(400).json({ detail: 'No route legs returned from Google Routes API' });
      return;
    }

    // Extract distance and duration
    const distanceMeters = route.distanceMeters || leg.distanceMeters || 0;
    
    // Parse duration - Routes API v2 returns duration as string like "300s" or as Duration object
    let durationValue = 0;
    const durationSource = route.duration || leg.duration;
    
    if (durationSource) {
      if (typeof durationSource === 'string') {
        // Format: "300s" or "300"
        const cleaned = durationSource.replace(/s$/, '');
        durationValue = parseInt(cleaned, 10) || 0;
      } else if (typeof durationSource === 'object') {
        // Duration protobuf format: { seconds: "300", nanos: 0 }
        if (durationSource.seconds !== undefined) {
          durationValue = parseInt(String(durationSource.seconds), 10) || 0;
        } else if (durationSource.nanos !== undefined) {
          // If only nanos, convert to seconds (though unlikely)
          durationValue = Math.floor(parseInt(String(durationSource.nanos), 10) / 1e9) || 0;
        }
      } else if (typeof durationSource === 'number') {
        durationValue = Math.floor(durationSource) || 0;
      }
    }
    
    console.log('[Directions] Duration parsing:', {
      routeDuration: route.duration,
      legDuration: leg.duration,
      durationSource,
      durationValue,
    });

    // Format distance text
    const distanceText = distanceMeters < 1000 
      ? `${distanceMeters} m` 
      : `${(distanceMeters / 1000).toFixed(1)} km`;

    // Format duration text
    const hours = Math.floor(durationValue / 3600);
    const minutes = Math.floor((durationValue % 3600) / 60);
    let durationText = '';
    if (hours > 0) {
      durationText = `${hours}h ${minutes}m`;
    } else {
      durationText = `${minutes}m`;
    }

    // Extract polyline
    const polyline = route.polyline?.encodedPolyline || '';

    // Extract step-by-step instructions
    const steps: any[] = [];
    if (leg.steps && Array.isArray(leg.steps)) {
      for (const step of leg.steps) {
        // Parse step duration
        let stepDuration = '0';
        if (step.staticDuration) {
          if (typeof step.staticDuration === 'string') {
            stepDuration = step.staticDuration.replace('s', '');
          } else if (typeof step.staticDuration === 'object' && step.staticDuration.seconds) {
            stepDuration = step.staticDuration.seconds.toString();
          }
        }
        
        const stepData: any = {
          travelMode: step.travelMode || 'UNSPECIFIED',
          distanceMeters: step.distanceMeters || 0,
          duration: stepDuration,
        };

        // Extract transit details if available
        if (step.transitDetails) {
          const transit = step.transitDetails;
          stepData.transitDetails = {
            lineName: transit.transitLine?.name?.text || transit.transitLine?.nameShort?.text || '',
            fromStation: transit.stopDetails?.arrivalStop?.name?.text || '',
            toStation: transit.stopDetails?.departureStop?.name?.text || '',
          };

          // Build instruction text
          if (transit.transitLine?.name?.text) {
            stepData.instruction = `Take ${transit.transitLine.name.text}`;
            if (transit.stopDetails?.arrivalStop?.name?.text && transit.stopDetails?.departureStop?.name?.text) {
              stepData.instruction += ` from ${transit.stopDetails.arrivalStop.name.text} to ${transit.stopDetails.departureStop.name.text}`;
            }
          }
        } else if (step.travelMode === 'WALK') {
          // Format walking step
          const walkDistance = step.distanceMeters || 0;
          const walkDistanceText = walkDistance < 1000 
            ? `${walkDistance} m` 
            : `${(walkDistance / 1000).toFixed(1)} km`;
          stepData.instruction = `Walk ${walkDistanceText}`;
        } else {
          stepData.instruction = step.localizedValues?.distance?.text || '';
        }

        steps.push(stepData);
      }
    }

    const responseData = {
      distanceText,
      distanceValue: distanceMeters,
      durationText,
      durationValue,
      polyline,
      mode: frontendMode,
      steps,
    };

    console.log('[Directions] Sending response:', {
      distanceText,
      distanceValue: distanceMeters,
      durationText,
      durationValue,
      hasPolyline: !!polyline,
      polylineLength: polyline?.length || 0,
      stepsCount: steps.length,
    });

    res.json(responseData);
  } catch (error: any) {
    console.error('[Routes API v2] Error caught:', error.response?.data || error.message);
    console.error('[Routes API v2] Error stack:', error.stack);
    const errorMessage = error.response?.data?.error?.message || error.response?.data?.message || error.message || 'Unknown error';
    res.status(500).json({ 
      detail: `Error calling Google Routes API: ${errorMessage}` 
    });
  }
});

export default router;

