function BrandMark({ as: Tag = 'div', compact = false }) {
  return (
    <Tag className={`brand-block${compact ? ' compact' : ''}`}>
      <h2>Arlen’s Store</h2>
      <p>Whole Sale Store</p>
    </Tag>
  )
}

export default BrandMark
