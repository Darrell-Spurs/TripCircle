import express, { Response } from 'express';
import axios from 'axios';
import { config } from '../config';

const router = express.Router();

router.get('/search', async (req: express.Request, res: Response) => {
  const { keyword, location, lat, lng } = req.query;

  if (!keyword || typeof keyword !== 'string') {
    res.status(400).json({ detail: 'keyword is required' });
    return;
  }

  if (!config.googlePlacesApiKey) {
    res.status(503).json({ detail: 'Google Places API key not configured' });
    return;
  }

  try {
    let query = keyword;
    if (location && typeof location === 'string') {
      query += ` in ${location}`;
    }

    const params: any = {
      query,
      key: config.googlePlacesApiKey,
      type: 'tourist_attraction|point_of_interest',
    };

    if (lat && lng) {
      params.location = `${lat},${lng}`;
      params.radius = 50000; // 50km radius
    }

    const response = await axios.get('https://maps.googleapis.com/maps/api/place/textsearch/json', {
      params,
    });

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

    res.json({ places });
  } catch (error: any) {
    res.status(500).json({ detail: `Error calling Google Places API: ${error.message}` });
  }
});

export default router;

