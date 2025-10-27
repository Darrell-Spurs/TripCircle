import React from 'react';
import {
  Container,
  Typography,
  Box,
  Grid,
  Card,
  CardContent,
  Paper,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Avatar,
  Rating,
  Chip,
} from '@mui/material';
import {
  Restaurant,
  Star,
  AttachMoney,
  CalendarToday,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useAppContext } from '../context/AppContext';
import { RestaurantStatus } from '../types';

const StatsPage: React.FC = () => {
  const navigate = useNavigate();
  const { restaurants, visitRecords, tags } = useAppContext();

  // 計算統計資料
  const stats = {
    totalRestaurants: restaurants.length,
    totalVisits: visitRecords.length,
    totalSpent: visitRecords.reduce((sum, record) => sum + record.totalSpent, 0),
    averageRating: visitRecords.length > 0 
      ? visitRecords.reduce((sum, record) => sum + record.rating, 0) / visitRecords.length 
      : 0,
    averageSpentPerVisit: visitRecords.length > 0 
      ? visitRecords.reduce((sum, record) => sum + record.totalSpent, 0) / visitRecords.length 
      : 0,
  };

  // 按狀態分組餐廳
  const restaurantsByStatus = {
    [RestaurantStatus.WANT_TO_VISIT]: restaurants.filter(r => r.status === RestaurantStatus.WANT_TO_VISIT),
    [RestaurantStatus.VISITED]: restaurants.filter(r => r.status === RestaurantStatus.VISITED),
    [RestaurantStatus.FREQUENT]: restaurants.filter(r => r.status === RestaurantStatus.FREQUENT),
  };

  // 最受歡迎的餐廳（按拜訪次數）
  const topRestaurantsByVisits = [...restaurants]
    .filter(r => r.totalVisits > 0)
    .sort((a, b) => b.totalVisits - a.totalVisits)
    .slice(0, 5);

  // 最貴的餐廳（按總花費）
  // const topRestaurantsBySpending = [...restaurants]
  //   .filter(r => r.totalSpent > 0)
  //   .sort((a, b) => b.totalSpent - a.totalSpent)
  //   .slice(0, 5);

  // 評分最高的餐廳
  const topRestaurantsByRating = [...restaurants]
    .filter(r => r.averageRating && r.averageRating > 0)
    .sort((a, b) => (b.averageRating || 0) - (a.averageRating || 0))
    .slice(0, 5);

  // 最受歡迎的標籤
  const tagStats = tags.map(tag => {
    const count = restaurants.filter(r => r.tags.includes(tag.name)).length;
    return { tag, count };
  }).sort((a, b) => b.count - a.count).slice(0, 5);

  // 月度拜訪統計
  const monthlyStats = visitRecords.reduce((acc, visit) => {
    const month = new Date(visit.visitDate).toISOString().substring(0, 7); // YYYY-MM
    if (!acc[month]) {
      acc[month] = { count: 0, spent: 0 };
    }
    acc[month].count += 1;
    acc[month].spent += visit.totalSpent;
    return acc;
  }, {} as Record<string, { count: number; spent: number }>);

  const monthlyData = Object.entries(monthlyStats)
    .sort(([a], [b]) => a.localeCompare(b))
    .slice(-6); // 最近6個月

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
      <Box sx={{ mb: 3 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          統計資料
        </Typography>
        <Typography variant="body1" color="text.secondary">
          你的美食探索數據分析
        </Typography>
      </Box>

      {/* 通常是計統計 */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <Avatar sx={{ bgcolor: 'primary.main', mr: 2 }}>
                  <Restaurant />
                </Avatar>
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
                <Avatar sx={{ bgcolor: 'success.main', mr: 2 }}>
                  <CalendarToday />
                </Avatar>
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
                <Avatar sx={{ bgcolor: 'warning.main', mr: 2 }}>
                  <AttachMoney />
                </Avatar>
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
                <Avatar sx={{ bgcolor: 'info.main', mr: 2 }}>
                  <Star />
                </Avatar>
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
        {/* 餐廳狀態分佈 */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                餐廳狀態分佈
              </Typography>
              {Object.entries(restaurantsByStatus).map(([status, restaurants]) => (
                <Box key={status} sx={{ mb: 2 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                    <Chip 
                      label={getStatusLabel(status as RestaurantStatus)} 
                      color={getStatusColor(status as RestaurantStatus) as any}
                      size="small"
                    />
                    <Typography variant="body2" color="text.secondary">
                      {restaurants.length} 家
                    </Typography>
                  </Box>
                  <Box sx={{ 
                    height: 8, 
                    backgroundColor: 'grey.200', 
                    borderRadius: 1,
                    overflow: 'hidden'
                  }}>
                    <Box sx={{ 
                      height: '100%', 
                      backgroundColor: status === RestaurantStatus.WANT_TO_VISIT ? 'grey.500' :
                                      status === RestaurantStatus.VISITED ? 'primary.main' : 'secondary.main',
                      width: `${(restaurants.length / stats.totalRestaurants) * 100}%`,
                      transition: 'width 0.3s ease'
                    }} />
                  </Box>
                </Box>
              ))}
            </CardContent>
          </Card>
        </Grid>

        {/* 最受歡迎標籤 */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                最受歡迎標籤
              </Typography>
              <List>
                {tagStats.map(({ tag, count }) => (
                  <ListItem key={tag.id}>
                    <ListItemAvatar>
                      <Avatar sx={{ bgcolor: tag.color, width: 32, height: 32 }}>
                        {tag.name.charAt(0)}
                      </Avatar>
                    </ListItemAvatar>
                    <ListItemText
                      primary={tag.name}
                      secondary={`${count} 家餐廳`}
                    />
                  </ListItem>
                ))}
              </List>
            </CardContent>
          </Card>
        </Grid>

        {/* 最受歡迎餐廳 */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                最常拜訪餐廳
              </Typography>
              <List>
                {topRestaurantsByVisits.map((restaurant, index) => (
                  <ListItem 
                    key={restaurant.id}
                    sx={{ cursor: 'pointer' }}
                    onClick={() => navigate(`/restaurants/${restaurant.id}`)}
                  >
                    <ListItemAvatar>
                      <Avatar sx={{ bgcolor: 'primary.main' }}>
                        {index + 1}
                      </Avatar>
                    </ListItemAvatar>
                    <ListItemText
                      primary={restaurant.name}
                      secondary={
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Rating value={restaurant.averageRating || 0} readOnly size="small" />
                          <Typography variant="body2" color="text.secondary">
                            {restaurant.totalVisits} 次拜訪
                          </Typography>
                        </Box>
                      }
                    />
                  </ListItem>
                ))}
              </List>
            </CardContent>
          </Card>
        </Grid>

        {/* 評分最高餐廳 */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                評分最高餐廳
              </Typography>
              <List>
                {topRestaurantsByRating.map((restaurant, index) => (
                  <ListItem 
                    key={restaurant.id}
                    sx={{ cursor: 'pointer' }}
                    onClick={() => navigate(`/restaurants/${restaurant.id}`)}
                  >
                    <ListItemAvatar>
                      <Avatar sx={{ bgcolor: 'warning.main' }}>
                        {index + 1}
                      </Avatar>
                    </ListItemAvatar>
                    <ListItemText
                      primary={restaurant.name}
                      secondary={
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Rating value={restaurant.averageRating || 0} readOnly size="small" />
                          <Typography variant="body2" color="text.secondary">
                            {restaurant.averageRating?.toFixed(1)} 分
                          </Typography>
                        </Box>
                      }
                    />
                  </ListItem>
                ))}
              </List>
            </CardContent>
          </Card>
        </Grid>

        {/* 月度拜訪趨勢 */}
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                最近6個月拜訪趨勢
              </Typography>
              <Grid container spacing={2}>
                {monthlyData.map(([month, data]) => (
                  <Grid item xs={12} sm={6} md={2} key={month}>
                    <Paper sx={{ p: 2, textAlign: 'center' }}>
                      <Typography variant="body2" color="text.secondary">
                        {month}
                      </Typography>
                      <Typography variant="h6">
                        {data.count} 次
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        NT$ {data.spent.toLocaleString()}
                      </Typography>
                    </Paper>
                  </Grid>
                ))}
              </Grid>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Container>
  );
};

export default StatsPage;
