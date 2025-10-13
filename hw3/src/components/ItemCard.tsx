import {
  Card,
  CardMedia,
  CardContent,
  CardActions,
  Typography,
  Button,
  Chip,
  Box,
  IconButton,
  Checkbox,
} from '@mui/material';
import AddShoppingCartIcon from '@mui/icons-material/AddShoppingCart';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import InfoIcon from '@mui/icons-material/Info';
import CompareIcon from '@mui/icons-material/Compare';
import type { ItemBase } from '../types';

interface ItemCardProps {
  item: ItemBase;
  onAddToContainer: () => void;
  onViewDetails: () => void;
  isInContainer: boolean;
  isComparing?: boolean;
  onToggleCompare?: () => void;
  canAddToCompare?: boolean;
}

export function ItemCard({
  item,
  onAddToContainer,
  onViewDetails,
  isInContainer,
  isComparing = false,
  onToggleCompare,
  canAddToCompare = true,
}: ItemCardProps) {
  return (
    <Card
      sx={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        position: 'relative',
      }}
    >
      {onToggleCompare && (
        <Box sx={{ position: 'absolute', top: 8, right: 8, zIndex: 1 }}>
          <Checkbox
            icon={<CompareIcon />}
            checkedIcon={<CompareIcon color="primary" />}
            checked={isComparing}
            onChange={onToggleCompare}
            disabled={!canAddToCompare && !isComparing}
            aria-label="加入比較"
            sx={{ bgcolor: 'rgba(255,255,255,0.8)', borderRadius: 1 }}
          />
        </Box>
      )}

      <CardMedia
        component="img"
        height="200"
        image={item.image_url || 'https://via.placeholder.com/400x300?text=No+Image'}
        alt={item.name}
        sx={{ objectFit: 'cover' }}
      />

      <CardContent sx={{ flexGrow: 1 }}>
        <Typography gutterBottom variant="h6" component="div" noWrap>
          {item.name}
        </Typography>

        {item.category && (
          <Chip label={item.category} size="small" color="primary" sx={{ mb: 1 }} />
        )}

        {item.description && (
          <Typography
            variant="body2"
            color="text.secondary"
            sx={{
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical',
            }}
          >
            {item.description}
          </Typography>
        )}

        <Box sx={{ mt: 1, display: 'flex', gap: 1, flexWrap: 'wrap' }}>
          {item.price !== undefined && (
            <Chip label={`NT$ ${item.price.toLocaleString()}`} size="small" color="success" />
          )}
          {item.rating !== undefined && (
            <Chip label={`⭐ ${item.rating}`} size="small" />
          )}
          {item.stock !== undefined && (
            <Chip
              label={`庫存: ${item.stock}`}
              size="small"
              color={item.stock > 50 ? 'default' : 'warning'}
            />
          )}
        </Box>
      </CardContent>

      <CardActions sx={{ justifyContent: 'space-between', px: 2, pb: 2 }}>
        <Button
          size="small"
          startIcon={<InfoIcon />}
          onClick={onViewDetails}
          aria-label="查看詳情"
        >
          詳情
        </Button>
        <Button
          size="small"
          variant={isInContainer ? 'outlined' : 'contained'}
          startIcon={isInContainer ? <CheckCircleIcon /> : <AddShoppingCartIcon />}
          onClick={onAddToContainer}
          disabled={isInContainer}
          aria-label={isInContainer ? '已在容器' : '加入容器'}
        >
          {isInContainer ? '已加入' : '加入'}
        </Button>
      </CardActions>
    </Card>
  );
}

