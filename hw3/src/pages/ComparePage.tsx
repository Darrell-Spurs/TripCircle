import { Box, Typography, Button, Alert } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { useData } from '../context/DataContext';
import { useCompare } from '../hooks/useCompare';
import { CompareTable } from '../components/CompareTable';

export function ComparePage() {
  const navigate = useNavigate();
  const { items } = useData();
  const { compareIds, clearCompare } = useCompare(4);

  const compareItems = items.filter((item) => compareIds.includes(item.id));

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4">項目比較</Typography>
        <Box sx={{ display: 'flex', gap: 2 }}>
          {compareIds.length > 0 && (
            <Button onClick={clearCompare}>清除比較</Button>
          )}
          <Button startIcon={<ArrowBackIcon />} onClick={() => navigate('/')}>
            返回瀏覽
          </Button>
        </Box>
      </Box>

      {compareIds.length === 0 ? (
        <Alert severity="info">
          尚未選擇比較項目。請回到瀏覽頁面勾選項目（最多4個）。
          <Button onClick={() => navigate('/')} sx={{ ml: 2 }}>
            前往瀏覽
          </Button>
        </Alert>
      ) : (
        <CompareTable items={compareItems} />
      )}
    </Box>
  );
}

