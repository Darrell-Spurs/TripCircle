import {
  Box,
  FormControl,
  FormLabel,
  FormGroup,
  FormControlLabel,
  Checkbox,
  Button,
  Paper,
  Typography,
  Slider,
} from '@mui/material';
import RefreshIcon from '@mui/icons-material/Refresh';
import type { FilterState } from '../types';

interface CatalogFiltersProps {
  filters: FilterState;
  categories: string[];
  onCategoryToggle: (category: string) => void;
  onPriceRangeChange: (range: [number, number]) => void;
  onRatingMinChange: (rating: number) => void;
  onReset: () => void;
  priceRange: [number, number];
}

export function CatalogFilters({
  filters,
  categories,
  onCategoryToggle,
  onPriceRangeChange,
  onRatingMinChange,
  onReset,
  priceRange,
}: CatalogFiltersProps) {
  return (
    <Paper sx={{ p: 2, mb: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h6">篩選條件</Typography>
        <Button startIcon={<RefreshIcon />} onClick={onReset} size="small">
          重置
        </Button>
      </Box>

      {/* 分類篩選 */}
      {categories.length > 0 && (
        <FormControl component="fieldset" sx={{ mb: 2 }}>
          <FormLabel component="legend">分類</FormLabel>
          <FormGroup row>
            {categories.map((category) => (
              <FormControlLabel
                key={category}
                control={
                  <Checkbox
                    checked={filters.categories.includes(category)}
                    onChange={() => onCategoryToggle(category)}
                  />
                }
                label={category}
              />
            ))}
          </FormGroup>
        </FormControl>
      )}

      {/* 價格區間和最低評分 - 並排顯示 */}
      <Box sx={{ display: 'flex', gap: 3 }}>
        {/* 價格區間 */}
        {priceRange[1] > 0 && (
          <Box sx={{ flex: 1 }}>
            <FormLabel>價格區間</FormLabel>
            <Slider
              value={filters.priceRange || priceRange}
              onChange={(_e, newValue) => onPriceRangeChange(newValue as [number, number])}
              valueLabelDisplay="auto"
              min={priceRange[0]}
              max={priceRange[1]}
              sx={{ mt: 1 }}
            />
            <Typography variant="caption" color="text.secondary">
              NT$ {(filters.priceRange || priceRange)[0].toLocaleString()} - NT${' '}
              {(filters.priceRange || priceRange)[1].toLocaleString()}
            </Typography>
          </Box>
        )}

        {/* 最低評分 */}
        <Box sx={{ flex: 1 }}>
          <FormLabel>最低評分</FormLabel>
          <Slider
            value={filters.ratingMin || 0}
            onChange={(_e, newValue) => onRatingMinChange(newValue as number)}
            valueLabelDisplay="auto"
            min={0}
            max={5}
            step={0.5}
            marks
            sx={{ mt: 1 }}
          />
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 0.5 }}>
            {[0, 1, 2, 3, 4, 5].map((num) => (
              <Typography key={num} variant="caption" color="text.secondary">
                {num}
              </Typography>
            ))}
          </Box>
        </Box>
      </Box>
    </Paper>
  );
}

