import React, { useState } from 'react';
import {
  Container,
  Grid,
  Card,
  CardContent,
  CardMedia,
  Typography,
  Box,
  Chip,
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  OutlinedInput,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Rating,
  Fab,
} from '@mui/material';
import {
  Search,
  FilterList,
  Add,
  LocationOn,
  Edit,
  Delete,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useAppContext } from '../context/AppContext';
import { RestaurantStatus } from '../types';
import GoogleMap from '../components/GoogleMap';

const RestaurantListPage: React.FC = () => {
  const navigate = useNavigate();
  const { 
    filteredRestaurants, 
    tags, 
    filterOptions, 
    setFilterOptions,
    deleteRestaurant 
  } = useAppContext();
  
  const [searchQuery, setSearchQuery] = useState(filterOptions.searchQuery || '');
  const [selectedStatus, setSelectedStatus] = useState<RestaurantStatus[]>(
    filterOptions.status || []
  );
  const [selectedTags, setSelectedTags] = useState<string[]>(
    filterOptions.tags || []
  );
  const [showFilters, setShowFilters] = useState(false);
  const [showMap, setShowMap] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [restaurantToDelete, setRestaurantToDelete] = useState<string | null>(null);

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    setFilterOptions({ ...filterOptions, searchQuery: query });
  };

  const handleStatusChange = (status: RestaurantStatus[]) => {
    setSelectedStatus(status);
    setFilterOptions({ ...filterOptions, status: status.length > 0 ? status : undefined });
  };

  const handleTagsChange = (tags: string[]) => {
    setSelectedTags(tags);
    setFilterOptions({ ...filterOptions, tags: tags.length > 0 ? tags : undefined });
  };

  const handleDeleteClick = (restaurantId: string) => {
    setRestaurantToDelete(restaurantId);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = () => {
    if (restaurantToDelete) {
      deleteRestaurant(restaurantToDelete);
      setDeleteDialogOpen(false);
      setRestaurantToDelete(null);
    }
  };

  const getStatusLabel = (status: RestaurantStatus) => {
    switch (status) {
      case RestaurantStatus.WANT_TO_VISIT:
        return '想去';
      case RestaurantStatus.VISITED:
        return '去過';
      case RestaurantStatus.FREQUENT:
        return '常去';
      default:
        return status;
    }
  };

  const getStatusColor = (status: RestaurantStatus) => {
    switch (status) {
      case RestaurantStatus.WANT_TO_VISIT:
        return 'default';
      case RestaurantStatus.VISITED:
        return 'primary';
      case RestaurantStatus.FREQUENT:
        return 'secondary';
      default:
        return 'default';
    }
  };

  return (
    <Container maxWidth="lg">
      <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h4" component="h1">
          餐廳列表
        </Typography>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button
            variant={showMap ? "contained" : "outlined"}
            onClick={() => setShowMap(!showMap)}
            startIcon={<LocationOn />}
          >
            {showMap ? '列表檢視' : '地圖檢視'}
          </Button>
          <Fab
            color="primary"
            size="medium"
            onClick={() => navigate('/restaurants/new')}
          >
            <Add />
          </Fab>
        </Box>
      </Box>

      {/* 搜尋和篩選 */}
      <Box sx={{ mb: 3 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              placeholder="搜尋餐廳名稱、地址或標籤..."
              value={searchQuery}
              onChange={(e) => handleSearch(e.target.value)}
              InputProps={{
                startAdornment: <Search sx={{ mr: 1, color: 'text.secondary' }} />,
              }}
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <Box sx={{ display: 'flex', gap: 1 }}>
              <Button
                variant="outlined"
                onClick={() => setShowFilters(!showFilters)}
                startIcon={<FilterList />}
              >
                篩選
              </Button>
              {(searchQuery || selectedStatus.length > 0 || selectedTags.length > 0) && (
                <Button
                  variant="text"
                  onClick={() => {
                    setSearchQuery('');
                    setSelectedStatus([]);
                    setSelectedTags([]);
                    setFilterOptions({});
                  }}
                >
                  清除
                </Button>
              )}
            </Box>
          </Grid>
        </Grid>

        {showFilters && (
          <Box sx={{ mt: 2, p: 2, border: '1px solid', borderColor: 'divider', borderRadius: 1 }}>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth>
                  <InputLabel>狀態</InputLabel>
                  <Select
                    multiple
                    value={selectedStatus}
                    onChange={(e) => handleStatusChange(e.target.value as RestaurantStatus[])}
                    input={<OutlinedInput label="狀態" />}
                    renderValue={(selected) => (
                      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                        {selected.map((value) => (
                          <Chip key={value} label={getStatusLabel(value)} size="small" />
                        ))}
                      </Box>
                    )}
                  >
                    {Object.values(RestaurantStatus).map((status) => (
                      <MenuItem key={status} value={status}>
                        {getStatusLabel(status)}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth>
                  <InputLabel>標籤</InputLabel>
                  <Select
                    multiple
                    value={selectedTags}
                    onChange={(e) => handleTagsChange(e.target.value as string[])}
                    input={<OutlinedInput label="標籤" />}
                    renderValue={(selected) => (
                      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                        {selected.map((value) => (
                          <Chip key={value} label={value} size="small" />
                        ))}
                      </Box>
                    )}
                  >
                    {tags.map((tag) => (
                      <MenuItem key={tag.id} value={tag.name}>
                        {tag.name}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
            </Grid>
          </Box>
        )}
      </Box>

      {/* 地圖檢視 */}
      {showMap && (
        <Box sx={{ mb: 3, height: 400 }}>
          <GoogleMap restaurants={filteredRestaurants} />
        </Box>
      )}

      {/* 餐廳列表 */}
      <Grid container spacing={3}>
        {filteredRestaurants.map((restaurant) => (
          <Grid item xs={12} sm={6} md={4} key={restaurant.id}>
            <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
              {restaurant.images && restaurant.images.length > 0 && (
                <CardMedia
                  component="img"
                  height="200"
                  image={restaurant.images[0]}
                  alt={restaurant.name}
                />
              )}
              <CardContent sx={{ flexGrow: 1 }}>
                <Typography variant="h6" gutterBottom>
                  {restaurant.name}
                </Typography>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  <LocationOn sx={{ fontSize: 16, mr: 0.5, verticalAlign: 'text-bottom' }} />
                  {restaurant.address}
                </Typography>
                
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mb: 2 }}>
                  <Chip 
                    label={getStatusLabel(restaurant.status)} 
                    size="small" 
                    color={getStatusColor(restaurant.status) as any}
                  />
                  {restaurant.tags.map((tag) => (
                    <Chip key={tag} label={tag} size="small" variant="outlined" />
                  ))}
                </Box>

                {restaurant.averageRating && (
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                    <Rating value={restaurant.averageRating} readOnly size="small" />
                    <Typography variant="body2" sx={{ ml: 1 }}>
                      {restaurant.averageRating.toFixed(1)} ({restaurant.totalVisits} 次拜訪)
                    </Typography>
                  </Box>
                )}

                <Typography variant="body2" color="text.secondary">
                  總花費: NT$ {restaurant.totalSpent.toLocaleString()}
                </Typography>
              </CardContent>
              
              <Box sx={{ p: 2, pt: 0, display: 'flex', justifyContent: 'space-between' }}>
                <Button
                  variant="contained"
                  onClick={() => navigate(`/restaurants/${restaurant.id}`)}
                >
                  查看詳情
                </Button>
                <Box>
                  <IconButton
                    size="small"
                    onClick={() => navigate(`/restaurants/${restaurant.id}/edit`)}
                  >
                    <Edit />
                  </IconButton>
                  <IconButton
                    size="small"
                    onClick={() => handleDeleteClick(restaurant.id)}
                    color="error"
                  >
                    <Delete />
                  </IconButton>
                </Box>
              </Box>
            </Card>
          </Grid>
        ))}
      </Grid>

      {filteredRestaurants.length === 0 && (
        <Box sx={{ textAlign: 'center', py: 8 }}>
          <Typography variant="h6" color="text.secondary">
            沒有找到符合條件的餐廳
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            試試調整搜尋條件或新增餐廳
          </Typography>
        </Box>
      )}

      {/* 刪除確認對話框 */}
      <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)}>
        <DialogTitle>確認刪除</DialogTitle>
        <DialogContent>
          <Typography>
            確定要刪除這個餐廳嗎？此操作無法復原，相關的拜訪紀錄也會被刪除。
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)}>取消</Button>
          <Button onClick={handleDeleteConfirm} color="error" variant="contained">
            刪除
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default RestaurantListPage;
