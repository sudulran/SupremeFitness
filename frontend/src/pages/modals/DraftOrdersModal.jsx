import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  List,
  ListItem,
  ListItemText,
  Typography,
  Divider
} from '@mui/material';

const DraftOrdersModal = ({ open, handleClose, draftOrders, products }) => {
  const getProductName = (productId) => {
    const product = products.find(p => p._id === productId);
    return product ? product.name : 'Unknown Product';
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle>Draft Orders</DialogTitle>
      <DialogContent dividers>
        {draftOrders.length === 0 ? (
          <Typography>No draft orders found.</Typography>
        ) : (
          draftOrders.map((order, idx) => (
            <div key={order._id}>
              <Typography variant="subtitle1" gutterBottom>
                Order #{idx + 1} – Total: ${order.value.toFixed(2)}
              </Typography>
              <List dense>
                {order.items.map(item => (
                  <ListItem key={item._id}>
                    <ListItemText
                      primary={`${getProductName(item.product)} × ${item.quantity}`}
                    />
                  </ListItem>
                ))}
              </List>
              {idx < draftOrders.length - 1 && <Divider sx={{ my: 2 }} />}
            </div>
          ))
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose} variant="outlined">
          Close
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default DraftOrdersModal;
