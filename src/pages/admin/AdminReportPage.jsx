import { useMemo, useState } from 'react'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import { toCurrency } from '../../utils/formatters'

function AdminReportPage({ orders = [], inventory = [] }) {
  const [reportType, setReportType] = useState('Sales Summary')
  const [category, setCategory] = useState('all')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [sortBy, setSortBy] = useState('date-desc')
  const [generated, setGenerated] = useState(null)

  const categories = useMemo(
    () => [...new Set(inventory.map((item) => item.category).filter(Boolean))],
    [inventory],
  )

  // Helper: Normalize order date
  const getOrderDate = (order) => {
    const raw = order.orderDate || order.created_at || order.date
    return raw ? new Date(raw) : new Date(0)
  }

  // Helper: Normalize order amount
  const getOrderTotal = (order) => {
    return Number(order.total ?? order.total_amount ?? order.totalAmount ?? 0)
  }

  // Filter orders by date range
  const filteredOrders = useMemo(() => {
    return orders.filter((order) => {
      const orderDate = getOrderDate(order)
      if (dateFrom && orderDate < new Date(`${dateFrom}T00:00:00`)) return false
      if (dateTo && orderDate > new Date(`${dateTo}T23:59:59`)) return false
      return true
    })
  }, [orders, dateFrom, dateTo])

  // Filter inventory by category
  const filteredInventory = useMemo(() => {
    if (category === 'all') return inventory
    return inventory.filter((item) => item.category === category)
  }, [inventory, category])

  // Generate Table Data and Sort Accurately
  const buildReportData = () => {
    if (reportType === 'Inventory Levels') {
      const sorted = [...filteredInventory].sort((a, b) => {
        if (sortBy === 'name-asc') return (a.name || '').localeCompare(b.name || '')
        if (sortBy === 'name-desc') return (b.name || '').localeCompare(a.name || '')
        if (sortBy === 'stock-asc') return Number(a.stock || 0) - Number(b.stock || 0)
        if (sortBy === 'stock-desc') return Number(b.stock || 0) - Number(a.stock || 0)
        return Number(a.stock || 0) - Number(b.stock || 0)
      })

      return {
        title: 'Inventory Levels Report',
        headers: ['Product Name', 'Category', 'Stock Level', 'Unit Price', 'Inventory Value'],
        rows: sorted.map((item) => [
          item.name || 'Unnamed Item',
          item.category || 'General',
          String(item.stock ?? 0),
          toCurrency(item.unitPrice ?? 0),
          toCurrency((item.stock ?? 0) * (item.unitPrice ?? 0)),
        ]),
      }
    }

    if (reportType === 'Order History') {
      const sorted = [...filteredOrders].sort((a, b) => {
        const dateA = getOrderDate(a).getTime()
        const dateB = getOrderDate(b).getTime()
        const totalA = getOrderTotal(a)
        const totalB = getOrderTotal(b)

        if (sortBy === 'date-asc') return dateA - dateB
        if (sortBy === 'date-desc') return dateB - dateA
        if (sortBy === 'amount-asc') return totalA - totalB
        if (sortBy === 'amount-desc') return totalB - totalA
        return dateB - dateA
      })

      return {
        title: 'Order History Report',
        headers: ['Order ID', 'Customer', 'Date', 'Total Amount', 'Status'],
        rows: sorted.map((order) => [
          order.order_number || order.id || '—',
          order.customer || order.customer_name || order.customer_email || 'Guest',
          getOrderDate(order).toLocaleDateString(),
          toCurrency(getOrderTotal(order)),
          order.status || order.fulfillment_status || 'Pending',
        ]),
      }
    }

    if (reportType === 'Customer Activity') {
      const customerMap = filteredOrders.reduce((acc, order) => {
        const name = order.customer || order.customer_name || order.customer_email || 'Guest'
        if (!acc[name]) {
          acc[name] = { count: 0, totalSpend: 0, lastDate: getOrderDate(order) }
        }
        acc[name].count += 1
        acc[name].totalSpend += getOrderTotal(order)
        const currentDate = getOrderDate(order)
        if (currentDate > acc[name].lastDate) {
          acc[name].lastDate = currentDate
        }
        return acc
      }, {})

      const sorted = Object.entries(customerMap).sort(([, a], [, b]) => {
        if (sortBy === 'amount-desc') return b.totalSpend - a.totalSpend
        if (sortBy === 'amount-asc') return a.totalSpend - b.totalSpend
        if (sortBy === 'orders-asc') return a.count - b.count
        return b.count - a.count
      })

      return {
        title: 'Customer Activity Report',
        headers: ['Customer Name', 'Total Orders', 'Total Spend', 'Last Order Date', 'Status'],
        rows: sorted.map(([name, data]) => [
          name,
          String(data.count),
          toCurrency(data.totalSpend),
          data.lastDate.getTime() > 0 ? data.lastDate.toLocaleDateString() : '—',
          data.count >= 3 ? 'Wholesale Regular' : 'Standard',
        ]),
      }
    }

    // Default: Sales Summary
    const totalOrders = filteredOrders.length
    const totalRevenue = filteredOrders.reduce((acc, order) => acc + getOrderTotal(order), 0)
    const pendingOrders = filteredOrders.filter(
      (o) => (o.status || o.fulfillment_status || '').toLowerCase() === 'pending',
    ).length
    const completedOrders = filteredOrders.filter(
      (o) =>
        ['delivered', 'completed', 'paid'].includes((o.status || o.fulfillment_status || '').toLowerCase()),
    ).length
    const avgOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0

    return {
      title: 'Sales Summary Report',
      headers: ['Metric Indicator', 'Result Value', 'Reference Period', 'Operational Notes'],
      rows: [
        ['Gross Sales Revenue', toCurrency(totalRevenue), dateFrom || dateTo ? 'Selected Date Range' : 'All-time', 'Calculated across filtered orders'],
        ['Total Orders Placed', String(totalOrders), dateFrom || dateTo ? 'Selected Date Range' : 'All-time', 'Combined checkout count'],
        ['Completed Orders', String(completedOrders), dateFrom || dateTo ? 'Selected Date Range' : 'All-time', 'Delivered / Fulfilled transactions'],
        ['Pending Fulfillment', String(pendingOrders), 'Current', 'Orders awaiting packing or dispatch'],
        ['Average Order Value', toCurrency(avgOrderValue), dateFrom || dateTo ? 'Selected Date Range' : 'All-time', 'Revenue divided by total orders'],
        ['Catalog SKU Count', String(inventory.length), 'Live', 'Available products in database'],
      ],
    }
  }

  // Handle on-screen report preview
  const handleGeneratePreview = () => {
    const data = buildReportData()
    setGenerated(data)
  }

  // Export directly as PDF
  const handleDownloadPDF = () => {
    const data = buildReportData()
    const doc = new jsPDF()

    // Quinto Store Branding Header
    doc.setFillColor(6, 78, 59) // Theme green (#064e3b)
    doc.rect(0, 0, 210, 24, 'F')

    doc.setTextColor(255, 255, 255)
    doc.setFontSize(16)
    doc.setFont('helvetica', 'bold')
    doc.text('QUINTO STORE - WHOLESALE MANAGEMENT', 14, 15)

    doc.setTextColor(30, 41, 59)
    doc.setFontSize(14)
    doc.text(data.title, 14, 34)

    doc.setFontSize(9)
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(100, 116, 139)
    doc.text(`Generated On: ${new Date().toLocaleString()}`, 14, 40)

    const dateRangeLabel =
      dateFrom || dateTo
        ? `Date Range: ${dateFrom || 'Earliest'} to ${dateTo || 'Latest'}`
        : 'Date Range: All Available Records'
    doc.text(dateRangeLabel, 14, 45)

    if (reportType === 'Inventory Levels' && category !== 'all') {
      doc.text(`Category Filter: ${category}`, 14, 50)
    }

    // PDF Table
    autoTable(doc, {
      startY: reportType === 'Inventory Levels' && category !== 'all' ? 54 : 49,
      head: [data.headers],
      body: data.rows,
      theme: 'striped',
      headStyles: {
        fillColor: [6, 78, 59],
        textColor: [255, 255, 255],
        fontStyle: 'bold',
      },
      styles: {
        fontSize: 9,
        cellPadding: 3,
      },
      alternateRowStyles: {
        fillColor: [248, 250, 252],
      },
    })

    const sanitizedTitle = data.title.toLowerCase().replace(/\s+/g, '_')
    doc.save(`quinto_store_${sanitizedTitle}_${Date.now()}.pdf`)
  }

  return (
    <section className="report-page">
      <div className="report-card">
        <h2>FILTER OPTIONS</h2>
        <div className="filter-grid">
          <div>
            <label style={{ display: 'block', fontSize: 12, marginBottom: 4, fontWeight: 600 }}>Report Type</label>
            <select
              className="filter-input report-filter"
              value={reportType}
              onChange={(e) => {
                setReportType(e.target.value)
                setGenerated(null)
              }}
            >
              <option>Sales Summary</option>
              <option>Inventory Levels</option>
              <option>Order History</option>
              <option>Customer Activity</option>
            </select>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: 12, marginBottom: 4, fontWeight: 600 }}>Date From</label>
            <input
              className="filter-input report-filter"
              type="date"
              aria-label="Date from"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: 12, marginBottom: 4, fontWeight: 600 }}>Date To</label>
            <input
              className="filter-input report-filter"
              type="date"
              aria-label="Date to"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: 12, marginBottom: 4, fontWeight: 600 }}>
              {reportType === 'Inventory Levels' ? 'Filter Category' : 'Sort Records By'}
            </label>
            {reportType === 'Inventory Levels' ? (
              <select
                className="filter-input report-filter"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
              >
                <option value="all">All Categories</option>
                {categories.map((entry) => (
                  <option key={entry} value={entry}>
                    {entry}
                  </option>
                ))}
              </select>
            ) : (
              <select
                className="filter-input report-filter"
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
              >
                <option value="date-desc">Date (Newest First)</option>
                <option value="date-asc">Date (Oldest First)</option>
                <option value="amount-desc">Amount / Volume (Highest First)</option>
                <option value="amount-asc">Amount / Volume (Lowest First)</option>
              </select>
            )}
          </div>
        </div>

        <div className="report-actions" style={{ display: 'flex', gap: 10, marginTop: 16 }}>
          <button type="button" className="btn-green" onClick={handleGeneratePreview}>
            PREVIEW REPORT
          </button>
          <button
            type="button"
            className="btn-green"
            style={{ backgroundColor: '#0f766e' }}
            onClick={handleDownloadPDF}
          >
            DOWNLOAD PDF
          </button>
        </div>
      </div>

      {generated ? (
        <div className="admin-table-card" style={{ marginTop: 20 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <h3 style={{ margin: 0, color: '#064e3b' }}>{generated.title}</h3>
            <button
              type="button"
              className="btn-green"
              style={{ padding: '6px 14px', fontSize: 13 }}
              onClick={handleDownloadPDF}
            >
              Export this PDF
            </button>
          </div>
          <div className="admin-table">
            <div className="admin-row head">
              {generated.headers.map((header) => (
                <span key={header}>{header}</span>
              ))}
            </div>
            {generated.rows.length === 0 ? (
              <div className="empty-state">No records found for the selected criteria.</div>
            ) : (
              generated.rows.map((row, index) => (
                <div className="admin-row" key={`${row[0]}-${index}`}>
                  {row.map((col, colIdx) => (
                    <span key={colIdx}>{col}</span>
                  ))}
                </div>
              ))
            )}
          </div>
        </div>
      ) : null}
    </section>
  )
}

export default AdminReportPage