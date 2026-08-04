import { assets } from '../constants/assets'

export const wholesaleCategories = [
  'Laundry Care',
  'Canned Goods',
  'Dry Materials',
  'Beverages',
  'Snacks',
]

export const categoryTiles = [
  { name: 'Dry Goods', image: assets.catDryGoods, large: true },
  { name: 'Canned Goods', image: assets.catCanned, wide: true },
  { name: 'Condiments', image: assets.catCondiments },
  { name: 'Snacks', image: assets.catSnacks },
]

export const wholesaleProducts = [
  {
    id: 'w-001',
    name: 'Surf Active Clean (Rose Fresh)',
    category: 'Laundry Care',
    displayCategory: 'LAUNDRY CARE',
    unitPrice: 1890,
    piecePrice: 24,
    packLabel: '1 box (24x)',
    unitWeight: '45 lbs/unit',
    stock: 120,
    image: assets.productSurf,
  },
  {
    id: 'w-002',
    name: 'Tide Perfect Clean (Twin Pack Jumbo)',
    category: 'Laundry Care',
    displayCategory: 'LAUNDRY CARE',
    unitPrice: 1890,
    piecePrice: 24,
    packLabel: '1 box (24x)',
    unitWeight: '200 lbs/unit',
    stock: 84,
    image: assets.productTide,
  },
  {
    id: 'w-003',
    name: 'Downy Passion Fabric Conditioner',
    category: 'Laundry Care',
    displayCategory: 'LAUNDRY CARE',
    unitPrice: 1890,
    piecePrice: 24,
    packLabel: '1 box (24x)',
    unitWeight: '25 lbs/unit',
    stock: 96,
    image: assets.productDowny,
  },
  {
    id: 'w-004',
    name: 'All Purpose Flour (25kg)',
    category: 'Dry Materials',
    displayCategory: 'DRY GOODS',
    unitPrice: 980,
    piecePrice: 980,
    packLabel: '1 sack (25kg)',
    unitWeight: '25 kg/unit',
    stock: 10,
    image: assets.productFlour,
  },
  {
    id: 'w-005',
    name: 'White Sugar (25kg)',
    category: 'Dry Materials',
    displayCategory: 'DRY GOODS',
    unitPrice: 1100,
    piecePrice: 1100,
    packLabel: '1 sack (25kg)',
    unitWeight: '25 kg/unit',
    stock: 7,
    image: assets.productFlour,
  },
  {
    id: 'w-006',
    name: 'Brown Sugar (25kg)',
    category: 'Dry Materials',
    displayCategory: 'DRY GOODS',
    unitPrice: 1050,
    piecePrice: 1050,
    packLabel: '1 sack (25kg)',
    unitWeight: '25 kg/unit',
    stock: 5,
    image: assets.productFlour,
  },
  {
    id: 'w-007',
    name: 'Cornstarch',
    category: 'Dry Materials',
    displayCategory: 'DRY GOODS',
    unitPrice: 1000,
    piecePrice: 1000,
    packLabel: '1 sack',
    unitWeight: '20 kg/unit',
    stock: 10,
    image: assets.productFlour,
  },
  {
    id: 'w-008',
    name: '555 Tuna Adobo (24pcs)',
    category: 'Canned Goods',
    displayCategory: 'CAN GOODS',
    unitPrice: 600,
    piecePrice: 25,
    packLabel: '1 box (24x)',
    unitWeight: '12 lbs/unit',
    stock: 7,
    image: assets.productTuna,
  },
  {
    id: 'w-009',
    name: 'San Marino Tuna Spicy (24pcs)',
    category: 'Canned Goods',
    displayCategory: 'CAN GOODS',
    unitPrice: 700,
    piecePrice: 29,
    packLabel: '1 box (24x)',
    unitWeight: '12 lbs/unit',
    stock: 9,
    image: assets.productTuna,
  },
  {
    id: 'w-010',
    name: 'Century Tuna (24pcs)',
    category: 'Canned Goods',
    displayCategory: 'CAN GOODS',
    unitPrice: 680,
    piecePrice: 28,
    packLabel: '1 box (24x)',
    unitWeight: '12 lbs/unit',
    stock: 5,
    image: assets.productTuna,
  },
  {
    id: 'w-011',
    name: 'Fresca Tuna Spicy (24pcs)',
    category: 'Canned Goods',
    displayCategory: 'CAN GOODS',
    unitPrice: 580,
    piecePrice: 24,
    packLabel: '1 box (24x)',
    unitWeight: '12 lbs/unit',
    stock: 7,
    image: assets.productTuna,
  },
  {
    id: 'w-012',
    name: 'TSL Detergent Powder (x24)',
    category: 'Laundry Care',
    displayCategory: 'LAUNDRY CARE',
    unitPrice: 900,
    piecePrice: 38,
    packLabel: '1 box (24x)',
    unitWeight: '18 lbs/unit',
    stock: 48,
    image: assets.productDetergent,
  },
]

export const featuredDealIds = ['w-004', 'w-012', 'w-008']

export const adminSummary = {
  orders: 56,
  delivered: 12,
  customers: 5,
}

export const salesOverview = [
  { month: 'Jan', value: 18 },
  { month: 'Feb', value: 22 },
  { month: 'Mar', value: 20 },
  { month: 'Apr', value: 28 },
  { month: 'May', value: 35 },
  { month: 'Jun', value: 42 },
  { month: 'Jul', value: 38 },
]

export const orderStatusBreakdown = [
  { label: 'Pending', value: 12, percent: 21, color: '#facc15' },
  { label: 'Processing', value: 10, percent: 18, color: '#38bdf8' },
  { label: 'Shipped', value: 18, percent: 32, color: '#4ade80' },
  { label: 'Delivered', value: 12, percent: 21, color: '#c084fc' },
  { label: 'Cancelled', value: 4, percent: 7, color: '#f87171' },
]

export const topSellingItems = [
  { name: 'All Purpose Flour (25kg)', sold: 15, image: assets.productFlour },
  { name: '555 Tuna Adobo (x24)', sold: 11, image: assets.productTuna },
  { name: 'TSL Powder Detergent (x24)', sold: 7, image: assets.productDetergent },
]

export const stockOverview = [
  { label: 'In Stock', tone: 'ok' },
  { label: 'Low Stock', tone: 'warn' },
  { label: 'Out of Stock', tone: 'danger' },
]

export const initialCustomers = [
  {
    id: 'c-001',
    name: 'Juan Dela Cruz',
    email: 'juan@store.com',
    phone: '0912-345-6789',
    lastTransaction: 'August 03, 2026',
  },
  {
    id: 'c-002',
    name: 'Maria Santos',
    email: 'maria@retail.com',
    phone: '0998-234-1142',
    lastTransaction: 'August 02, 2026',
  },
  {
    id: 'c-003',
    name: 'Pedro Reyes',
    email: 'pedro@mart.com',
    phone: '0906-778-3210',
    lastTransaction: 'August 01, 2026',
  },
  {
    id: 'c-004',
    name: 'Ana Lopez',
    email: 'ana@grocer.com',
    phone: '0917-555-2200',
    lastTransaction: 'July 30, 2026',
  },
  {
    id: 'c-005',
    name: 'Carlo Mendoza',
    email: 'carlo@mini.com',
    phone: '0920-111-4455',
    lastTransaction: 'July 28, 2026',
  },
]

export const initialOrders = [
  {
    id: 'ORD 001',
    customer: 'Junita M. Dela Cruz',
    orderDate: 'August 01, 2026',
    status: 'Pending',
  },
  {
    id: 'ORD 002',
    customer: 'Pacito M. Santos',
    orderDate: 'August 01, 2026',
    status: 'Pending',
  },
  {
    id: 'ORD 003',
    customer: 'Angel Mae Estrera',
    orderDate: 'August 03, 2026',
    status: 'Pending',
  },
  {
    id: 'ORD 004',
    customer: 'Miguel Dela Verde',
    orderDate: 'August 02, 2026',
    status: 'Processing',
  },
  {
    id: 'ORD 005',
    customer: 'Sofia Rivera',
    orderDate: 'August 02, 2026',
    status: 'Shipped',
  },
]
