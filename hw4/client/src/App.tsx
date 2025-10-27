// import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { AppProvider } from './context/AppContext';
import ProtectedRoute from './components/ProtectedRoute';
import Layout from './components/Layout';
import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import RestaurantListPage from './pages/RestaurantListPage';
import RestaurantSearchPage from './pages/RestaurantSearchPage';
import RestaurantDetailPage from './pages/RestaurantDetailPage';
import VisitRecordsPage from './pages/VisitRecordsPage';
import CalendarPage from './pages/CalendarPage';
import StatsPage from './pages/StatsPage';

// 創建 Material-UI 主題
const theme = createTheme({
  palette: {
    primary: {
      main: '#1976d2',
    },
    secondary: {
      main: '#dc004e',
    },
  },
  typography: {
    fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
  },
});

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <AppProvider>
        <Router>
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route path="*" element={
              <Layout>
                <Routes>
                  <Route path="/" element={<ProtectedRoute><HomePage /></ProtectedRoute>} />
                  <Route path="/restaurants" element={<ProtectedRoute><RestaurantListPage /></ProtectedRoute>} />
                  <Route path="/restaurants/search" element={<ProtectedRoute><RestaurantSearchPage /></ProtectedRoute>} />
                  <Route path="/restaurants/:id" element={<ProtectedRoute><RestaurantDetailPage /></ProtectedRoute>} />
                  <Route path="/visits" element={<ProtectedRoute><VisitRecordsPage /></ProtectedRoute>} />
                  <Route path="/calendar" element={<ProtectedRoute><CalendarPage /></ProtectedRoute>} />
                  <Route path="/stats" element={<ProtectedRoute><StatsPage /></ProtectedRoute>} />
                </Routes>
              </Layout>
            } />
          </Routes>
        </Router>
      </AppProvider>
    </ThemeProvider>
  );
}

export default App;