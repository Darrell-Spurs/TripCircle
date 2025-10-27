import React from 'react';
import {
  Container,
  Grid,
  Card,
  CardContent,
  Typography,
  Box,
  Chip,
  Button,
  Paper,
} from '@mui/material';
import {
  Restaurant,
  Star,
  TrendingUp,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useAppContext } from '../context/AppContext';
import { RestaurantStatus } from '../types';

const HomePage: React.FC = () => {
  const navigate = useNavigate();
  const { restaurants, visitRecords, user } = useAppContext();

  const stats = {
    totalRestaurants: restaurants.length,
    totalVisits: visitRecords.length,
    totalSpent: visitRecords.reduce((sum, record) => sum + record.totalSpent, 0),
    averageRating: visitRecords.length > 0 
      ? visitRecords.reduce((sum, record) => sum + record.rating, 0) / visitRecords.length 
      : 0,
  };

  const recentRestaurants = restaurants
    .filter(r => r.status === RestaurantStatus.FREQUENT)
    .slice(0, 3);

  const recentVisits = visitRecords
    .sort((a, b) => new Date(b.visitDate).getTime() - new Date(a.visitDate).getTime())
    .slice(0, 3);

  return (
    <Container maxWidth="lg">
      <Box sx={{ mb: 4 }}>
        <Typography variant="h3" component="h1" gutterBottom>
          歡迎回來，{user?.username}！
        </Typography>
        <Typography variant="h6" color="text.secondary">
          繼續探索美食世界
        </Typography>
      </Box>

      {/* 統計卡片 */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <Restaurant color="primary" sx={{ mr: 2 }} />
                <Box>
                  <Typography color="text.secondary" gutterBottom>
                    收藏餐廳
                  </Typography>
                  <Typography variant="h4">
                    {stats.totalRestaurants}
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <Star color="primary" sx={{ mr: 2 }} />
                <Box>
                  <Typography color="text.secondary" gutterBottom>
                    總拜訪次數
                  </Typography>
                  <Typography variant="h4">
                    {stats.totalVisits}
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <TrendingUp color="primary" sx={{ mr: 2 }} />
                <Box>
                  <Typography color="text.secondary" gutterBottom>
                    總花費
                  </Typography>
                  <Typography variant="h4">
                    NT$ {stats.totalSpent.toLocaleString()}
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <Star color="primary" sx={{ mr: 2 }} />
                <Box>
                  <Typography color="text.secondary" gutterBottom>
                    平均評分
                  </Typography>
                  <Typography variant="h4">
                    {stats.averageRating.toFixed(1)}
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Grid container spacing={3}>
        {/* 常去餐廳 */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="h5" component="h2">
                常去餐廳
              </Typography>
              <Button 
                variant="outlined" 
                size="small"
                onClick={() => navigate('/restaurants')}
              >
                查看全部
              </Button>
            </Box>
            {recentRestaurants.length > 0 ? (
              recentRestaurants.map((restaurant) => (
                <Card key={restaurant.id} sx={{ mb: 2, cursor: 'pointer' }} 
                      onClick={() => navigate(`/restaurants/${restaurant.id}`)}>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      {restaurant.name}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                      {restaurant.address}
                    </Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 1 }}>
                      <Chip 
                        label={restaurant.status === RestaurantStatus.FREQUENT ? '常去' : 
                               restaurant.status === RestaurantStatus.VISITED ? '去過' : '想去'} 
                        size="small" 
                        color="primary" 
                      />
                      {restaurant.averageRating && (
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          <Star sx={{ fontSize: 16, mr: 0.5 }} />
                          <Typography variant="body2">
                            {restaurant.averageRating.toFixed(1)}
                          </Typography>
                        </Box>
                      )}
                      <Typography variant="body2" color="text.secondary">
                        拜訪 {restaurant.totalVisits} 次
                      </Typography>
                    </Box>
                  </CardContent>
                </Card>
              ))
            ) : (
              <Typography color="text.secondary">
                還沒有常去的餐廳
              </Typography>
            )}
          </Paper>
        </Grid>

        {/* 最近拜訪 */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="h5" component="h2">
                最近拜訪
              </Typography>
              <Button 
                variant="outlined" 
                size="small"
                onClick={() => navigate('/visits')}
              >
                查看全部
              </Button>
            </Box>
            {recentVisits.length > 0 ? (
              recentVisits.map((visit) => {
                const restaurant = restaurants.find(r => r.id === visit.restaurantId);
                return (
                  <Card key={visit.id} sx={{ mb: 2, cursor: 'pointer' }}
                        onClick={() => navigate(`/restaurants/${visit.restaurantId}`)}>
                    <CardContent>
                      <Typography variant="h6" gutterBottom>
                        {restaurant?.name}
                      </Typography>
                      <Typography variant="body2" color="text.secondary" gutterBottom>
                        {new Date(visit.visitDate).toLocaleDateString('zh-TW')}
                      </Typography>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 1 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          <Star sx={{ fontSize: 16, mr: 0.5 }} />
                          <Typography variant="body2">
                            {visit.rating}
                          </Typography>
                        </Box>
                        <Typography variant="body2" color="text.secondary">
                          NT$ {visit.totalSpent}
                        </Typography>
                        {visit.comment && (
                          <Typography variant="body2" color="text.secondary" sx={{ ml: 1 }}>
                            "{visit.comment}"
                          </Typography>
                        )}
                      </Box>
                    </CardContent>
                  </Card>
                );
              })
            ) : (
              <Typography color="text.secondary">
                還沒有拜訪紀錄
              </Typography>
            )}
          </Paper>
        </Grid>
      </Grid>
    </Container>
  );
};

export default HomePage;
