import {
  Box,
  Paper,
  Typography,
  List,
  ListItem,
  IconButton,
  TextField,
  Button,
  Avatar,
  Divider,
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
import RemoveIcon from '@mui/icons-material/Remove';
import type { ItemBase, ContainerEntry } from '../types';

interface ContainerPanelProps {
  entries: ContainerEntry[];
  items: ItemBase[];
  onUpdateQuantity: (itemId: string, quantity: number) => void;
  onUpdateNote: (itemId: string, note: string) => void;
  onRemove: (itemId: string) => void;
}

export function ContainerPanel({
  entries,
  items,
  onUpdateQuantity,
  onUpdateNote,
  onRemove,
}: ContainerPanelProps) {
  if (entries.length === 0) {
    return (
      <Paper sx={{ p: 3, textAlign: 'center' }}>
        <Typography color="text.secondary">購物車為空，請從瀏覽頁面加入項目</Typography>
      </Paper>
    );
  }

  return (
    <Paper sx={{ p: 2 }}>
      <List>
        {entries.map((entry, index) => {
          const item = items.find((i) => i.id === entry.itemId);
          if (!item) return null;

          return (
            <Box key={entry.itemId}>
              {index > 0 && <Divider />}
              <ListItem
                sx={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'stretch',
                  py: 2,
                }}
              >
                <Box sx={{ display: 'flex', gap: 2, width: '100%', mb: 1 }}>
                  <Avatar
                    src={item.image_url}
                    alt={item.name}
                    variant="rounded"
                    sx={{ width: 80, height: 80 }}
                  />

                  <Box sx={{ flexGrow: 1 }}>
                    <Typography variant="h6">{item.name}</Typography>
                    {item.category && (
                      <Typography variant="body2" color="text.secondary">
                        {item.category}
                      </Typography>
                    )}
                    {item.price !== undefined && (
                      <Typography variant="body1" color="primary" fontWeight="bold">
                        NT$ {item.price.toLocaleString()}
                      </Typography>
                    )}
                  </Box>

                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <IconButton
                      size="small"
                      onClick={() => onUpdateQuantity(entry.itemId, (entry.quantity || 1) - 1)}
                      aria-label="減少數量"
                    >
                      <RemoveIcon />
                    </IconButton>
                    <Typography sx={{ minWidth: 40, textAlign: 'center' }}>
                      {entry.quantity || 1}
                    </Typography>
                    <IconButton
                      size="small"
                      onClick={() => onUpdateQuantity(entry.itemId, (entry.quantity || 1) + 1)}
                      aria-label="增加數量"
                    >
                      <AddIcon />
                    </IconButton>
                  </Box>

                  <IconButton
                    color="error"
                    onClick={() => onRemove(entry.itemId)}
                    aria-label="移除項目"
                  >
                    <DeleteIcon />
                  </IconButton>
                </Box>

                <TextField
                  fullWidth
                  size="small"
                  label="備註"
                  placeholder="新增備註..."
                  value={entry.note || ''}
                  onChange={(e) => onUpdateNote(entry.itemId, e.target.value)}
                />
              </ListItem>
            </Box>
          );
        })}
      </List>
    </Paper>
  );
}

