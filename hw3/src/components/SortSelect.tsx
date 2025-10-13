import { FormControl, InputLabel, Select, MenuItem } from '@mui/material';
import type { SortOption } from '../types';

interface SortSelectProps {
  value: string;
  onChange: (field: string, order: 'asc' | 'desc') => void;
}

const sortOptions: SortOption[] = [
  { value: 'default', label: '預設排序', field: '', order: 'asc' },
  { value: 'price-asc', label: '價格：低到高', field: 'price', order: 'asc' },
  { value: 'price-desc', label: '價格：高到低', field: 'price', order: 'desc' },
  { value: 'rating-desc', label: '評分：高到低', field: 'rating', order: 'desc' },
  { value: 'rating-asc', label: '評分：低到高', field: 'rating', order: 'asc' },
  { value: 'stock-desc', label: '庫存：多到少', field: 'stock', order: 'desc' },
];

export function SortSelect({ value, onChange }: SortSelectProps) {
  const handleChange = (sortValue: string) => {
    const option = sortOptions.find((opt) => opt.value === sortValue);
    if (option) {
      onChange(option.field, option.order);
    }
  };

  return (
    <FormControl size="small" sx={{ minWidth: 200 }}>
      <InputLabel id="sort-select-label">排序方式</InputLabel>
      <Select
        labelId="sort-select-label"
        id="sort-select"
        value={value}
        label="排序方式"
        onChange={(e) => handleChange(e.target.value)}
      >
        {sortOptions.map((option) => (
          <MenuItem key={option.value} value={option.value}>
            {option.label}
          </MenuItem>
        ))}
      </Select>
    </FormControl>
  );
}

