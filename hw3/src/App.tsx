import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { CssBaseline, ThemeProvider, createTheme } from '@mui/material';
import { DataProvider } from './context/DataContext';
import { ContainerProvider } from './context/ContainerContext';
import { RecordsProvider } from './context/RecordsContext';
import { LayoutShell } from './components/LayoutShell';
import { BrowsePage } from './pages/BrowsePage';
import { ContainerPage } from './pages/ContainerPage';
import { SubmitPage } from './pages/SubmitPage';
import { RecordsPage } from './pages/RecordsPage';

const theme = createTheme({
  palette: {
    primary: {
      main: '#1976d2',
    },
    secondary: {
      main: '#dc004e',
    },
  },
});

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <BrowserRouter>
        <DataProvider>
          <ContainerProvider>
            <RecordsProvider>
              <LayoutShell>
                <Routes>
                  <Route path="/" element={<BrowsePage />} />
                  <Route path="/container" element={<ContainerPage />} />
                  <Route path="/submit" element={<SubmitPage />} />
                  <Route path="/records" element={<RecordsPage />} />
                </Routes>
              </LayoutShell>
            </RecordsProvider>
          </ContainerProvider>
        </DataProvider>
      </BrowserRouter>
    </ThemeProvider>
  );
}

export default App;

