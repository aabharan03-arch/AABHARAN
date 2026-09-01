import cover from "../asserts/cover2.jpeg"
import cover1 from "../asserts/cover1.jpeg"
import cover3 from "../asserts/cover3.jpg"
import cover4 from "../asserts/cover4.jpg"
import cover5 from "../asserts/cover5.jpg"



export interface Branch {
  id: string;
  name: string;
  managerName: string;
  phone: string;
  whatsapp: string;
  address: string;
  city: string;
  state: string;
  pincode: string;
  lat: number;
  lng: number;
  mapUrl: string;
}

export interface Store {
  id: string;
  name: string;
  slug: string;
  logo: string;
  coverBanner: string;
  about: string;
  contactNumber: string;
  whatsapp: string;
  email: string;
  website: string;
  socialLinks: { instagram?: string; facebook?: string };
  branches: Branch[];
  gallery: string[];
  featured: boolean;
  city: string;
  distance?: number;
}

export interface Product {
  id: string;
  storeId: string;
  storeName: string;
  storeLogo: string;
  name: string;
  category: string;
  metalType: string;
  purity: string;
  weight?: string;
  description: string;
  images: string[];
  featured: boolean;
  displayOrder: number;
  views: number;
}

export interface Enquiry {
  id: string;
  customerName: string;
  email: string;
  phone: string;
  productId: string;
  productName: string;
  message: string;
  date: string;
  status: 'New' | 'In Progress' | 'Contacted' | 'Closed';
}

export const CATEGORIES = [
  'All',
  'Rings',
  'Earrings',
  'Bali',
  'Chain',
  'Pendants',
  'Pendant Set',
  'Mangalsutra',
  'Spectacles',
  'Chain Set',
  'Necklace',
  'Bangles',
  'Nose Pins/Rings',
  'Maang Tikka',
  'Bracelets',
  'Ear Chain',
  'Armlet',
  'Long Set',
  'Kamarband',
  'Anklet / Toe Rings',
  'Gents Kada / Bracelets',
  'Watches',
  'Cufflinks',
  'Coins',
  'Others',
  'Pen',
  'Electroforming Jewellery',
];

export const METAL_TYPES = [
  'All', '22K Gold', '24K Gold', '18K Gold', 'Silver', 'Sterling Silver',
  'Diamond', 'Platinum',
];

export const STORES: Store[] = [
  {
    id: '1',
    name: 'Tanishq',
    slug: 'tanishq',
    logo: 'https://images.unsplash.com/photo-1611107683227-e9060eccd846?w=200&h=200&fit=crop&q=80',
    coverBanner: 'https://images.unsplash.com/photo-1633934542430-0905ccb5f050?w=1200&h=400&fit=crop&q=80',
    about: 'Tanishq is India\'s most trusted jewellery brand, offering an exquisite range of gold, diamond, and platinum jewellery for every occasion.',
    contactNumber: '+91 9876543210',
    whatsapp: '+91 9876543210',
    email: 'care@tanishq.co.in',
    website: 'https://www.tanishq.co.in',
    socialLinks: { instagram: '@tanishq', facebook: 'TanishqJewellery' },
    branches: [
      { id: 'b1', name: 'Connaught Place', managerName: 'Ravi Kumar', phone: '+91 11 2341 5678', whatsapp: '+91 9876501234', address: 'Shop 14, Block A, Connaught Place', city: 'New Delhi', state: 'Delhi', pincode: '110001', lat: 28.6330, lng: 77.2195, mapUrl: 'https://maps.google.com' },
      { id: 'b2', name: 'Lajpat Nagar', managerName: 'Priya Singh', phone: '+91 11 2987 6543', whatsapp: '+91 9876502345', address: 'Central Market, Lajpat Nagar II', city: 'New Delhi', state: 'Delhi', pincode: '110024', lat: 28.5673, lng: 77.2373, mapUrl: 'https://maps.google.com' },
    ],
    gallery: [
      'https://images.unsplash.com/photo-1543294001-f7cd5d7fb516?w=600&h=400&fit=crop&q=80',
      'https://images.unsplash.com/photo-1599643477877-530eb83abc8e?w=600&h=400&fit=crop&q=80',
      'https://images.unsplash.com/photo-1608042314453-ae338d80c427?w=600&h=400&fit=crop&q=80',
    ],
    featured: true,
    city: 'New Delhi',
    distance: 1.2,
  },
  {
    id: '2',
    name: 'Malabar Gold & Diamonds',
    slug: 'malabar-gold',
    logo: 'https://images.unsplash.com/photo-1592317295760-5c1f677dfc78?w=200&h=200&fit=crop&q=80',
    coverBanner: 'https://images.unsplash.com/photo-1769857879388-df93b4c96bca?w=1200&h=400&fit=crop&q=80',
    about: 'Malabar Gold & Diamonds is one of the largest jewellery retailers in India, known for its wide range of gold and diamond jewellery.',
    contactNumber: '+91 9887654321',
    whatsapp: '+91 9887654321',
    email: 'support@malabargold.com',
    website: 'https://www.malabargold.com',
    socialLinks: { instagram: '@malabargold', facebook: 'MalabarGold' },
    branches: [
      { id: 'b3', name: 'Banjara Hills', managerName: 'Suresh Reddy', phone: '+91 40 2358 9012', whatsapp: '+91 9887601234', address: 'Road No. 12, Banjara Hills', city: 'Hyderabad', state: 'Telangana', pincode: '500034', lat: 17.4128, lng: 78.4475, mapUrl: 'https://maps.google.com' },
    ],
    gallery: [
      'https://images.unsplash.com/photo-1724937721228-f7bf3df2a4d8?w=600&h=400&fit=crop&q=80',
      'https://images.unsplash.com/photo-1724937798223-720f8956cb12?w=600&h=400&fit=crop&q=80',
    ],
    featured: true,
    city: 'Hyderabad',
    distance: 2.8,
  },
  {
    id: '3',
    name: 'Kalyan Jewellers',
    slug: 'kalyan-jewellers',
    logo: 'https://images.unsplash.com/photo-1724937721228-f7bf3df2a4d8?w=200&h=200&fit=crop&q=80',
    coverBanner: 'https://images.unsplash.com/photo-1774625285392-13cbbc6ee8c9?w=1200&h=400&fit=crop&q=80',
    about: 'Kalyan Jewellers is a trusted name offering an expansive collection of gold, diamond, platinum, and silver jewellery across India.',
    contactNumber: '+91 9765432109',
    whatsapp: '+91 9765432109',
    email: 'hello@kalyanjewellers.net',
    website: 'https://www.kalyanjewellers.net',
    socialLinks: { instagram: '@kalyanjewellers' },
    branches: [
      { id: 'b4', name: 'T. Nagar', managerName: 'Deepa Krishnan', phone: '+91 44 2834 5678', whatsapp: '+91 9765401234', address: '47, Usman Road, T. Nagar', city: 'Chennai', state: 'Tamil Nadu', pincode: '600017', lat: 13.0418, lng: 80.2341, mapUrl: 'https://maps.google.com' },
      { id: 'b5', name: 'Anna Nagar', managerName: 'Arjun Sharma', phone: '+91 44 2616 7890', whatsapp: '+91 9765402345', address: '2nd Avenue, Anna Nagar West', city: 'Chennai', state: 'Tamil Nadu', pincode: '600040', lat: 13.0863, lng: 80.2102, mapUrl: 'https://maps.google.com' },
    ],
    gallery: [
      'https://images.unsplash.com/photo-1633934542430-0905ccb5f050?w=600&h=400&fit=crop&q=80',
      'https://images.unsplash.com/photo-1543294001-f7cd5d7fb516?w=600&h=400&fit=crop&q=80',
    ],
    featured: true,
    city: 'Chennai',
    distance: 4.1,
  },
  {
    id: '4',
    name: 'Lalitha Jewellery',
    slug: 'lalitha-jewellery',
    logo: 'https://images.unsplash.com/photo-1599643477877-530eb83abc8e?w=200&h=200&fit=crop&q=80',
    coverBanner: 'https://images.unsplash.com/photo-1543294001-f7cd5d7fb516?w=1200&h=400&fit=crop&q=80',
    about: 'Lalitha Jewellery is a South Indian jewellery heritage brand known for its authentic temple jewellery, gold, and diamond collections.',
    contactNumber: '+91 9654321098',
    whatsapp: '+91 9654321098',
    email: 'info@lalithajewellery.com',
    website: 'https://www.lalithajewellery.com',
    socialLinks: { instagram: '@lalithajewellery', facebook: 'LalithaJewellery' },
    branches: [
      { id: 'b6', name: 'Bengaluru Main', managerName: 'Kavitha Nair', phone: '+91 80 2223 4567', whatsapp: '+91 9654301234', address: '120, Commercial Street', city: 'Bengaluru', state: 'Karnataka', pincode: '560001', lat: 12.9789, lng: 77.6078, mapUrl: 'https://maps.google.com' },
    ],
    gallery: [
      'https://images.unsplash.com/photo-1592317295760-5c1f677dfc78?w=600&h=400&fit=crop&q=80',
      'https://images.unsplash.com/photo-1611107683227-e9060eccd846?w=600&h=400&fit=crop&q=80',
    ],
    featured: true,
    city: 'Bengaluru',
    distance: 5.3,
  },
  {
    id: '5',
    name: 'Joyalukkas',
    slug: 'joyalukkas',
    logo: 'https://images.unsplash.com/photo-1608042314453-ae338d80c427?w=200&h=200&fit=crop&q=80',
    coverBanner: 'https://images.unsplash.com/photo-1599643477877-530eb83abc8e?w=1200&h=400&fit=crop&q=80',
    about: 'Joyalukkas is a globally trusted jewellery brand known for its diverse collection of gold, diamond, platinum, and silver jewellery.',
    contactNumber: '+91 9543210987',
    whatsapp: '+91 9543210987',
    email: 'care@joyalukkas.com',
    website: 'https://www.joyalukkas.com',
    socialLinks: { instagram: '@joyalukkas', facebook: 'Joyalukkas' },
    branches: [
      { id: 'b7', name: 'Cochin Main', managerName: 'Thomas Joseph', phone: '+91 484 2360 111', whatsapp: '+91 9543201234', address: 'MG Road, Ernakulam', city: 'Kochi', state: 'Kerala', pincode: '682035', lat: 9.9312, lng: 76.2673, mapUrl: 'https://maps.google.com' },
    ],
    gallery: [
      'https://images.unsplash.com/photo-1724937721228-f7bf3df2a4d8?w=600&h=400&fit=crop&q=80',
      'https://images.unsplash.com/photo-1769857879388-df93b4c96bca?w=600&h=400&fit=crop&q=80',
    ],
    featured: false,
    city: 'Kochi',
    distance: 7.6,
  },
];

export const PRODUCTS: Product[] = [
  {
    id: 'p1', storeId: '1', storeName: 'Tanishq', storeLogo: STORES[0].logo,
    name: 'Eternity Gold Ring', category: 'Rings', metalType: '22K Gold', purity: '22K', weight: '4.2g',
    description: 'A timeless eternity ring crafted in 22K gold with intricate filigree work. Perfect for everyday wear or gifting.',
    images: [
      'https://images.unsplash.com/photo-1543294001-f7cd5d7fb516?w=800&q=80',
      'https://images.unsplash.com/photo-1592317295760-5c1f677dfc78?w=800&q=80',
    ],
    featured: true, displayOrder: 1, views: 342,
  },
  {
    id: 'p2', storeId: '1', storeName: 'Tanishq', storeLogo: STORES[0].logo,
    name: 'Diamond Solitaire Pendant', category: 'Pendants', metalType: '18K Gold', purity: '18K', weight: '2.1g',
    description: 'A stunning diamond solitaire pendant set in 18K white gold. The perfect centrepiece for any outfit.',
    images: [
      'https://images.unsplash.com/photo-1724937721228-f7bf3df2a4d8?w=800&q=80',
      'https://images.unsplash.com/photo-1599643477877-530eb83abc8e?w=800&q=80',
    ],
    featured: true, displayOrder: 2, views: 511,
  },
  {
    id: 'p3', storeId: '2', storeName: 'Malabar Gold & Diamonds', storeLogo: STORES[1].logo,
    name: 'Bridal Gold Bangles Set', category: 'Bangles', metalType: '22K Gold', purity: '22K', weight: '42g',
    description: 'A magnificent set of 6 hand-crafted gold bangles with traditional South Indian motifs. Ideal for bridal trousseau.',
    images: [
      'https://images.unsplash.com/photo-1608042314453-ae338d80c427?w=800&q=80',
      'https://images.unsplash.com/photo-1633934542430-0905ccb5f050?w=800&q=80',
    ],
    featured: true, displayOrder: 1, views: 298,
  },
  {
    id: 'p4', storeId: '2', storeName: 'Malabar Gold & Diamonds', storeLogo: STORES[1].logo,
    name: 'Pearl Emerald Choker', category: 'Necklaces', metalType: 'Diamond', purity: '18K', weight: '28g',
    description: 'An exquisite pearl and emerald choker with diamond accents, perfect for special occasions and bridal wear.',
    images: [
      'https://images.unsplash.com/photo-1769857879388-df93b4c96bca?w=800&q=80',
      'https://images.unsplash.com/photo-1724937798223-720f8956cb12?w=800&q=80',
    ],
    featured: true, displayOrder: 2, views: 423,
  },
  {
    id: 'p5', storeId: '3', storeName: 'Kalyan Jewellers', storeLogo: STORES[2].logo,
    name: 'Diamond & Ruby Necklace', category: 'Necklaces', metalType: 'Diamond', purity: '18K', weight: '35g',
    description: 'A majestic diamond and ruby necklace with intricate goldwork. A statement piece for every special occasion.',
    images: [
      'https://images.unsplash.com/photo-1774625285392-13cbbc6ee8c9?w=800&q=80',
      'https://images.unsplash.com/photo-1769857879388-df93b4c96bca?w=800&q=80',
    ],
    featured: true, displayOrder: 1, views: 621,
  },
  {
    id: 'p6', storeId: '3', storeName: 'Kalyan Jewellers', storeLogo: STORES[2].logo,
    name: 'Stud Diamond Earrings', category: 'Earrings', metalType: 'Diamond', purity: '18K', weight: '3.8g',
    description: 'Classic three-pair diamond stud earrings set in 18K gold. Versatile enough for both casual and formal wear.',
    images: [
      'https://images.unsplash.com/photo-1724937798223-720f8956cb12?w=800&q=80',
      'https://images.unsplash.com/photo-1599643477877-530eb83abc8e?w=800&q=80',
    ],
    featured: false, displayOrder: 3, views: 189,
  },
  {
    id: 'p7', storeId: '4', storeName: 'Lalitha Jewellery', storeLogo: STORES[3].logo,
    name: 'Temple Gold Chain', category: 'Chains', metalType: '22K Gold', purity: '22K', weight: '18g',
    description: 'A traditional temple design gold chain with antique finish, featuring deity motifs and floral patterns.',
    images: [
      'https://images.unsplash.com/photo-1611107683227-e9060eccd846?w=800&q=80',
      'https://images.unsplash.com/photo-1633934542430-0905ccb5f050?w=800&q=80',
    ],
    featured: true, displayOrder: 1, views: 367,
  },
  {
    id: 'p8', storeId: '5', storeName: 'Joyalukkas', storeLogo: STORES[4].logo,
    name: 'Platinum Wedding Band', category: 'Rings', metalType: 'Platinum', purity: '95% Platinum', weight: '7.5g',
    description: 'A sleek platinum wedding band with subtle engraving. Symbolises eternal love and commitment.',
    images: [
      'https://images.unsplash.com/photo-1543294001-f7cd5d7fb516?w=800&q=80',
      'https://images.unsplash.com/photo-1592317295760-5c1f677dfc78?w=800&q=80',
    ],
    featured: false, displayOrder: 2, views: 245,
  },
];

export const ENQUIRIES: Enquiry[] = [
  { id: 'e1', customerName: 'Priya Sharma', email: 'priya@email.com', phone: '+91 9812345678', productId: 'p1', productName: 'Eternity Gold Ring', message: 'I would like to know more about the sizing options available for this ring.', date: '2026-07-08', status: 'New' },
  { id: 'e2', customerName: 'Amit Verma', email: 'amit@email.com', phone: '+91 9723456789', productId: 'p2', productName: 'Diamond Solitaire Pendant', message: 'Can I get a custom engraving on the back of this pendant?', date: '2026-07-07', status: 'In Progress' },
  { id: 'e3', customerName: 'Sunita Patel', email: 'sunita@email.com', phone: '+91 9634567890', productId: 'p3', productName: 'Bridal Gold Bangles Set', message: 'What is the minimum order quantity for a wedding set? We have 8 bridesmaids.', date: '2026-07-05', status: 'Contacted' },
  { id: 'e4', customerName: 'Rahul Nair', email: 'rahul@email.com', phone: '+91 9545678901', productId: 'p5', productName: 'Diamond & Ruby Necklace', message: 'Interested in a similar design but with sapphires instead of rubies.', date: '2026-07-04', status: 'Closed' },
  { id: 'e5', customerName: 'Meera Iyer', email: 'meera@email.com', phone: '+91 9456789012', productId: 'p7', productName: 'Temple Gold Chain', message: 'What are the business hours of your T. Nagar branch? I would like to visit in person.', date: '2026-07-09', status: 'New' },
];

export const PROMOTIONAL_BANNERS = [
  { id: 1, title: 'Wedding Season Sale', subtitle: 'Up to 20% off on Bridal Collections', cta: 'Explore Now', image: 'https://images.unsplash.com/photo-1774625285392-13cbbc6ee8c9?w=1400&h=320&fit=crop&q=80', color: '#1d4ed8' },
  { id: 2, title: 'Akshaya Tritiya Offers', subtitle: 'Celebrate prosperity with gold. Special rates available.', cta: 'View Offers', image: 'https://images.unsplash.com/photo-1611107683227-e9060eccd846?w=1400&h=320&fit=crop&q=80', color: '#1e40af' },
  { id: 3, title: 'New Diamond Collection', subtitle: 'Discover our exclusive diamond jewellery for every occasion', cta: 'Shop Diamond', image: 'https://images.unsplash.com/photo-1769857879388-df93b4c96bca?w=1400&h=320&fit=crop&q=80', color: '#1d4ed8' },
];

export const HERO_SLIDES = [
  {
    id: 1,
    title: 'Jewellery That Feels Like Forever',
    subtitle: 'Handcrafted masterpieces from India’s most celebrated jewellers — made to be worn, treasured, and passed down.',
    cta: 'Explore Collections',
    image:cover5
    },
  {
    id: 2,
    title: 'Diamonds That Steal the Spotlight',
    subtitle: 'Ethically sourced, brilliantly cut diamonds set in designs that turn every moment into a celebration.',
    cta: 'Shop Diamonds',
    image: cover
  },
  {
  id: 5,
  title: 'Everyday Luxury, Elevated',
  subtitle: 'Lightweight, stackable, and stunning pieces designed for the modern woman who wants beauty without compromise.',
  cta: 'Shop Daily Wear',
  image: cover3},
  {
    id: 4,
    title: 'Gold That Carries Generations',
    subtitle: '22K and 18K pure gold jewellery crafted for tradition, festivals, and everyday elegance.',
    cta: 'Discover Gold',
    image: cover4
  },
  {
    id: 5,
    title: 'Everyday Luxury, Elevated',
    subtitle: 'Lightweight, stackable, and stunning pieces designed for the modern woman who wants beauty without compromise.',
    cta: 'Shop Daily Wear',
    image: cover1
  },
];