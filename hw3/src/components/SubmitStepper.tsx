import { useState } from 'react';
import {
  Stepper,
  Step,
  StepLabel,
  Button,
  Box,
  Paper,
  Typography,
  Alert,
} from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import type { ItemBase, ContainerEntry } from '../types';
import { ContainerSummary } from './ContainerSummary';

interface SubmitStepperProps {
  entries: ContainerEntry[];
  items: ItemBase[];
  onSubmit: () => void;
  onCancel: () => void;
}

const steps = ['確認項目', '最終檢查', '完成送出'];

export function SubmitStepper({ entries, items, onSubmit, onCancel }: SubmitStepperProps) {
  const [activeStep, setActiveStep] = useState(0);
  const [submitted, setSubmitted] = useState(false);

  const handleNext = () => {
    if (activeStep === steps.length - 1) {
      // 最後一步：送出
      onSubmit();
      setSubmitted(true);
    } else {
      setActiveStep((prev) => prev + 1);
    }
  };

  const handleBack = () => {
    setActiveStep((prev) => prev - 1);
  };

  if (submitted) {
    return (
      <Paper sx={{ p: 4, textAlign: 'center' }}>
        <CheckCircleIcon color="success" sx={{ fontSize: 80, mb: 2 }} />
        <Typography variant="h4" gutterBottom>
          送出成功！
        </Typography>
        <Typography color="text.secondary" paragraph>
          您的記錄已成功提交並儲存。
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
          您可以在「歷史記錄」頁面查看或匯出此記錄。
        </Typography>
      </Paper>
    );
  }

  const getStepContent = (step: number) => {
    switch (step) {
      case 0:
        return (
          <Box>
            <Typography variant="h6" gutterBottom>
              請確認您要送出的項目
            </Typography>
            <ContainerSummary entries={entries} items={items} />
            <Alert severity="info" sx={{ mt: 2 }}>
              提交後將無法直接修改，請仔細確認。
            </Alert>
          </Box>
        );
      case 1:
        return (
          <Box>
            <Typography variant="h6" gutterBottom>
              最終檢查
            </Typography>
            <Typography paragraph>
              • 共 {entries.length} 種項目，總數量{' '}
              {entries.reduce((sum, e) => sum + (e.quantity || 1), 0)} 件
            </Typography>
            <Typography paragraph>
              • 總金額：NT${' '}
              {entries
                .reduce((sum, entry) => {
                  const item = items.find((i) => i.id === entry.itemId);
                  return sum + (item?.price || 0) * (entry.quantity || 1);
                }, 0)
                .toLocaleString()}
            </Typography>
            <Alert severity="warning">
              確認送出後，記錄將被永久儲存。如需修改，可複製此記錄為新容器。
            </Alert>
          </Box>
        );
      case 2:
        return (
          <Typography variant="h6" gutterBottom>
            正在處理您的送出...
          </Typography>
        );
      default:
        return null;
    }
  };

  return (
    <Box>
      <Stepper activeStep={activeStep} sx={{ mb: 4 }}>
        {steps.map((label) => (
          <Step key={label}>
            <StepLabel>{label}</StepLabel>
          </Step>
        ))}
      </Stepper>

      <Paper sx={{ p: 3, mb: 3 }}>{getStepContent(activeStep)}</Paper>

      <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
        <Button onClick={onCancel} disabled={submitted}>
          取消
        </Button>
        <Box>
          <Button disabled={activeStep === 0} onClick={handleBack} sx={{ mr: 1 }}>
            上一步
          </Button>
          <Button variant="contained" onClick={handleNext}>
            {activeStep === steps.length - 1 ? '確認送出' : '下一步'}
          </Button>
        </Box>
      </Box>
    </Box>
  );
}

