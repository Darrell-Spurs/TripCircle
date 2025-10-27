import React, { useState } from 'react';
import {
  Container,
  Typography,
  Box,
  Card,
  CardContent,
  Grid,
  Avatar,
  Rating,
  Chip,
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Divider,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from '@mui/material';
import {
  Search,
  CalendarToday,
  AttachMoney,
  Star,
  Restaurant,
  FilterList,
  Delete,
  Edit,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useAppContext } from '../context/AppContext';

const VisitRecordsPage: React.FC = () => {
  const navigate = useNavigate();
  const { visitRecords, restaurants, deleteVisitRecord } = useAppContext();
  
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRestaurant, setSelectedRestaurant] = useState('');
  const [minRating, setMinRating] = useState('');
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [visitToDelete, setVisitToDelete] = useState<string | null>(null);

  // 篩選拜訪紀錄
  const filteredVisits = visitRecords.filter(visit => {
    const restaurant = restaurants.find(r => r.id === visit.restaurantId);
    if (!restaurant) return false;

    // 搜尋篩選
    if (searchQuery && !restaurant.name.toLowerCase().includes(searchQuery.toLowerCase()) &&
        !visit.comment?.toLowerCase().includes(searchQuery.toLowerCase())) {
      return false;
    }

    // 餐廳篩選
    if (selectedRestaurant && visit.restaurantId !== selectedRestaurant) {
      return false;
    }

    // 評分篩選
    if (minRating && visit.rating < Number(minRating)) {
      return false;
    }

    return true;
  }).sort((a, b) => new Date(b.visitDate).getTime() - new Date(a.visitDate).getTime());

  const handleDeleteClick = (visitId: string) => {
    setVisitToDelete(visitId);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = () => {
    if (visitToDelete) {
      deleteVisitRecord(visitToDelete);
      setDeleteDialogOpen(false);
      setVisitToDelete(null);
    }
  };

  const clearFilters = () => {
    setSearchQuery('');
    setSelectedRestaurant('');
    setMinRating('');
  };

  const totalSpent = filteredVisits.reduce((sum, visit) => sum + visit.totalSpent, 0);
  const averageRating = filteredVisits.length > 0 
    ? filteredVisits.reduce((sum, visit) => sum + visit.rating, 0) / filteredVisits.length 
    : 0;

  return (
    <Container maxWidth="lg">
      <Box sx={{ mb: 3 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          拜訪紀錄
        </Typography>
        <Typography variant="body1" color="text.secondary">
          查看和管理你的餐廳拜訪紀錄
        </Typography>
      </Box>

      {/* 統計資訊 */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={4}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <Avatar sx={{ bgcolor: 'primary.main', mr: 2 }}>
                  <CalendarToday />
                </Avatar>
                <Box>
                  <Typography color="text.secondary" gutterBottom>
                    總拜訪次數
                  </Typography>
                  <Typography variant="h4">
                    {filteredVisits.length}
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} sm={4}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <Avatar sx={{ bgcolor: 'success.main', mr: 2 }}>
                  <AttachMoney />
                </Avatar>
                <Box>
                  <Typography color="text.secondary" gutterBottom>
                    總花費
                  </Typography>
                  <Typography variant="h4">
                    NT$ {totalSpent.toLocaleString()}
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} sm={4}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <Avatar sx={{ bgcolor: 'warning.main', mr: 2 }}>
                  <Star />
                </Avatar>
                <Box>
                  <Typography color="text.secondary" gutterBottom>
                    平均評分
                  </Typography>
                  <Typography variant="h4">
                    {averageRating.toFixed(1)}
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* 搜尋和篩選 */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                placeholder="搜尋餐廳或備註..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                InputProps={{
                  startAdornment: <Search sx={{ mr: 1, color: 'text.secondary' }} />,
                }}
              />
            </Grid>
            <Grid item xs={12} md={3}>
              <FormControl fullWidth>
                <InputLabel>餐廳</InputLabel>
                <Select
                  value={selectedRestaurant}
                  onChange={(e) => setSelectedRestaurant(e.target.value)}
                  label="餐廳"
                >
                  <MenuItem value="">全部餐廳</MenuItem>
                  {restaurants.map((restaurant) => (
                    <MenuItem key={restaurant.id} value={restaurant.id}>
                      {restaurant.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={2}>
              <FormControl fullWidth>
                <InputLabel>最低評分</InputLabel>
                <Select
                  value={minRating}
                  onChange={(e) => setMinRating(e.target.value)}
                  label="最低評分"
                >
                  <MenuItem value="">不限</MenuItem>
                  <MenuItem value="1">1 星以上</MenuItem>
                  <MenuItem value="2">2 星以上</MenuItem>
                  <MenuItem value="3">3 星以上</MenuItem>
                  <MenuItem value="4">4 星以上</MenuItem>
                  <MenuItem value="5">5 星</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={3}>
              <Box sx={{ display: 'flex', gap: 1 }}>
                <Button
                  variant="outlined"
                  startIcon={<FilterList />}
                  onClick={() => {/* 可以添加更多篩選選項 */}}
                >
                  更多篩選
                </Button>
                {(searchQuery || selectedRestaurant || minRating) && (
                  <Button
                    variant="text"
                    onClick={clearFilters}
                  >
                    清除
                  </Button>
                )}
              </Box>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* 拜訪紀錄列表 */}
      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            拜訪紀錄 ({filteredVisits.length} 筆)
          </Typography>
          
          {filteredVisits.length > 0 ? (
            <List>
              {filteredVisits.map((visit, index) => {
                const restaurant = restaurants.find(r => r.id === visit.restaurantId);
                return (
                  <React.Fragment key={visit.id}>
                    <ListItem
                      sx={{ cursor: 'pointer' }}
                      onClick={() => navigate(`/restaurants/${visit.restaurantId}`)}
                    >
                      <ListItemAvatar>
                        <Avatar sx={{ bgcolor: 'primary.main' }}>
                          <Restaurant />
                        </Avatar>
                      </ListItemAvatar>
                      <ListItemText
                        primary={
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                            <Typography variant="h6">
                              {restaurant?.name}
                            </Typography>
                            <Rating value={visit.rating} readOnly size="small" />
                            <Chip 
                              label={new Date(visit.visitDate).toLocaleDateString('zh-TW')} 
                              size="small" 
                              variant="outlined"
                            />
                          </Box>
                        }
                        secondary={
                          <Box>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1 }}>
                              <Typography variant="body2" color="text.secondary">
                                <AttachMoney sx={{ fontSize: 14, mr: 0.5, verticalAlign: 'text-bottom' }} />
                                NT$ {visit.totalSpent}
                              </Typography>
                              <Typography variant="body2" color="text.secondary">
                                <Restaurant sx={{ fontSize: 14, mr: 0.5, verticalAlign: 'text-bottom' }} />
                                {restaurant?.address}
                              </Typography>
                            </Box>
                            {visit.comment && (
                              <Typography variant="body2" color="text.secondary">
                                "{visit.comment}"
                              </Typography>
                            )}
                            {visit.dishes && visit.dishes.length > 0 && (
                              <Box sx={{ mt: 1 }}>
                                {visit.dishes.map((dish) => (
                                  <Chip
                                    key={dish.id}
                                    label={`${dish.name} (NT$ ${dish.price})`}
                                    size="small"
                                    variant="outlined"
                                    sx={{ mr: 0.5, mb: 0.5 }}
                                  />
                                ))}
                              </Box>
                            )}
                          </Box>
                        }
                      />
                      <Box>
                        <IconButton
                          size="small"
                          onClick={(e) => {
                            e.stopPropagation();
                            // 可以添加編輯功能
                          }}
                        >
                          <Edit />
                        </IconButton>
                        <IconButton
                          size="small"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteClick(visit.id);
                          }}
                          color="error"
                        >
                          <Delete />
                        </IconButton>
                      </Box>
                    </ListItem>
                    {index < filteredVisits.length - 1 && <Divider />}
                  </React.Fragment>
                );
              })}
            </List>
          ) : (
            <Box sx={{ textAlign: 'center', py: 8 }}>
              <Typography variant="h6" color="text.secondary">
                沒有找到符合條件的拜訪紀錄
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                試試調整篩選條件或新增拜訪紀錄
              </Typography>
            </Box>
          )}
        </CardContent>
      </Card>

      {/* 刪除確認對話框 */}
      <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)}>
        <DialogTitle>確認刪除</DialogTitle>
        <DialogContent>
          <Typography>
            確定要刪除這個拜訪紀錄嗎？此操作無法復原。
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

export default VisitRecordsPage;
