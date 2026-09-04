import '@/styles/index.css';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router';
import { ThemeProvider } from '@figma/astraui';
import { CustomerNav } from './components/shared/CustomerNav';
import { Footer } from './components/shared/Footer';
import { HomePage } from './components/customer/HomePage';
import { StoresPage } from './components/customer/StoresPage';
import { StoreProfilePage } from './components/customer/StoreProfilePage';
import { ProductDetailPage } from './components/customer/ProductDetailPage';
import { AuthPage } from './components/customer/AuthPage';
import { CustomerProfilePage } from './components/customer/CustomerProfilePage';
import { PortalLoginPage } from './components/portal/PortalLoginPage';
import { PortalLayout } from './components/portal/PortalLayout';
import { DashboardPage } from './components/portal/DashboardPage';
import { ProductsPage } from './components/portal/ProductsPage';
import { StorePage } from './components/portal/StorePage';
import { EnquiriesPage } from './components/portal/EnquiriesPage';
import { GalleryPage } from './components/portal/GalleryPage';
import { AboutPage } from './components/customer/About';
import {ContactPage} from './components/customer/Contact';
import NearbyStoresPage from './components/customer/NearbyStoresPage';
import { Outlet } from 'react-router';
import CategoriesPage from './components/portal/Category';
import MetalTypesPage from './components/portal/Metaltype';

function CustomerLayout() {
  return (
    <div className="flex flex-col min-h-screen" style={{ fontFamily: 'var(--font-family-sans)' }}>
      <CustomerNav />
      <div className="flex-1">
        <Outlet />
      </div>
      <Footer />
    </div>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <BrowserRouter>
        <Routes>
          {/* Customer Website — shared layout mounted once */}
          <Route element={<CustomerLayout />}>
            <Route path="/" element={<HomePage />} />
            <Route path="/stores" element={<StoresPage />} />
            <Route path="/stores/:storeId" element={<StoreProfilePage />} />
            <Route path="/s/:slug" element={<StoreProfilePage />} /> 
            <Route path="/products/:productId" element={<ProductDetailPage />} />
            ♂<Route path="/profile" element={<CustomerProfilePage />} />
            <Route path="/about" element={<AboutPage />} />
            <Route path="/contact" element={<ContactPage />} />
            <Route path="/nearby-stores" element={<NearbyStoresPage />} />
          </Route>

          {/* No shared nav on auth page */}
          <Route path="/auth" element={<AuthPage />} />

          {/* Portal */}
          <Route path="/portal/login" element={<PortalLoginPage />} />
          <Route path="/portal" element={<PortalLayout />}>
            {/* <Route index element={<DashboardPage />} /> */}
            <Route index element={<ProductsPage />} />
            <Route path="store" element={<StorePage />} />
            <Route path="enquiries" element={<EnquiriesPage />} />
            <Route path="gallery" element={<GalleryPage />} />
            <Route path="categories" element={<CategoriesPage />} />
            <Route path="metal-types" element={<MetalTypesPage />} />
            <Route path="*" element={<Navigate to="/portal" replace />} />
          </Route>

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </ThemeProvider>
  );
}