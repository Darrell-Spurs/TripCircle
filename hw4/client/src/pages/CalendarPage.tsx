import React, { useState } from 'react';
import {
  Container,
  Typography,
  Box,
  Grid,
  Card,
  CardContent,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Avatar,
  Rating,
  Chip,
  Divider,
} from '@mui/material';
import {
  ChevronLeft,
  ChevronRight,
  CalendarToday,
  Restaurant,
  AttachMoney,
  Star,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useAppContext } from '../context/AppContext';

const CalendarPage: React.FC = () => {
  const navigate = useNavigate();
  const { visitRecords, restaurants } = useAppContext();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [showDateDialog, setShowDateDialog] = useState(false);

  // 獲取當前月份的拜訪紀錄
  const getVisitsForMonth = (date: Date) => {
    return visitRecords.filter(visit => {
      const visitDate = new Date(visit.visitDate);
      return visitDate.getMonth() === date.getMonth() && 
             visitDate.getFullYear() === date.getFullYear();
    });
  };

  // 獲取指定日期的拜訪紀錄
  const getVisitsForDate = (date: Date) => {
    return visitRecords.filter(visit => {
      const visitDate = new Date(visit.visitDate);
      return visitDate.toDateString() === date.toDateString();
    });
  };

  // 生成日曆網格
  const generateCalendarGrid = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const firstDay = new Date(year, month, 1);
    // const lastDay = new Date(year, month + 1, 0);
    const startDate = new Date(firstDay);
    startDate.setDate(startDate.getDate() - firstDay.getDay());
    
    const days = [];
    const today = new Date();
    
    for (let i = 0; i < 42; i++) {
      const date = new Date(startDate);
      date.setDate(startDate.getDate() + i);
      const visits = getVisitsForDate(date);
      
      days.push({
        date,
        visits,
        isCurrentMonth: date.getMonth() === month,
        isToday: date.toDateString() === today.toDateString(),
      });
    }
    
    return days;
  };

  const handlePrevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  const handleDateClick = (date: Date) => {
    const visits = getVisitsForDate(date);
    if (visits.length > 0) {
      setSelectedDate(date);
      setShowDateDialog(true);
    }
  };

  const monthNames = [
    '一月', '二月', '三月', '四月', '五月', '六月',
    '七月', '八月', '九月', '十月', '十一月', '十二月'
  ];

  const weekDays = ['日', '一', '二', '三', '四', '五', '六'];

  const calendarDays = generateCalendarGrid();
  const monthVisits = getVisitsForMonth(currentDate);

  return (
    <Container maxWidth="lg">
      <Box sx={{ mb: 3 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          拜訪行事曆
        </Typography>
        <Typography variant="body1" color="text.secondary">
          查看你的餐廳拜訪時間軸
        </Typography>
      </Box>

      {/* 月度統計 */}
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
                    本月拜訪次數
                  </Typography>
                  <Typography variant="h4">
                    {monthVisits.length}
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
                    本月總花費
                  </Typography>
                  <Typography variant="h4">
                    NT$ {monthVisits.reduce((sum, visit) => sum + visit.totalSpent, 0).toLocaleString()}
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
                    本月平均評分
                  </Typography>
                  <Typography variant="h4">
                    {monthVisits.length > 0 
                      ? (monthVisits.reduce((sum, visit) => sum + visit.rating, 0) / monthVisits.length).toFixed(1)
                      : '0.0'
                    }
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* 日曆 */}
      <Card>
        <CardContent>
          {/* 月份導航 */}
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
            <IconButton onClick={handlePrevMonth}>
              <ChevronLeft />
            </IconButton>
            <Typography variant="h5">
              {currentDate.getFullYear()}年 {monthNames[currentDate.getMonth()]}
            </Typography>
            <IconButton onClick={handleNextMonth}>
              <ChevronRight />
            </IconButton>
          </Box>

          {/* 星期標題 */}
          <Grid container spacing={1} sx={{ mb: 1 }}>
            {weekDays.map((day) => (
              <Grid xs key={day}>
                <Box sx={{ textAlign: 'center', py: 1 }}>
                  <Typography variant="body2" color="text.secondary">
                    {day}
                  </Typography>
                </Box>
              </Grid>
            ))}
          </Grid>

          {/* 日期網格 */}
          <Grid container spacing={1}>
            {calendarDays.map((day, index) => (
              <Grid xs key={index}>
                <Box
                  sx={{
                    minHeight: 100,
                    border: '1px solid',
                    borderColor: 'divider',
                    borderRadius: 1,
                    p: 1,
                    cursor: day.visits.length > 0 ? 'pointer' : 'default',
                    backgroundColor: day.isToday ? 'primary.light' : 'transparent',
                    opacity: day.isCurrentMonth ? 1 : 0.5,
                    '&:hover': day.visits.length > 0 ? {
                      backgroundColor: 'action.hover',
                    } : {},
                  }}
                  onClick={() => handleDateClick(day.date)}
                >
                  <Typography 
                    variant="body2" 
                    sx={{ 
                      fontWeight: day.isToday ? 'bold' : 'normal',
                      color: day.isToday ? 'primary.contrastText' : 'text.primary'
                    }}
                  >
                    {day.date.getDate()}
                  </Typography>
                  
                  {day.visits.length > 0 && (
                    <Box sx={{ mt: 0.5 }}>
                      {day.visits.slice(0, 2).map((visit) => {
                        const restaurant = restaurants.find(r => r.id === visit.restaurantId);
                        return (
                          <Box key={visit.id} sx={{ display: 'flex', alignItems: 'center', mb: 0.5 }}>
                            <Rating value={visit.rating} readOnly size="small" />
                            <Typography variant="caption" sx={{ ml: 0.5, overflow: 'hidden', textOverflow: 'ellipsis' }}>
                              {restaurant?.name}
                            </Typography>
                          </Box>
                        );
                      })}
                      {day.visits.length > 2 && (
                        <Typography variant="caption" color="text.secondary">
                          +{day.visits.length - 2} 更多
                        </Typography>
                      )}
                    </Box>
                  )}
                </Box>
              </Grid>
            ))}
          </Grid>
        </CardContent>
      </Card>

      {/* 日期詳情對話框 */}
      <Dialog 
        open={showDateDialog} 
        onClose={() => setShowDateDialog(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          {selectedDate && selectedDate.toLocaleDateString('zh-TW')} 的拜訪紀錄
        </DialogTitle>
        <DialogContent>
          {selectedDate && (
            <List>
              {getVisitsForDate(selectedDate).map((visit, index) => {
                const restaurant = restaurants.find(r => r.id === visit.restaurantId);
                return (
                  <React.Fragment key={visit.id}>
                    <ListItem
                      sx={{ cursor: 'pointer' }}
                      onClick={() => {
                        navigate(`/restaurants/${visit.restaurantId}`);
                        setShowDateDialog(false);
                      }}
                    >
                      <ListItemAvatar>
                        <Avatar sx={{ bgcolor: 'primary.main' }}>
                          <Restaurant />
                        </Avatar>
                      </ListItemAvatar>
                      <ListItemText
                        primary={
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Typography variant="h6">
                              {restaurant?.name}
                            </Typography>
                            <Rating value={visit.rating} readOnly size="small" />
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
                    </ListItem>
                    {index < getVisitsForDate(selectedDate).length - 1 && <Divider />}
                  </React.Fragment>
                );
              })}
            </List>
          )}
        </DialogContent>
      </Dialog>
    </Container>
  );
};

export default CalendarPage;
