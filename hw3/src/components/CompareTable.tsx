import {
  Paper,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
  Typography,
  Box,
  Chip,
  Switch,
  FormControlLabel,
} from '@mui/material';
import { useState } from 'react';
import type { ItemBase } from '../types';

interface CompareTableProps {
  items: ItemBase[];
}

export function CompareTable({ items }: CompareTableProps) {
  const [showDiffOnly, setShowDiffOnly] = useState(false);

  if (items.length === 0) {
    return (
      <Paper sx={{ p: 3, textAlign: 'center' }}>
        <Typography color="text.secondary">請從瀏覽頁面勾選項目進行比較（最多4個）</Typography>
      </Paper>
    );
  }

  // 收集所有欄位
  const allFields = new Set<string>();
  items.forEach((item) => {
    Object.keys(item).forEach((key) => allFields.add(key));
  });

  // 過濾欄位（排除 id、image_url）
  const fields = Array.from(allFields).filter((f) => f !== 'id' && f !== 'image_url');

  // 判斷某欄位是否有差異
  const hasDifference = (field: string) => {
    const values = items.map((item) => item[field]);
    return new Set(values).size > 1;
  };

  // 依據「只顯示差異」模式過濾欄位
  const displayFields = showDiffOnly ? fields.filter(hasDifference) : fields;

  return (
    <Paper sx={{ p: 2 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h6">項目比較</Typography>
        <FormControlLabel
          control={
            <Switch checked={showDiffOnly} onChange={(e) => setShowDiffOnly(e.target.checked)} />
          }
          label="只顯示差異"
        />
      </Box>

      <Box sx={{ overflowX: 'auto' }}>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell sx={{ fontWeight: 'bold', minWidth: 120 }}>欄位</TableCell>
              {items.map((item) => (
                <TableCell key={item.id} align="center" sx={{ minWidth: 150 }}>
                  <Typography variant="subtitle2" fontWeight="bold">
                    {item.name}
                  </Typography>
                  {item.category && <Chip label={item.category} size="small" sx={{ mt: 0.5 }} />}
                </TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {displayFields.map((field) => (
              <TableRow
                key={field}
                sx={{
                  bgcolor: hasDifference(field) ? 'action.hover' : 'transparent',
                }}
              >
                <TableCell component="th" scope="row" sx={{ fontWeight: 'bold' }}>
                  {field}
                </TableCell>
                {items.map((item) => (
                  <TableCell key={item.id} align="center">
                    {typeof item[field] === 'number'
                      ? (item[field] as number).toLocaleString()
                      : String(item[field] ?? '-')}
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Box>
    </Paper>
  );
}

