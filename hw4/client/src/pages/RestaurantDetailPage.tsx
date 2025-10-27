import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Container,
  Grid,
  Card,
  CardContent,
  Typography,
  Box,
  Chip,
  Button,
  Rating,
  Avatar,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
} from '@mui/material';
import {
  ArrowBack,
  LocationOn,
  Phone,
  Language,
  Edit,
  Add,
  Delete,
  CalendarToday,
  AttachMoney,
} from '@mui/icons-material';
import { useAppContext } from '../context/AppContext';
import { RestaurantStatus } from '../types';
// import type { VisitRecord } from '../types';
import GoogleMap from '../components/GoogleMap';

const RestaurantDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { 
    restaurants, 
    visitRecords, 
    deleteVisitRecord 
  } = useAppContext();

  const [showAddVisitDialog, setShowAddVisitDialog] = useState(false);
  // const [showEditDialog, setShowEditDialog] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [visitToDelete, setVisitToDelete] = useState<string | null>(null);

  const restaurant = restaurants.find(r => r.id === id);
  
  if (!restaurant) {
    return (
      <Container maxWidth="lg">
        <Box sx={{ textAlign: 'center', py: 8 }}>
          <Typography variant="h6" color="text.secondary">
            找不到指定的餐廳
          </Typography>
          <Button
            variant="contained"
            onClick={() => navigate('/restaurants')}
            sx={{ mt: 2 }}
          >
            返回餐廳列表
          </Button>
        </Box>
      </Container>
    );
  }

  const restaurantVisits = visitRecords
    .filter(record => record.restaurantId === restaurant.id)
    .sort((a, b) => new Date(b.visitDate).getTime() - new Date(a.visitDate).getTime());

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

  const handleDeleteVisit = (visitId: string) => {
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

  return (
    <Container maxWidth="lg">
      {/* 返回按鈕 */}
      <Box sx={{ mb: 3 }}>
        <Button
          startIcon={<ArrowBack />}
          onClick={() => navigate('/restaurants')}
        >
          返回餐廳列表
        </Button>
      </Box>

      <Grid container spacing={3}>
        {/* 餐廳基本資訊 */}
        <Grid item xs={12} md={8}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                <Typography variant="h4" component="h1">
                  {restaurant.name}
                </Typography>
                <Box>
                  <Chip 
                    label={getStatusLabel(restaurant.status)} 
                    color={getStatusColor(restaurant.status) as any}
                    sx={{ mr: 1 }}
                  />
                  <IconButton onClick={() => {/* setShowEditDialog(true) */}}>
                    <Edit />
                  </IconButton>
                </Box>
              </Box>

              <Typography variant="body1" color="text.secondary" gutterBottom>
                <LocationOn sx={{ fontSize: 20, mr: 1, verticalAlign: 'text-bottom' }} />
                {restaurant.address}
              </Typography>

              {restaurant.phone && (
                <Typography variant="body1" color="text.secondary" gutterBottom>
                  <Phone sx={{ fontSize: 20, mr: 1, verticalAlign: 'text-bottom' }} />
                  {restaurant.phone}
                </Typography>
              )}

              {restaurant.website && (
                <Typography variant="body1" color="text.secondary" gutterBottom>
                  <Language sx={{ fontSize: 20, mr: 1, verticalAlign: 'text-bottom' }} />
                  <a href={restaurant.website} target="_blank" rel="noopener noreferrer">
                    {restaurant.website}
                  </a>
                </Typography>
              )}

              {restaurant.description && (
                <Typography variant="body1" sx={{ mt: 2 }}>
                  {restaurant.description}
                </Typography>
              )}

              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mt: 2 }}>
                {restaurant.tags.map((tag) => (
                  <Chip key={tag} label={tag} variant="outlined" />
                ))}
              </Box>
            </CardContent>
          </Card>

          {/* 地圖 */}
          <Card sx={{ mt: 3 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                位置
              </Typography>
              <GoogleMap 
                restaurants={[restaurant]} 
                center={{ lat: restaurant.latitude, lng: restaurant.longitude }}
                zoom={15}
              />
            </CardContent>
          </Card>
        </Grid>

        {/* 統計資訊和拜訪紀錄 */}
        <Grid item xs={12} md={4}>
          {/* 統計資訊 */}
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                統計資訊
              </Typography>
              
              {restaurant.averageRating && (
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <Rating value={restaurant.averageRating} readOnly />
                  <Typography variant="h6" sx={{ ml: 1 }}>
                    {restaurant.averageRating.toFixed(1)}
                  </Typography>
                </Box>
              )}

              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                <Typography variant="body2" color="text.secondary">
                  總拜訪次數:
                </Typography>
                <Typography variant="body2">
                  {restaurant.totalVisits}
                </Typography>
              </Box>

              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                <Typography variant="body2" color="text.secondary">
                  總花費:
                </Typography>
                <Typography variant="body2">
                  NT$ {restaurant.totalSpent.toLocaleString()}
                </Typography>
              </Box>

              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                <Typography variant="body2" color="text.secondary">
                  平均花費:
                </Typography>
                <Typography variant="body2">
                  NT$ {restaurant.totalVisits > 0 ? Math.round(restaurant.totalSpent / restaurant.totalVisits).toLocaleString() : 0}
                </Typography>
              </Box>
            </CardContent>
          </Card>

          {/* 拜訪紀錄 */}
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h6">
                  拜訪紀錄
                </Typography>
                <Button
                  variant="contained"
                  size="small"
                  startIcon={<Add />}
                  onClick={() => setShowAddVisitDialog(true)}
                >
                  新增拜訪
                </Button>
              </Box>

              {restaurantVisits.length > 0 ? (
                <List>
                  {restaurantVisits.map((visit) => (
                    <ListItem key={visit.id} divider>
                      <ListItemAvatar>
                        <Avatar sx={{ bgcolor: 'primary.main' }}>
                          <CalendarToday />
                        </Avatar>
                      </ListItemAvatar>
                      <ListItemText
                        primary={
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Typography variant="body2">
                              {new Date(visit.visitDate).toLocaleDateString('zh-TW')}
                            </Typography>
                            <Rating value={visit.rating} readOnly size="small" />
                          </Box>
                        }
                        secondary={
                          <Box>
                            <Typography variant="body2" color="text.secondary">
                              <AttachMoney sx={{ fontSize: 14, mr: 0.5, verticalAlign: 'text-bottom' }} />
                              NT$ {visit.totalSpent}
                            </Typography>
                            {visit.comment && (
                              <Typography variant="body2" color="text.secondary">
                                {visit.comment}
                              </Typography>
                            )}
                          </Box>
                        }
                      />
                      <IconButton
                        size="small"
                        onClick={() => handleDeleteVisit(visit.id)}
                        color="error"
                      >
                        <Delete />
                      </IconButton>
                    </ListItem>
                  ))}
                </List>
              ) : (
                <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 2 }}>
                  還沒有拜訪紀錄
                </Typography>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* 新增拜訪對話框 */}
      <Dialog open={showAddVisitDialog} onClose={() => setShowAddVisitDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>新增拜訪紀錄</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            為 {restaurant.name} 新增拜訪紀錄
          </Typography>
          <AddVisitForm 
            restaurant={restaurant} 
            onClose={() => setShowAddVisitDialog(false)}
            onSave={() => setShowAddVisitDialog(false)}
          />
        </DialogContent>
      </Dialog>

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

// 新增拜訪表單組件
const AddVisitForm: React.FC<{
  restaurant: any;
  onClose: () => void;
  onSave: () => void;
}> = ({ restaurant, onClose, onSave }) => {
  const { addVisitRecord } = useAppContext();
  const [visitDate, setVisitDate] = useState(new Date().toISOString().split('T')[0]);
  const [rating, setRating] = useState<number>(5);
  const [comment, setComment] = useState('');
  const [totalSpent, setTotalSpent] = useState(0);

  const handleSubmit = () => {
    const newVisit = {
      id: Date.now().toString(),
      restaurantId: restaurant.id,
      userId: '1',
      visitDate: new Date(visitDate),
      rating,
      comment,
      dishes: [],
      totalSpent,
      photos: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    addVisitRecord(newVisit);
    onSave();
  };

  return (
    <Box sx={{ pt: 2 }}>
      <TextField
        fullWidth
        label="拜訪日期"
        type="date"
        value={visitDate}
        onChange={(e) => setVisitDate(e.target.value)}
        InputLabelProps={{ shrink: true }}
        sx={{ mb: 2 }}
      />
      
      <Box sx={{ mb: 2 }}>
        <Typography variant="body2" gutterBottom>
          評分
        </Typography>
        <Rating
          value={rating}
          onChange={(_, newValue) => setRating(newValue || 5)}
        />
      </Box>

      <TextField
        fullWidth
        label="總花費 (NT$)"
        type="number"
        value={totalSpent}
        onChange={(e) => setTotalSpent(Number(e.target.value))}
        sx={{ mb: 2 }}
      />

      <TextField
        fullWidth
        label="備註"
        multiline
        rows={3}
        value={comment}
        onChange={(e) => setComment(e.target.value)}
        sx={{ mb: 2 }}
      />

      <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1 }}>
        <Button onClick={onClose}>取消</Button>
        <Button variant="contained" onClick={handleSubmit}>
          儲存
        </Button>
      </Box>
    </Box>
  );
};

export default RestaurantDetailPage;
