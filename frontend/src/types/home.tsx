export interface Branch {
  id: string;
  name: string;
  city: string;
  state: string;
  address: string;
}

export interface Store {
  id: string;
  name: string;
  logo: string;
  coverBanner?: string;
  about?: string;
  branches?: Branch[];
}

export interface StoreAdminApiItem {
  id: string;
  name: string;
  email: string;
  status: string;
  store: Store | null;
}

export interface ProcessedStore {
  id: string;
  name: string;
  logo: string;
  city: string;
  coverBanner?: string;
  about?: string;
  branches?: Branch[];
}

export interface Product {
  id: string;
  name: string;
  category: string;
  metalType: string;
  purity?: string;
  weight?: string;
  description: string;
  featured: boolean;
  displayOrder?: number;
  images: string[];
  views?: number;
  storeId?: string;
  storeName?: string | null;
  storeLogo?: string | null;
  createdAt?: string;
  updatedAt?: string;
}