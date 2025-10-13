import { useState, useMemo } from 'react';
import { Box, Grid, Typography, Button, Alert, CircularProgress, Pagination } from '@mui/material';
import RefreshIcon from '@mui/icons-material/Refresh';
import { useNavigate } from 'react-router-dom';
import { useData } from '../context/DataContext';
import { useContainer } from '../context/ContainerContext';
import { useFilters } from '../hooks/useFilters';
import { useCompare } from '../hooks/useCompare';
import { getNumericRange } from '../utils/csvParser';
import { ItemCard } from '../components/ItemCard';
import { ItemDetailsDialog } from '../components/ItemDetailsDialog';
import { CatalogFilters } from '../components/CatalogFilters';
import { SortSelect } from '../components/SortSelect';
import type { ItemBase } from '../types';

const ITEMS_PER_PAGE = 12;

export function BrowsePage() {
  const navigate = useNavigate();
  const { items, categories, loadState, reloadData } = useData();
  const { addItem, hasItem } = useContainer();
  const { compareIds, toggleCompare, isComparing, canAddMore } = useCompare(4);

  const [selectedItem, setSelectedItem] = useState<ItemBase | null>(null);
  const [page, setPage] = useState(1);

  // 篩選與排序
  const {
    filters,
    filteredItems,
    setKeyword,
    toggleCategory,
    setPriceRange,
    setRatingMin,
    setSortBy,
    resetFilters,
    isFiltering,
  } = useFilters(items);

  // 價格區間
  const priceRange = useMemo(() => getNumericRange(items, 'price'), [items]);

  // 分頁
  const totalPages = Math.ceil(filteredItems.length / ITEMS_PER_PAGE);
  const paginatedItems = useMemo(() => {
    const start = (page - 1) * ITEMS_PER_PAGE;
    return filteredItems.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredItems, page]);

  const handleAddToContainer = (itemId: string) => {
    addItem(itemId, 1);
  };

  const handlePageChange = (_event: React.ChangeEvent<unknown>, value: number) => {
    setPage(value);
    window.scrollTo({ top: 0, behavior: 'smooth' });
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
        <Typography variant="h4">瀏覽項目</Typography>
        <Box sx={{ display: 'flex', gap: 2 }}>
          {compareIds.length > 0 && (
            <Button variant="outlined" onClick={() => navigate('/compare')}>
              比較 ({compareIds.length})
            </Button>
          )}
          <Button startIcon={<RefreshIcon />} onClick={reloadData}>
            重新載入
          </Button>
        </Box>
      </Box>

      {loadState.lastUpdated && (
        <Typography variant="caption" color="text.secondary" sx={{ mb: 2, display: 'block' }}>
          最後更新：{new Date(loadState.lastUpdated).toLocaleString()}
        </Typography>
      )}

      <CatalogFilters
        filters={filters}
        categories={categories}
        onKeywordChange={setKeyword}
        onCategoryToggle={toggleCategory}
        onPriceRangeChange={setPriceRange}
        onRatingMinChange={setRatingMin}
        onReset={resetFilters}
        priceRange={priceRange}
        isFiltering={isFiltering}
      />

      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="body2" color="text.secondary">
          顯示 {paginatedItems.length} / {filteredItems.length} 項目
        </Typography>
        <SortSelect value={currentSortValue} onChange={setSortBy} />
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
                  isComparing={isComparing(item.id)}
                  onToggleCompare={() => toggleCompare(item.id)}
                  canAddToCompare={canAddMore}
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

