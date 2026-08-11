import { supabase } from '../lib/supabaseClient'

export function mapProduct(row) {
  return {
    id: row.id,
    name: row.name,
    category: row.category,
    displayCategory: row.display_category,
    unitPrice: Number(row.unit_price),
    piecePrice: Number(row.piece_price),
    packLabel: row.pack_label,
    unitWeight: row.unit_weight,
    stock: Number(row.stock),
    image: row.image_path,
    isFeatured: Boolean(row.is_featured),
  }
}

export async function fetchCategories() {
  const { data, error } = await supabase
    .from('categories')
    .select('name')
    .order('sort_order', { ascending: true })
  if (error) throw error
  return data.map((row) => row.name)
}

export async function fetchProducts() {
  const { data, error } = await supabase
    .from('products')
    .select('*')
    .order('id', { ascending: true })
  if (error) throw error
  return data.map(mapProduct)
}

export async function addProduct(item) {
  let productId = String(item.id || '').trim()
  if (!productId) {
    const { data: idData, error: idError } = await supabase.rpc('next_product_id')
    if (idError) throw idError
    productId = idData
  }

  const payload = {
    id: productId,
    name: item.name,
    category: item.category,
    display_category: item.displayCategory,
    unit_price: item.unitPrice,
    piece_price: item.piecePrice,
    pack_label: item.packLabel,
    unit_weight: item.unitWeight,
    stock: item.stock,
    image_path: item.image,
    is_featured: false,
  }

  const { data, error } = await supabase.from('products').insert(payload).select('*').single()
  if (error) throw error
  return mapProduct(data)
}
