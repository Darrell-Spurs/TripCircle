import React, { useState } from 'react';
import {
  Container,
  Box,
  TextField,
  Button,
  Typography,
  Card,
  CardContent,
  Grid,
  Chip,
  CircularProgress,
  Alert,
  Rating,
  Paper,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Avatar,
  Divider,
} from '@mui/material';
import {
  Search,
  Add,
  LocationOn,
  Phone,
  Language,
  Star,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useAppContext } from '../context/AppContext';
import { searchPlaces } from '../services/restaurant.service';

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

const RestaurantSearchPage: React.FC = () => {
  const navigate = useNavigate();
  const { addRestaurant, loading, error } = useAppContext();
  
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Place[]>([]);
  const [searching, setSearching] = useState(false);
  const [addingRestaurant, setAddingRestaurant] = useState<string | null>(null);

  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      return;
    }

    setSearching(true);
    try {
      const places = await searchPlaces(searchQuery);
      console.log('Search results:', places);
      setSearchResults(Array.isArray(places) ? places : []);
    } catch (err) {
      console.error('Search error:', err);
      setSearchResults([]);
    } finally {
      setSearching(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  const handleAddRestaurant = async (place: Place) => {
    setAddingRestaurant(place.placeId);
    try {
      // Wait for the restaurant to be added and data to be refreshed
      await addRestaurant({
        name: place.name,
        address: place.address,
        phone: place.phone,
        website: place.website,
        latitude: place.lat,
        longitude: place.lng,
        tags: [],
        status: 'want_to_visit',
      });
      
      // Wait a bit to ensure state is updated
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // Navigate to restaurant list
      navigate('/restaurants');
    } catch (err) {
      console.error('Add restaurant error:', err);
    } finally {
      setAddingRestaurant(null);
    }
  };

  return (
    <Container maxWidth="lg">
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          搜尋餐廳
        </Typography>
        <Typography variant="body1" color="text.secondary">
          使用 Google Places API 搜尋餐廳並新增到您的收藏
        </Typography>
      </Box>

      {/* 搜尋欄 */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
          <TextField
            fullWidth
            placeholder="搜尋餐廳，例如：鼎泰豐、信義區餐廳..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyPress={handleKeyPress}
            InputProps={{
              startAdornment: <Search sx={{ mr: 1, color: 'text.secondary' }} />,
            }}
          />
          <Button
            variant="contained"
            onClick={handleSearch}
            disabled={searching || !searchQuery.trim()}
            startIcon={searching ? <CircularProgress size={20} /> : <Search />}
          >
            搜尋
          </Button>
        </Box>
      </Paper>

      {/* 錯誤訊息 */}
      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {/* 搜尋結果 */}
      {searchResults.length > 0 && (
        <Box>
          <Typography variant="h6" gutterBottom>
            搜尋結果 ({searchResults.length})
          </Typography>
          <List>
            {searchResults.map((place, index) => (
              <React.Fragment key={place.placeId}>
                <ListItem
                  sx={{
                    border: '1px solid',
                    borderColor: 'divider',
                    borderRadius: 2,
                    mb: 2,
                    bgcolor: 'background.paper',
                  }}
                >
                  <ListItemAvatar>
                    <Avatar sx={{ bgcolor: 'primary.main' }}>
                      <LocationOn />
                    </Avatar>
                  </ListItemAvatar>
                  <ListItemText
                    primary={
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Typography variant="h6">{place.name}</Typography>
                        {place.rating && (
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                            <Star sx={{ fontSize: 16, color: 'warning.main' }} />
                            <Typography variant="body2">
                              {place.rating.toFixed(1)}
                            </Typography>
                          </Box>
                        )}
                      </Box>
                    }
                    secondary={
                      <Box>
                        <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                          <LocationOn sx={{ fontSize: 14, mr: 0.5, verticalAlign: 'middle' }} />
                          {place.address}
                        </Typography>
                        {place.phone && (
                          <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
                            <Phone sx={{ fontSize: 14, mr: 0.5, verticalAlign: 'middle' }} />
                            {place.phone}
                          </Typography>
                        )}
                        {place.website && (
                          <Typography variant="body2" color="text.secondary">
                            <Language sx={{ fontSize: 14, mr: 0.5, verticalAlign: 'middle' }} />
                            {place.website}
                          </Typography>
                        )}
                      </Box>
                    }
                  />
                  <Button
                    variant="contained"
                    startIcon={addingRestaurant === place.placeId ? <CircularProgress size={16} /> : <Add />}
                    onClick={() => handleAddRestaurant(place)}
                    disabled={addingRestaurant === place.placeId || loading}
                  >
                    新增
                  </Button>
                </ListItem>
              </React.Fragment>
            ))}
          </List>
        </Box>
      )}

      {/* 空狀態 */}
      {!searching && searchResults.length === 0 && searchQuery && (
        <Box sx={{ textAlign: 'center', py: 8 }}>
          <Typography variant="h6" color="text.secondary">
            沒有找到符合的餐廳
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            請嘗試使用不同的關鍵字搜尋
          </Typography>
        </Box>
      )}

      {/* 提示訊息 */}
      {!searching && searchResults.length === 0 && !searchQuery && (
        <Paper sx={{ p: 4, textAlign: 'center', bgcolor: 'action.hover' }}>
          <Search sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
          <Typography variant="h6" color="text.secondary" gutterBottom>
            開始搜尋餐廳
          </Typography>
          <Typography variant="body2" color="text.secondary">
            輸入餐廳名稱或地點來搜尋，例如：鼎泰豐、信義區火鍋、台北拉麵...
          </Typography>
        </Paper>
      )}
    </Container>
  );
};

export default RestaurantSearchPage;
