import { useEffect } from 'react';
import { Box, Typography, Button, Alert } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { useData } from '../context/DataContext';
import { useContainer } from '../context/ContainerContext';
import { useRecords } from '../context/RecordsContext';
import { SubmitStepper } from '../components/SubmitStepper';

export function SubmitPage() {
  const navigate = useNavigate();
  const { items } = useData();
  const { entries, clearContainer } = useContainer();
  const { createRecord } = useRecords();

  // 若購物車為空，重導向至購物車頁
  useEffect(() => {
    if (entries.length === 0) {
      navigate('/container');
    }
  }, [entries.length, navigate]);

  const handleSubmit = () => {
    // 建立記錄
    createRecord(entries, items);
    // 清空購物車
    clearContainer();
    // 3 秒後導向記錄頁
    setTimeout(() => {
      navigate('/records');
    }, 3000);
  };

  const handleCancel = () => {
    navigate('/container');
  };

  if (entries.length === 0) {
    return (
      <Alert severity="warning">
        購物車為空，無法送出。
        <Button onClick={() => navigate('/container')} sx={{ ml: 2 }}>
          返回購物車
        </Button>
      </Alert>
    );
  }

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4">送出記錄</Typography>
        <Button startIcon={<ArrowBackIcon />} onClick={() => navigate('/container')}>
          返回購物車
        </Button>
      </Box>

      <Alert severity="warning" sx={{ mb: 3 }}>
        提交後記錄將永久儲存，無法直接修改。如需變更，可複製記錄為新購物車。
      </Alert>

      <SubmitStepper
        entries={entries}
        items={items}
        onSubmit={handleSubmit}
        onCancel={handleCancel}
      />
    </Box>
  );
}

