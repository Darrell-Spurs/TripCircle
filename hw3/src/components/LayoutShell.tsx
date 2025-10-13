import { useState } from 'react';
import {
  AppBar,
  Toolbar,
  Typography,
  IconButton,
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Badge,
  Box,
  Container,
} from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart';
import ViewListIcon from '@mui/icons-material/ViewList';
import HistoryIcon from '@mui/icons-material/History';
import { useNavigate, useLocation } from 'react-router-dom';
import { useContainer } from '../context/ContainerContext';

interface LayoutShellProps {
  children: React.ReactNode;
}

export function LayoutShell({ children }: LayoutShellProps) {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { getTotalItems } = useContainer();

  const menuItems = [
    { text: '瀏覽商品', icon: <ViewListIcon />, path: '/' },
    { text: '購物車', icon: <ShoppingCartIcon />, path: '/container' },
    { text: '歷史記錄', icon: <HistoryIcon />, path: '/records' },
  ];

  const handleNavigation = (path: string) => {
    navigate(path);
    setDrawerOpen(false);
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <AppBar position="sticky">
        <Toolbar>
          <IconButton
            color="inherit"
            edge="start"
            onClick={() => setDrawerOpen(true)}
            sx={{ mr: 2 }}
            aria-label="開啟選單"
          >
            <MenuIcon />
          </IconButton>
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            商品目錄系統
          </Typography>
          <IconButton
            color="inherit"
            onClick={() => navigate('/container')}
            aria-label="前往購物車"
          >
            <Badge badgeContent={getTotalItems()} color="error">
              <ShoppingCartIcon />
            </Badge>
          </IconButton>
        </Toolbar>
      </AppBar>

      <Drawer anchor="left" open={drawerOpen} onClose={() => setDrawerOpen(false)}>
        <Box sx={{ width: 250 }} role="presentation">
          <List>
            {menuItems.map((item) => (
              <ListItem key={item.path} disablePadding>
                <ListItemButton
                  selected={location.pathname === item.path}
                  onClick={() => handleNavigation(item.path)}
                >
                  <ListItemIcon>{item.icon}</ListItemIcon>
                  <ListItemText primary={item.text} />
                </ListItemButton>
              </ListItem>
            ))}
          </List>
        </Box>
      </Drawer>

      <Container component="main" maxWidth="xl" sx={{ flexGrow: 1, py: 3 }}>
        {children}
      </Container>

      <Box component="footer" sx={{ py: 2, textAlign: 'center', bgcolor: 'grey.200' }}>
        <Typography variant="body2" color="text.secondary">
          © 2025 商品目錄系統 - 純前端示範
        </Typography>
      </Box>
    </Box>
  );
}

