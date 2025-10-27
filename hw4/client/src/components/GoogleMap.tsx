import React, { useEffect, useRef, useState } from 'react';
import { Box, Paper, Typography, Chip, Rating, Button } from '@mui/material';
import { LocationOn, Phone, Language } from '@mui/icons-material';
import type { Restaurant } from '../types';

interface GoogleMapProps {
  restaurants: Restaurant[];
  onRestaurantSelect?: (restaurant: Restaurant) => void;
  center?: { lat: number; lng: number };
  zoom?: number;
}

declare global {
  interface Window {
    google: any;
    initMap: () => void;
  }
}

const GoogleMap: React.FC<GoogleMapProps> = ({ 
  restaurants, 
  onRestaurantSelect,
  center = { lat: 25.0330, lng: 121.5654 }, // 台北市預設位置
  zoom = 12 
}) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const markersRef = useRef<any[]>([]);
  const [selectedRestaurant, setSelectedRestaurant] = useState<Restaurant | null>(null);
  const [mapLoaded, setMapLoaded] = useState(false);

  // 載入 Google Maps API
  useEffect(() => {
    const loadGoogleMapsAPI = async () => {
      // 如果已經載入，直接初始化
      if (window.google && window.google.maps) {
        console.log('Google Maps already loaded, initializing map...');
        // 確保 DOM 已經準備好
        if (mapRef.current) {
          initializeMap();
        } else {
          setTimeout(() => {
            if (mapRef.current) {
              initializeMap();
            } else {
              console.error('Map ref still not available after delay');
              setMapLoaded(true);
            }
          }, 100);
        }
        return;
      }

      const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
      
      console.log('API Key loaded:', apiKey ? 'Yes' : 'No');
      
      if (!apiKey || apiKey === 'your-google-maps-api-key-here') {
        console.warn('Google Maps API key not found or not configured. Using mock map.');
        console.warn('Please set VITE_GOOGLE_MAPS_API_KEY in .env.local file');
        setMapLoaded(true);
        return;
      }

      // 檢查是否已經有正在載入的腳本
      const existingScript = document.querySelector(`script[src*="maps.googleapis.com"]`);
      if (existingScript) {
        console.log('Waiting for existing script to load...');
        // 等待腳本載入完成
        existingScript.addEventListener('load', () => {
          if (mapRef.current) {
            initializeMap();
          } else {
            setTimeout(() => {
              if (mapRef.current) {
                initializeMap();
              } else {
                console.error('Map ref still not available after delay');
                setMapLoaded(true);
              }
            }, 100);
          }
        });
        return;
      }

      console.log('Loading Google Maps API with key:', apiKey.substring(0, 10) + '...');

      // 使用 loading=async 載入 Google Maps API
      const script = document.createElement('script');
      script.async = true;
      script.defer = true;
      script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&loading=async`;
      script.onload = () => {
        console.log('Google Maps API loaded successfully');
        // 確保 DOM 已經準備好
        if (mapRef.current) {
          initializeMap();
        } else {
          // 如果 ref 還沒準備好，稍等一下
          setTimeout(() => {
            if (mapRef.current) {
              initializeMap();
            } else {
              console.error('Map ref still not available after delay');
              setMapLoaded(true);
            }
          }, 100);
        }
      };
      script.onerror = () => {
        console.error('Failed to load Google Maps API - check your API key and network connection');
        setMapLoaded(true);
      };
      document.head.appendChild(script);
    };

    loadGoogleMapsAPI();
  }, []);

  useEffect(() => {
    if (mapInstanceRef.current && restaurants.length > 0 && mapLoaded) {
      updateMarkers();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [restaurants, mapLoaded]);

  const initializeMap = () => {
    if (!mapRef.current) {
      console.error('Map ref not available');
      return;
    }

    try {
      mapInstanceRef.current = new window.google.maps.Map(mapRef.current, {
        center: center,
        zoom: zoom,
        mapTypeId: 'roadmap',
      });
      console.log('Map initialized successfully');
      setMapLoaded(true);
    } catch (error) {
      console.error('Error initializing map:', error);
      setMapLoaded(true);
    }
  };

  const updateMarkers = () => {
    // 清除現有標記
    markersRef.current.forEach(marker => marker.setMap(null));
    markersRef.current = [];

    restaurants.forEach((restaurant) => {
      if (!mapInstanceRef.current) return;

      const marker = new window.google.maps.Marker({
        position: { lat: restaurant.latitude, lng: restaurant.longitude },
        map: mapInstanceRef.current,
        title: restaurant.name,
        icon: getMarkerIcon(restaurant),
      });

      // 添加點擊事件
      marker.addListener('click', () => {
        setSelectedRestaurant(restaurant);
        if (onRestaurantSelect) {
          onRestaurantSelect(restaurant);
        }
      });

      markersRef.current.push(marker);
    });
  };

  const getMarkerIcon = (restaurant: Restaurant) => {
    // 根據餐廳狀態返回不同的圖標顏色
    let color = '#FF5722'; // 預設紅色
    switch (restaurant.status) {
      case 'want_to_visit':
        color = '#9E9E9E'; // 灰色
        break;
      case 'visited':
        color = '#2196F3'; // 藍色
        break;
      case 'frequent':
        color = '#4CAF50'; // 綠色
        break;
    }

    return {
      url: `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(`
        <svg width="32" height="32" viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg">
          <circle cx="16" cy="16" r="12" fill="${color}" stroke="white" stroke-width="2"/>
          <text x="16" y="20" text-anchor="middle" fill="white" font-size="16" font-family="Arial">餐</text>
        </svg>
      `)}`,
      scaledSize: new window.google.maps.Size(32, 32),
    };
  };

  const handleRestaurantCardClick = (restaurant: Restaurant) => {
    if (onRestaurantSelect) {
      onRestaurantSelect(restaurant);
    }
    setSelectedRestaurant(restaurant);
  };

  // 地圖容器始終渲染，這樣 ref 才能正確設置
  return (
    <Box sx={{ position: 'relative', height: 400 }}>
      {/* 地圖容器 - 始終渲染 */}
      <div ref={mapRef} style={{ width: '100%', height: '100%', borderRadius: 8 }} />
      
      {/* 如果地圖未載入，顯示覆蓋層 */}
      {!mapLoaded || !window.google ? (
        <Paper
          sx={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            p: 3,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            pointerEvents: 'none',
          }}
        >
          <Box sx={{ textAlign: 'center' }}>
            <LocationOn sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
            <Typography variant="h6" color="text.secondary">
              地圖載入中...
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
              請設定 Google Maps API Key 以啟用地圖功能
            </Typography>
          </Box>
        </Paper>
      ) : null}
      
      {/* 選中的餐廳資訊卡片 */}
      {selectedRestaurant && (
        <Paper
          sx={{
            position: 'absolute',
            top: 16,
            right: 16,
            width: 300,
            p: 2,
            maxHeight: 300,
            overflow: 'auto',
          }}
        >
          <Typography variant="h6" gutterBottom>
            {selectedRestaurant.name}
          </Typography>
          
          <Typography variant="body2" color="text.secondary" gutterBottom>
            <LocationOn sx={{ fontSize: 16, mr: 0.5, verticalAlign: 'text-bottom' }} />
            {selectedRestaurant.address}
          </Typography>

          {selectedRestaurant.averageRating && (
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
              <Rating value={selectedRestaurant.averageRating} readOnly size="small" />
              <Typography variant="body2" sx={{ ml: 1 }}>
                {selectedRestaurant.averageRating.toFixed(1)} ({selectedRestaurant.totalVisits} 次拜訪)
              </Typography>
            </Box>
          )}

          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mb: 2 }}>
            {selectedRestaurant.tags.map((tag) => (
              <Chip key={tag} label={tag} size="small" />
            ))}
          </Box>

          {selectedRestaurant.phone && (
            <Typography variant="body2" color="text.secondary" gutterBottom>
              <Phone sx={{ fontSize: 16, mr: 0.5, verticalAlign: 'text-bottom' }} />
              {selectedRestaurant.phone}
            </Typography>
          )}

          {selectedRestaurant.website && (
            <Typography variant="body2" color="text.secondary" gutterBottom>
              <Language sx={{ fontSize: 16, mr: 0.5, verticalAlign: 'text-bottom' }} />
              {selectedRestaurant.website}
            </Typography>
          )}

          <Typography variant="body2" color="text.secondary" gutterBottom>
            總花費: NT$ {selectedRestaurant.totalSpent.toLocaleString()}
          </Typography>

          <Button
            variant="contained"
            size="small"
            fullWidth
            onClick={() => handleRestaurantCardClick(selectedRestaurant)}
            sx={{ mt: 1 }}
          >
            查看詳情
          </Button>
        </Paper>
      )}
    </Box>
  );
};

export default GoogleMap;
