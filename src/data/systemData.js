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

/** Catalog / ledger seeds are empty — data comes from Supabase. */
export const wholesaleProducts = []
export const featuredDealIds = []
export const initialCustomers = []
export const initialOrders = []
