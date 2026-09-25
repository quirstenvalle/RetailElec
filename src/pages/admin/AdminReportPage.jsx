import { useMemo, useState } from 'react'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import { toCurrency } from '../../utils/formatters'

function AdminReportPage({ orders = [], inventory = [] }) {
  const [reportType, setReportType] = useState('Sales Summary')
  const [category, setCategory] = useState('all')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [sortBy, setSortBy] = useState('default')
  const [generated, setGenerated] = useState(null)

  const categories = useMemo(
    () => [...new Set(inventory.map((item) => item.category).filter(Boolean))],
    [inventory],
  )

  // Web currency formatter (supports Unicode ₱)
  const formatMoney = (amount) => {
    try {
      return toCurrency(amount)
    } catch {
      return `₱${Number(amount || 0).toLocaleString('en-PH', { minimumFractionDigits: 2 })}`
    }
  }

  // PDF-safe currency formatter (replaces ₱ with PHP to avoid jsPDF font encoding bugs)
  const formatMoneyPDF = (amount) => {
    return `PHP ${Number(amount || 0).toLocaleString('en-PH', { minimumFractionDigits: 2 })}`
  }

  // Date parsing helper
  const getOrderDate = (order) => {
    const raw = order.orderDate || order.created_at || order.date
    if (!raw) return new Date(0)
    const d = new Date(raw)
    return isNaN(d.getTime()) ? new Date(0) : d
  }

  // Order total parsing helper
  const getOrderTotal = (order) => {
    return Number(order.total ?? order.total_amount ?? order.totalAmount ?? 0)
  }

  // Date-filtered orders
  const filteredOrders = useMemo(() => {
    return orders.filter((order) => {
      const orderDate = getOrderDate(order)
      if (orderDate.getTime() === 0) return true
      if (dateFrom && orderDate < new Date(`${dateFrom}T00:00:00`)) return false
      if (dateTo && orderDate > new Date(`${dateTo}T23:59:59`)) return false
      return true
    })
  }, [orders, dateFrom, dateTo])

  // Category-filtered inventory
  const filteredInventory = useMemo(() => {
    if (category === 'all') return inventory
    return inventory.filter((item) => item.category === category)
  }, [inventory, category])

  // Quick Date Preset Handler
  const applyDatePreset = (preset) => {
    const now = new Date()
    const formatDate = (d) => d.toISOString().split('T')[0]

    if (preset === 'today') {
      const todayStr = formatDate(now)
      setDateFrom(todayStr)
      setDateTo(todayStr)
    } else if (preset === '7days') {
      const past = new Date()
      past.setDate(now.getDate() - 7)
      setDateFrom(formatDate(past))
      setDateTo(formatDate(now))
    } else if (preset === 'month') {
      const firstDay = new Date(now.getFullYear(), now.getMonth(), 1)
      setDateFrom(formatDate(firstDay))
      setDateTo(formatDate(now))
    } else {
      setDateFrom('')
      setDateTo('')
    }
  }

  // Clear all filters
  const handleResetFilters = () => {
    setDateFrom('')
    setDateTo('')
    setCategory('all')
    setSortBy('default')
    setGenerated(null)
  }

  // Generate Report Dataset
  const buildReportData = (forPDF = false) => {
    const money = forPDF ? formatMoneyPDF : formatMoney

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
        headers: ['Product Name', 'Category', 'Stock Level', 'Unit Price', 'Total Asset Value'],
        rows: sorted.map((item) => [
          item.name || 'Unnamed Product',
          item.category || 'General',
          String(item.stock ?? 0),
          money(item.unitPrice ?? 0),
          money((item.stock ?? 0) * (item.unitPrice ?? 0)),
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
        if (sortBy === 'amount-desc') return totalB - totalA
        if (sortBy === 'amount-asc') return totalA - totalB
        return dateB - dateA
      })

      return {
        title: 'Order History Report',
        headers: ['Order ID', 'Customer Name', 'Date Placed', 'Total Amount', 'Status'],
        rows: sorted.map((order) => [
          String(order.order_number || order.id || '—'),
          order.customer || order.customer_name || order.customer_email || 'Customer',
          getOrderDate(order).getTime() > 0 ? getOrderDate(order).toLocaleDateString() : '—',
          money(getOrderTotal(order)),
          order.status || order.fulfillment_status || 'Pending',
        ]),
      }
    }

    if (reportType === 'Customer Activity') {
      const customerMap = filteredOrders.reduce((acc, order) => {
        const name = order.customer || order.customer_name || order.customer_email || 'Customer'
        if (!acc[name]) {
          acc[name] = { count: 0, totalSpend: 0, lastDate: getOrderDate(order) }
        }
        acc[name].count += 1
        acc[name].totalSpend += getOrderTotal(order)
        const d = getOrderDate(order)
        if (d > acc[name].lastDate) acc[name].lastDate = d
        return acc
      }, {})

      const sorted = Object.entries(customerMap).sort(([, a], [, b]) => {
        if (sortBy === 'orders-asc') return a.count - b.count
        if (sortBy === 'amount-asc') return a.totalSpend - b.totalSpend
        if (sortBy === 'amount-desc') return b.totalSpend - a.totalSpend
        return b.count - a.count
      })

      return {
        title: 'Customer Activity Report',
        headers: ['Customer Name', 'Total Orders', 'Total Spend', 'Last Order Date', 'Customer Tier'],
        rows: sorted.map(([name, data]) => [
          name,
          String(data.count),
          money(data.totalSpend),
          data.lastDate.getTime() > 0 ? data.lastDate.toLocaleDateString() : '—',
          data.count >= 5 ? 'Wholesale VIP' : data.count >= 2 ? 'Repeat Buyer' : 'New Customer',
        ]),
      }
    }

    // Default: Sales Summary
    const totalOrders = filteredOrders.length
    const totalRevenue = filteredOrders.reduce((acc, o) => acc + getOrderTotal(o), 0)
    const pendingOrders = filteredOrders.filter((o) =>
      ['pending', 'processing'].includes((o.status || o.fulfillment_status || '').toLowerCase()),
    ).length
    const deliveredOrders = filteredOrders.filter((o) =>
      ['delivered', 'completed', 'paid'].includes((o.status || o.fulfillment_status || '').toLowerCase()),
    ).length
    const avgOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0

    return {
      title: 'Sales Summary Report',
      headers: ['Performance Metric', 'Metric Value', 'Reference Window', 'Operational Notes'],
      rows: [
        ['Gross Sales Revenue', money(totalRevenue), dateFrom || dateTo ? 'Selected Filter' : 'All-Time', 'Total gross value of filtered orders'],
        ['Total Orders Placed', String(totalOrders), dateFrom || dateTo ? 'Selected Filter' : 'All-Time', 'Combined orders across all statuses'],
        ['Delivered / Completed', String(deliveredOrders), dateFrom || dateTo ? 'Selected Filter' : 'All-Time', 'Successfully fulfilled orders'],
        ['Pending Fulfillment', String(pendingOrders), 'Current', 'Orders awaiting packing or dispatch'],
        ['Average Order Value', money(avgOrderValue), dateFrom || dateTo ? 'Selected Filter' : 'All-Time', 'Revenue divided by total orders'],
        ['Active SKU Count', String(inventory.length), 'Live Catalog', 'Available items currently in inventory'],
      ],
    }
  }

  // On-screen preview handler
  const handlePreviewReport = () => {
    setGenerated(buildReportData(false))
  }

  // Direct PDF Download Handler
  const handleDownloadPDF = () => {
    const data = buildReportData(true)
    const doc = new jsPDF()

    // Header bar
    doc.setFillColor(6, 78, 59)
    doc.rect(0, 0, 210, 24, 'F')

    doc.setTextColor(255, 255, 255)
    doc.setFontSize(16)
    doc.setFont('helvetica', 'bold')
    doc.text('QUINTO STORE - WHOLESALE MANAGEMENT', 14, 16)

    // Title & details
    doc.setTextColor(30, 41, 59)
    doc.setFontSize(13)
    doc.text(data.title, 14, 34)

    doc.setFontSize(9)
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(100, 116, 139)
    doc.text(`Generated On: ${new Date().toLocaleString()}`, 14, 40)

    const dateRangeText =
      dateFrom || dateTo
        ? `Date Range: ${dateFrom || 'Start'} to ${dateTo || 'End'}`
        : 'Date Range: All Available Records'
    doc.text(dateRangeText, 14, 45)

    if (reportType === 'Inventory Levels' && category !== 'all') {
      doc.text(`Category: ${category}`, 14, 50)
    }

    // Table
    autoTable(doc, {
      startY: reportType === 'Inventory Levels' && category !== 'all' ? 54 : 49,
      head: [data.headers],
      body: data.rows,
      theme: 'striped',
      headStyles: {
        fillColor: [6, 78, 59],
        textColor: [255, 255, 255],
        fontStyle: 'bold',
        fontSize: 9,
      },
      styles: {
        fontSize: 9,
        cellPadding: 3.5,
      },
      alternateRowStyles: {
        fillColor: [248, 250, 252],
      },
    })

    const cleanTitle = data.title.toLowerCase().replace(/\s+/g, '_')
    doc.save(`quinto_${cleanTitle}_${Date.now()}.pdf`)
  }

  return (
    <section className="report-page">
      <div className="report-card">
        <h2>FILTER OPTIONS</h2>
        <div className="filter-grid">
          <div>
            <label style={{ display: 'block', fontSize: 12, marginBottom: 4, fontWeight: 600, color: '#374151' }}>
              Report Type
            </label>
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
            <label style={{ display: 'block', fontSize: 12, marginBottom: 4, fontWeight: 600, color: '#374151' }}>
              Date From
            </label>
            <input
              className="filter-input report-filter"
              type="date"
              aria-label="Date from"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: 12, marginBottom: 4, fontWeight: 600, color: '#374151' }}>
              Date To
            </label>
            <input
              className="filter-input report-filter"
              type="date"
              aria-label="Date to"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: 12, marginBottom: 4, fontWeight: 600, color: '#374151' }}>
              {reportType === 'Inventory Levels' ? 'Category Filter' : 'Sorting Order'}
            </label>
            {reportType === 'Inventory Levels' ? (
              <select
                className="filter-input report-filter"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
              >
                <option value="all">All Categories</option>
                {categories.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            ) : (
              <select
                className="filter-input report-filter"
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
              >
                <option value="default">Default Order</option>
                <option value="date-desc">Date (Newest First)</option>
                <option value="date-asc">Date (Oldest First)</option>
                <option value="amount-desc">Amount / Volume (Highest First)</option>
                <option value="amount-asc">Amount / Volume (Lowest First)</option>
              </select>
            )}
          </div>
        </div>

        {/* Date presets & actions */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 16, flexWrap: 'wrap', gap: 10 }}>
          <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
            <span style={{ fontSize: 12, color: '#6b7280', fontWeight: 600, marginRight: 2 }}>Quick:</span>
            <button
              type="button"
              style={{ fontSize: 11, padding: '4px 8px', borderRadius: 4, border: '1px solid #d1d5db', background: '#f9fafb', cursor: 'pointer' }}
              onClick={() => applyDatePreset('all')}
            >
              All Time
            </button>
            <button
              type="button"
              style={{ fontSize: 11, padding: '4px 8px', borderRadius: 4, border: '1px solid #d1d5db', background: '#f9fafb', cursor: 'pointer' }}
              onClick={() => applyDatePreset('today')}
            >
              Today
            </button>
            <button
              type="button"
              style={{ fontSize: 11, padding: '4px 8px', borderRadius: 4, border: '1px solid #d1d5db', background: '#f9fafb', cursor: 'pointer' }}
              onClick={() => applyDatePreset('7days')}
            >
              Last 7 Days
            </button>
            <button
              type="button"
              style={{ fontSize: 11, padding: '4px 8px', borderRadius: 4, border: '1px solid #d1d5db', background: '#f9fafb', cursor: 'pointer' }}
              onClick={() => applyDatePreset('month')}
            >
              This Month
            </button>
            {(dateFrom || dateTo || category !== 'all' || sortBy !== 'default') && (
              <button
                type="button"
                style={{ fontSize: 11, padding: '4px 8px', borderRadius: 4, border: '1px solid #f87171', color: '#b91c1c', background: '#fef2f2', cursor: 'pointer', marginLeft: 4 }}
                onClick={handleResetFilters}
              >
                Reset
              </button>
            )}
          </div>

          <div className="report-actions" style={{ display: 'flex', gap: 10 }}>
            <button type="button" className="btn-green" onClick={handlePreviewReport}>
              PREVIEW REPORT
            </button>
            <button
              type="button"
              className="btn-green"
              style={{ backgroundColor: '#0f766e' }}
              onClick={handleDownloadPDF}
            >
              DOWNLOAD AS PDF
            </button>
          </div>
        </div>
      </div>

      {/* On-Screen Table */}
      {generated && (
        <div className="admin-table-card" style={{ marginTop: 24 }}>
          <div style={{ marginBottom: 12 }}>
            <h3 style={{ margin: 0, color: '#064e3b' }}>{generated.title}</h3>
          </div>
          <div className="admin-table">
            <div className="admin-row head">
              {generated.headers.map((header) => (
                <span key={header}>{header}</span>
              ))}
            </div>
            {generated.rows.length === 0 ? (
              <div className="empty-state">No matching records found for this criteria.</div>
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
      )}
    </section>
  )
}

export default AdminReportPage