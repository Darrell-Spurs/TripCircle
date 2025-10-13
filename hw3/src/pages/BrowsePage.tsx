import { useState, useMemo } from 'react';
import { Box, Grid, Typography, Button, Alert, CircularProgress, Pagination, Select, MenuItem, FormControl, InputLabel } from '@mui/material';
import RefreshIcon from '@mui/icons-material/Refresh';
import { useData } from '../context/DataContext';
import { useContainer } from '../context/ContainerContext';
import { useFilters } from '../hooks/useFilters';
import { getNumericRange } from '../utils/csvParser';
import { ItemCard } from '../components/ItemCard';
import { ItemDetailsDialog } from '../components/ItemDetailsDialog';
import { CatalogFilters } from '../components/CatalogFilters';
import { SortSelect } from '../components/SortSelect';
import type { ItemBase } from '../types';

export function BrowsePage() {
  const { items, categories, loadState, reloadData } = useData();
  const { addItem, hasItem } = useContainer();

  const [selectedItem, setSelectedItem] = useState<ItemBase | null>(null);
  const [page, setPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  // 篩選與排序
  const {
    filters,
    filteredItems,
    toggleCategory,
    setPriceRange,
    setRatingMin,
    setSortBy,
    resetFilters,
  } = useFilters(items);

  // 價格區間
  const priceRange = useMemo(() => getNumericRange(items, 'price'), [items]);

  // 分頁
  const totalPages = Math.ceil(filteredItems.length / itemsPerPage);
  const paginatedItems = useMemo(() => {
    const start = (page - 1) * itemsPerPage;
    return filteredItems.slice(start, start + itemsPerPage);
  }, [filteredItems, page, itemsPerPage]);

  const handleAddToContainer = (itemId: string) => {
    addItem(itemId, 1);
  };

  const handlePageChange = (_event: React.ChangeEvent<unknown>, value: number) => {
    setPage(value);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleItemsPerPageChange = (value: number) => {
    setItemsPerPage(value);
    setPage(1); // Reset to first page when changing items per page
  };

  const currentSortValue = filters.sortBy
    ? `${filters.sortBy}-${filters.sortOrder}`
    : 'default';

  if (loadState.loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 400 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (loadState.error) {
    return (
      <Alert severity="error" sx={{ mb: 2 }}>
        載入資料失敗：{loadState.error}
        <Button onClick={reloadData} sx={{ ml: 2 }}>
          重試
        </Button>
      </Alert>
    );
  }

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4">瀏覽商品</Typography>
        <Button startIcon={<RefreshIcon />} onClick={reloadData}>
          重新載入
        </Button>
      </Box>

      <CatalogFilters
        filters={filters}
        categories={categories}
        onCategoryToggle={toggleCategory}
        onPriceRangeChange={setPriceRange}
        onRatingMinChange={setRatingMin}
        onReset={resetFilters}
        priceRange={priceRange}
      />

      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="body2" color="text.secondary">
          顯示 {paginatedItems.length} / {filteredItems.length} 項目
        </Typography>
        <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
          <FormControl size="small" sx={{ minWidth: 120 }}>
            <InputLabel>每頁顯示</InputLabel>
            <Select
              value={itemsPerPage}
              label="每頁顯示"
              onChange={(e) => handleItemsPerPageChange(e.target.value as number)}
            >
              <MenuItem value={5}>5 項</MenuItem>
              <MenuItem value={10}>10 項</MenuItem>
              <MenuItem value={20}>20 項</MenuItem>
              <MenuItem value={50}>50 項</MenuItem>
            </Select>
          </FormControl>
          <SortSelect value={currentSortValue} onChange={setSortBy} />
        </Box>
      </Box>

      {filteredItems.length === 0 ? (
        <Alert severity="info">找不到符合條件的項目</Alert>
      ) : (
        <>
          <Grid container spacing={3}>
            {paginatedItems.map((item) => (
              <Grid item xs={12} sm={6} md={4} lg={3} key={item.id}>
                <ItemCard
                  item={item}
                  onAddToContainer={() => handleAddToContainer(item.id)}
                  onViewDetails={() => setSelectedItem(item)}
                  isInContainer={hasItem(item.id)}
                />
              </Grid>
            ))}
          </Grid>

          {totalPages > 1 && (
            <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
              <Pagination count={totalPages} page={page} onChange={handlePageChange} />
            </Box>
          )}
        </>
      )}

      <ItemDetailsDialog
        item={selectedItem}
        open={!!selectedItem}
        onClose={() => setSelectedItem(null)}
      />
    </Box>
  );
}

