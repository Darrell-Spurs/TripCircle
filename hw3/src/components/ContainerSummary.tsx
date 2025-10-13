import { Paper, Typography, Box, Divider, Alert } from '@mui/material';
import type { ItemBase, ContainerEntry } from '../types';

interface ContainerSummaryProps {
  entries: ContainerEntry[];
  items: ItemBase[];
}

export function ContainerSummary({ entries, items }: ContainerSummaryProps) {
  const totalItems = entries.reduce((sum, entry) => sum + (entry.quantity || 1), 0);

  const totalAmount = entries.reduce((sum, entry) => {
    const item = items.find((i) => i.id === entry.itemId);
    const price = item?.price || 0;
    const quantity = entry.quantity || 1;
    return sum + price * quantity;
  }, 0);

  // 檢查庫存不足
  const lowStockItems = entries.filter((entry) => {
    const item = items.find((i) => i.id === entry.itemId);
    const quantity = entry.quantity || 1;
    return item?.stock !== undefined && item.stock < quantity;
  });

  return (
    <Paper sx={{ p: 2 }}>
      <Typography variant="h6" gutterBottom>
        容器摘要
      </Typography>

      <Box sx={{ my: 2 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
          <Typography>項目種類：</Typography>
          <Typography fontWeight="bold">{entries.length}</Typography>
        </Box>

        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
          <Typography>項目總數：</Typography>
          <Typography fontWeight="bold">{totalItems}</Typography>
        </Box>

        <Divider sx={{ my: 1 }} />

        <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
          <Typography variant="h6">總金額：</Typography>
          <Typography variant="h6" color="primary" fontWeight="bold">
            NT$ {totalAmount.toLocaleString()}
          </Typography>
        </Box>
      </Box>

      {lowStockItems.length > 0 && (
        <Alert severity="warning" sx={{ mt: 2 }}>
          {lowStockItems.length} 個項目庫存不足
        </Alert>
      )}
    </Paper>
  );
}

