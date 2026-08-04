function QuantityStepper({ value, onChange, min = 1 }) {
  return (
    <div className="qty-stepper">
      <button type="button" onClick={() => onChange(Math.max(min, value - 1))} aria-label="Decrease">
        −
      </button>
      <span>{value}</span>
      <button type="button" onClick={() => onChange(Math.max(min, value + 1))} aria-label="Increase">
        +
      </button>
    </div>
  )
}

export default QuantityStepper
