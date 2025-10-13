import { useState } from 'react';
import {
  Box,
  Typography,
  Button,
  Paper,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
  IconButton,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import FileDownloadIcon from '@mui/icons-material/FileDownload';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import VisibilityIcon from '@mui/icons-material/Visibility';
import { useNavigate } from 'react-router-dom';
import { useRecords } from '../context/RecordsContext';
import { useContainer } from '../context/ContainerContext';
import type { SubmitRecord } from '../types';

export function RecordsPage() {
  const navigate = useNavigate();
  const { records, deleteRecord, exportRecord, exportAllRecords, clearAllRecords } = useRecords();
  const { clearContainer, addItem } = useContainer();

  const [viewingRecord, setViewingRecord] = useState<SubmitRecord | null>(null);

  const handleCopyToContainer = (record: SubmitRecord) => {
    // 清空購物車
    clearContainer();
    // 複製項目到購物車
    record.entries.forEach((entry) => {
      addItem(entry.itemId, entry.quantity || 1);
    });
    // 導向購物車頁
    navigate('/container');
  };

  const handleClearAll = () => {
    if (confirm('確定要清除所有記錄嗎？此操作無法復原。')) {
      clearAllRecords();
    }
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4">歷史記錄</Typography>
        <Box sx={{ display: 'flex', gap: 2 }}>
          {records.length > 0 && (
            <>
              <Button startIcon={<FileDownloadIcon />} onClick={exportAllRecords}>
                匯出全部
              </Button>
              <Button color="error" onClick={handleClearAll}>
                清除全部
              </Button>
            </>
          )}
        </Box>
      </Box>

      {records.length === 0 ? (
        <Alert severity="info">
          尚無記錄。請先從瀏覽頁面加入項目並送出。
          <Button onClick={() => navigate('/')} sx={{ ml: 2 }}>
            前往瀏覽
          </Button>
        </Alert>
      ) : (
        <Paper>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>記錄 ID</TableCell>
                <TableCell>建立時間</TableCell>
                <TableCell align="center">項目數</TableCell>
                <TableCell align="right">總金額</TableCell>
                <TableCell align="center">狀態</TableCell>
                <TableCell align="center">操作</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {records.map((record) => (
                <TableRow key={record.id}>
                  <TableCell>
                    <Typography variant="body2" sx={{ fontFamily: 'monospace' }}>
                      {record.id.slice(0, 8)}...
                    </Typography>
                  </TableCell>
                  <TableCell>{new Date(record.createdAt).toLocaleString()}</TableCell>
                  <TableCell align="center">{record.totalItems || 0}</TableCell>
                  <TableCell align="right">
                    NT$ {(record.totalAmount || 0).toLocaleString()}
                  </TableCell>
                  <TableCell align="center">
                    <Chip label="已送出" color="success" size="small" />
                  </TableCell>
                  <TableCell align="center">
                    <IconButton
                      size="small"
                      onClick={() => setViewingRecord(record)}
                      aria-label="查看"
                    >
                      <VisibilityIcon />
                    </IconButton>
                    <IconButton
                      size="small"
                      onClick={() => exportRecord(record.id)}
                      aria-label="匯出"
                    >
                      <FileDownloadIcon />
                    </IconButton>
                    <IconButton
                      size="small"
                      onClick={() => handleCopyToContainer(record)}
                      aria-label="複製到購物車"
                    >
                      <ContentCopyIcon />
                    </IconButton>
                    <IconButton
                      size="small"
                      color="error"
                      onClick={() => deleteRecord(record.id)}
                      aria-label="刪除"
                    >
                      <DeleteIcon />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Paper>
      )}

      {/* 查看記錄詳情 Dialog */}
      <Dialog
        open={!!viewingRecord}
        onClose={() => setViewingRecord(null)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>記錄詳情</DialogTitle>
        <DialogContent dividers>
          {viewingRecord && (
            <Box>
              <Typography variant="body2" gutterBottom>
                記錄 ID：{viewingRecord.id}
              </Typography>
              <Typography variant="body2" gutterBottom>
                建立時間：{new Date(viewingRecord.createdAt).toLocaleString()}
              </Typography>
              <Typography variant="body2" gutterBottom>
                總金額：NT$ {(viewingRecord.totalAmount || 0).toLocaleString()}
              </Typography>

              <Typography variant="h6" sx={{ mt: 2, mb: 1 }}>
                項目清單：
              </Typography>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>名稱</TableCell>
                    <TableCell align="center">數量</TableCell>
                    <TableCell align="right">單價</TableCell>
                    <TableCell align="right">小計</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {viewingRecord.entries.map((entry) => {
                    const item = viewingRecord.snapshot.find((i) => i.id === entry.itemId);
                    return (
                      <TableRow key={entry.itemId}>
                        <TableCell>{item?.name || entry.itemId}</TableCell>
                        <TableCell align="center">{entry.quantity || 1}</TableCell>
                        <TableCell align="right">
                          NT$ {(item?.price || 0).toLocaleString()}
                        </TableCell>
                        <TableCell align="right">
                          NT$ {((item?.price || 0) * (entry.quantity || 1)).toLocaleString()}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setViewingRecord(null)}>關閉</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

