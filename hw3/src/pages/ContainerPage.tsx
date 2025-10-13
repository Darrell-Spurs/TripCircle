import { Box, Typography, Button, Alert } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import DeleteIcon from '@mui/icons-material/Delete';
import SendIcon from '@mui/icons-material/Send';
import { useData } from '../context/DataContext';
import { useContainer } from '../context/ContainerContext';
import { ContainerPanel } from '../components/ContainerPanel';
import { ContainerSummary } from '../components/ContainerSummary';

export function ContainerPage() {
  const navigate = useNavigate();
  const { items } = useData();
  const { entries, updateQuantity, updateNote, removeItem, clearContainer } = useContainer();

  const handleSubmit = () => {
    if (entries.length === 0) {
      alert('容器為空，無法送出');
      return;
    }
    navigate('/submit');
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4">暫存容器</Typography>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <Button
            startIcon={<DeleteIcon />}
            color="error"
            onClick={clearContainer}
            disabled={entries.length === 0}
          >
            清空容器
          </Button>
          <Button
            startIcon={<SendIcon />}
            variant="contained"
            onClick={handleSubmit}
            disabled={entries.length === 0}
          >
            送出記錄
          </Button>
        </Box>
      </Box>

      <Alert severity="info" sx={{ mb: 3 }}>
        這是暫存區域，您可以隨時新增、修改或移除項目。送出後將建立正式記錄。
      </Alert>

      <Box sx={{ display: 'flex', gap: 3, flexDirection: { xs: 'column', md: 'row' } }}>
        <Box sx={{ flex: 1 }}>
          <ContainerPanel
            entries={entries}
            items={items}
            onUpdateQuantity={updateQuantity}
            onUpdateNote={updateNote}
            onRemove={removeItem}
          />
        </Box>

        <Box sx={{ width: { xs: '100%', md: 320 } }}>
          <ContainerSummary entries={entries} items={items} />
        </Box>
      </Box>
    </Box>
  );
}

