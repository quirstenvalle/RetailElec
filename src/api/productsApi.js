import { supabase } from '../lib/supabaseClient'

export function resolveProductImageUrl(imagePath) {
  if (!imagePath) return ''
  if (
    imagePath.startsWith('http://') ||
    imagePath.startsWith('https://') ||
    imagePath.startsWith('data:') ||
    imagePath.startsWith('/')
  ) {
    return imagePath
  }
  const { data } = supabase.storage.from('products').getPublicUrl(imagePath)
  return data?.publicUrl || imagePath
}

export function mapProduct(row) {
  if (!row) return null
  const resolvedImage = resolveProductImageUrl(row.image_path)
  return {
    id: row.id,
    name: row.name,
    category: row.category,
    displayCategory: row.display_category || row.category,
    unitPrice: Number(row.unit_price) || 0,
    piecePrice: Number(row.piece_price) || 0,
    packPrice: Number(row.pack_price) || 0,
    packLabel: row.pack_label || '1 box',
    unitWeight: row.unit_weight || 'N/A',
    stock: Number(row.stock) || 0,
    image_path: resolvedImage,
    imagePath: resolvedImage,
    image: resolvedImage,
    isFeatured: Boolean(row.is_featured),
    is_featured: Boolean(row.is_featured),
    createdAt: row.created_at,
  }
}

export async function fetchCategories() {
  const { data, error } = await supabase
    .from('categories')
    .select('name')
    .order('sort_order', { ascending: true })

  if (error) throw error
  return (data || []).map((row) => row.name)
}

export async function fetchProducts() {
  const { data, error } = await supabase
    .from('products')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) throw error
  return (data || []).map(mapProduct)
}

export async function addProduct(item) {
  const id = item.id || `PROD-${Date.now()}`
  const payload = {
    id,
    name: item.name,
    category: item.category,
    display_category: item.displayCategory || item.display_category || item.category,
    unit_price: Number(item.unitPrice ?? item.unit_price) || 0,
    piece_price: Number(item.piecePrice ?? item.piece_price) || 0,
    pack_price: Number(item.packPrice ?? item.pack_price) || 0,
    pack_label: item.packLabel || item.pack_label || '1 box',
    unit_weight: item.unitWeight || item.unit_weight || 'N/A',
    stock: Math.max(0, parseInt(item.stock, 10) || 0),
    image_path: item.image || item.imagePath || item.image_path || '',
    is_featured: Boolean(item.isFeatured ?? item.is_featured ?? false),
  }

  const { data, error } = await supabase
    .from('products')
    .insert(payload)
    .select('*')
    .single()

  if (error) throw error
  return mapProduct(data)
}

export async function updateProduct(productId, item) {
  const payload = {}
  if (item.name !== undefined) payload.name = item.name
  if (item.category !== undefined) payload.category = item.category
  if (item.displayCategory !== undefined || item.display_category !== undefined) {
    payload.display_category = item.displayCategory || item.display_category
  }
  if (item.unitPrice !== undefined || item.unit_price !== undefined) {
    payload.unit_price = Number(item.unitPrice ?? item.unit_price) || 0
  }
  if (item.piecePrice !== undefined || item.piece_price !== undefined) {
    payload.piece_price = Number(item.piecePrice ?? item.piece_price) || 0
  }
  if (item.packPrice !== undefined || item.pack_price !== undefined) {
    payload.pack_price = Number(item.packPrice ?? item.pack_price) || 0
  }
  if (item.packLabel !== undefined || item.pack_label !== undefined) {
    payload.pack_label = item.packLabel || item.pack_label
  }
  if (item.unitWeight !== undefined || item.unit_weight !== undefined) {
    payload.unit_weight = item.unitWeight || item.unit_weight
  }
  if (item.stock !== undefined) {
    payload.stock = Math.max(0, parseInt(item.stock, 10) || 0)
  }
  if (item.image !== undefined || item.imagePath !== undefined || item.image_path !== undefined) {
    payload.image_path = item.image || item.imagePath || item.image_path
  }
  if (item.isFeatured !== undefined || item.is_featured !== undefined) {
    payload.is_featured = Boolean(item.isFeatured ?? item.is_featured)
  }

  const { data, error } = await supabase
    .from('products')
    .update(payload)
    .eq('id', productId)
    .select('*')
    .single()

  if (error) throw error
  return mapProduct(data)
}

export async function deleteProduct(productId) {
  const { error } = await supabase
    .from('products')
    .delete()
    .eq('id', productId)

  if (error) throw error
  return true
}