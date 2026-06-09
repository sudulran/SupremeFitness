import React, { useState, useEffect } from 'react';
import {
  Box,
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  Tooltip,
  IconButton
} from '@mui/material';
import {
  History as HistoryIcon,
  Event as AppointmentIcon,
  TrendingUp as ProgressIcon,
  Menu as MenuIcon,
  Receipt as DraftOrdersIcon
} from '@mui/icons-material';
import { useNavigate, useLocation } from 'react-router-dom';
import DraftOrders from '../pages/DraftOrders';

const EXPANDED_WIDTH = 240;

const menuItems = [
  {
    title: 'Purchase History',
    icon: <HistoryIcon />,
    path: '/user-purchase-summary',
    description: 'View your purchase history'
  },
  {
    title: 'My Appointments',
    icon: <AppointmentIcon />,
    path: '/user-my-appointments',
    description: 'Manage your appointments'
  },
  {
    title: 'My Progress',
    icon: <ProgressIcon />,
    path: '/user-progress-dashboard',
    description: 'Track your fitness progress'
  },
  {
    title: 'My Draft Orders',
    icon: <DraftOrdersIcon />,
    path: '/my-draft-orders',
    description: 'View your draft orders'
  },
];

const UserSidebar = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const handleNavigation = (path) => {
    navigate(path);
  };

  const isActivePage = (path) => location.pathname === path;

  return (
    <Drawer
      variant="permanent"
      sx={{
        width: EXPANDED_WIDTH,
        flexShrink: 0,
        '& .MuiDrawer-paper': {
          width: EXPANDED_WIDTH,
          boxSizing: 'border-box',
          background: 'linear-gradient(180deg, #dc2626 0%, #000000 30%, #000000 100%)',
          color: '#ffffff',
          overflowX: 'hidden',
          border: 'none',
          boxShadow: '4px 0 20px rgba(0, 0, 0, 0.3)'
        }
      }}
    >
      <Box sx={{ pt: 2 }}>
        <Box sx={{ px: 2, pb: 2, borderBottom: '1px solid rgba(255, 255, 255, 0.1)' }}>
          <h2 style={{ 
            color: '#ffffff', 
            margin: 1, 
            fontSize: '1.5rem',
            fontWeight: '600'
          }}>
            User Panel
          </h2>
        </Box>
        
        <List>
          {menuItems.map((item) => {
            const isActive = isActivePage(item.path);
            return (
              <ListItem key={item.title} disablePadding>
                <Tooltip title={item.description} placement="right" arrow>
                  <ListItemButton
                    onClick={() => handleNavigation(item.path)}
                    sx={{
                      borderRadius: 2,
                      justifyContent: 'flex-start',
                      mx: 1,
                      my: 0.5,
                      py: 1.5,
                      px: 2,
                      background: isActive ? 'rgba(220, 38, 38, 0.2)' : 'transparent',
                      border: isActive ? '1px solid rgba(220, 38, 38, 0.5)' : '1px solid transparent',
                      '&:hover': {
                        background: 'rgba(220, 38, 38, 0.15)',
                        transform: 'scale(1.05)'
                      },
                      '&:active': {
                        transform: 'scale(0.95)'
                      },
                      transition: 'all 0.3s ease',
                      color: isActive ? '#dc2626' : '#ffffff',
                      fontWeight: isActive ? '600' : '400',
                      fontSize: '1rem',
                    }}
                  >
                    <ListItemIcon
                      sx={{
                        color: isActive ? '#dc2626' : '#ffffff',
                        minWidth: 40,
                        justifyContent: 'center'
                      }}
                    >
                      {item.icon}
                    </ListItemIcon>
                    {item.title}
                  </ListItemButton>
                </Tooltip>
              </ListItem>
            );
          })}
        </List>
      </Box>
    </Drawer>
  );
};

export default UserSidebar;