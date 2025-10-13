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

  // 過濾掉特定欄位，顯示其他動態欄位
  const excludeFields = ['id', 'name', 'category', 'description', 'image_url'];
  const dynamicFields = Object.entries(item).filter(
    ([key]) => !excludeFields.includes(key)
  );

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
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>關閉</Button>
      </DialogActions>
    </Dialog>
  );
}

