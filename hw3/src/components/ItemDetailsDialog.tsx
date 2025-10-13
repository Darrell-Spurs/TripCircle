import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  Chip,
  Table,
  TableBody,
  TableRow,
  TableCell,
} from '@mui/material';
import type { ItemBase } from '../types';

interface ItemDetailsDialogProps {
  item: ItemBase | null;
  open: boolean;
  onClose: () => void;
}

export function ItemDetailsDialog({ item, open, onClose }: ItemDetailsDialogProps) {
  if (!item) return null;

  // 過濾掉特定欄位，顯示其他動態欄位（排除 price, rating, stock）
  const excludeFields = ['id', 'name', 'category', 'description', 'image_url', 'price', 'rating', 'stock'];
  const dynamicFields = Object.entries(item).filter(
    ([key]) => !excludeFields.includes(key)
  );

  // 判斷是否為高評分
  const isHighRating = item.rating !== undefined && item.rating >= 4.8;

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>{item.name}</DialogTitle>
      <DialogContent dividers>
        {item.image_url && (
          <Box sx={{ mb: 2, textAlign: 'center' }}>
            <img
              src={item.image_url}
              alt={item.name}
              style={{ maxWidth: '100%', maxHeight: 400, objectFit: 'contain' }}
            />
          </Box>
        )}

        {item.category && (
          <Box sx={{ mb: 2 }}>
            <Chip label={item.category} color="primary" />
          </Box>
        )}

        {item.description && (
          <Typography variant="body1" paragraph>
            {item.description}
          </Typography>
        )}

        {dynamicFields.length > 0 && (
          <Table size="small">
            <TableBody>
              {dynamicFields.map(([key, value]) => (
                <TableRow key={key}>
                  <TableCell component="th" scope="row" sx={{ fontWeight: 'bold' }}>
                    {key}
                  </TableCell>
                  <TableCell>
                    {typeof value === 'number'
                      ? value.toLocaleString()
                      : String(value ?? '-')}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}

        {/* 價格、庫存、評分資訊 */}
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 2,
            mt: 3,
            pt: 2,
            borderTop: '1px solid',
            borderColor: 'divider',
          }}
        >
          {/* 價格 */}
          {item.price !== undefined && (
            <Typography variant="h5" color="primary" sx={{ fontWeight: 'bold' }}>
              NT$ {item.price.toLocaleString()}
            </Typography>
          )}

          {/* 庫存 */}
          {item.stock !== undefined && (
            <Typography variant="body1" color="text.secondary">
              剩餘：{item.stock} 件
            </Typography>
          )}

          {/* 評分 */}
          {item.rating !== undefined && (
            <Box
              sx={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 0.5,
                px: 1.5,
                py: 0.5,
                borderRadius: 10,
                backgroundColor: isHighRating ? '#ffd700' : 'transparent',
                border: isHighRating ? '2px solid #ffa500' : 'none',
              }}
            >
              <Typography
                variant="body1"
                sx={{
                  fontWeight: isHighRating ? 'bold' : 'normal',
                  color: isHighRating ? '#b8860b' : 'text.primary',
                }}
              >
                {item.rating} ⭐
              </Typography>
            </Box>
          )}
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>關閉</Button>
      </DialogActions>
    </Dialog>
  );
}

