import { useCallback, useMemo, useState } from 'react'
import { Navigate, Route, Routes } from 'react-router-dom'
import AdminLayout from './components/AdminLayout'
import CustomerLayout from './components/CustomerLayout'
import Toast from './components/Toast'
import {
  featuredDealIds,
  initialCustomers,
  initialOrders,
  wholesaleCategories,
  wholesaleProducts,
} from './data/systemData'
import { usePersistedState } from './hooks/usePersistedState'
import LoginPage from './pages/auth/LoginPage'
import RegisterPage from './pages/auth/RegisterPage'
import AdminCustomersPage from './pages/admin/AdminCustomersPage'
import AdminDashboardPage from './pages/admin/AdminDashboardPage'
import AdminInventoryPage from './pages/admin/AdminInventoryPage'
import AdminOrdersPage from './pages/admin/AdminOrdersPage'
import AdminReportPage from './pages/admin/AdminReportPage'
import CustomerCartPage from './pages/customer/CustomerCartPage'
import CustomerCategoriesPage from './pages/customer/CustomerCategoriesPage'
import CustomerHomePage from './pages/customer/CustomerHomePage'
import OrderSuccessPage from './pages/customer/OrderSuccessPage'
import { clampQuantity, todayLabel } from './utils/formatters'
import { clearState } from './utils/storage'
import './App.css'

const seedAccounts = [
  {
    email: 'admin@arlen.store',
    password: 'admin123',
    role: 'admin',
    name: 'Store Admin',
  },
  {
    email: 'customer@arlen.store',
    password: 'customer123',
    role: 'customer',
    name: 'Juan Dela Cruz',
  },
]

function App() {
  const [user, setUser] = usePersistedState('user', null)
  const [accounts, setAccounts] = usePersistedState('accounts', seedAccounts)
  const [customers, setCustomers] = usePersistedState('customers', initialCustomers)
  const [orders, setOrders] = usePersistedState('orders', initialOrders)
  const [inventory, setInventory] = usePersistedState('inventory', wholesaleProducts)
  const [cart, setCart] = usePersistedState('cart', [])
  const [recentOrder, setRecentOrder] = usePersistedState('recentOrder', null)
  const [activeCategory, setActiveCategory] = usePersistedState(
    'activeCategory',
    wholesaleCategories[0],
  )
  const [toast, setToast] = useState('')

  const showToast = useCallback((message) => {
    setToast(message)
  }, [])

  const detailedCart = useMemo(
    () =>
      cart
        .map((entry) => {
          const product = inventory.find((item) => item.id === entry.id)
          if (!product) {
            return null
          }
          return { ...product, quantity: entry.quantity }
        })
        .filter(Boolean),
    [cart, inventory],
  )

  const subtotal = useMemo(
    () => detailedCart.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0),
    [detailedCart],
  )

  const cartCount = useMemo(
    () => cart.reduce((total, item) => total + item.quantity, 0),
    [cart],
  )

  const addToCart = (productId, quantity = 1) => {
    const safeQuantity = clampQuantity(quantity)
    const selected = inventory.find((item) => item.id === productId)
    if (!selected) {
      return
    }

    setCart((prev) => {
      const existing = prev.find((entry) => entry.id === productId)
      if (existing) {
        return prev.map((entry) =>
          entry.id === productId
            ? { ...entry, quantity: entry.quantity + safeQuantity }
            : entry,
        )
      }
      return [...prev, { id: productId, quantity: safeQuantity }]
    })
    showToast(`${selected.name} added to cart`)
  }

  const updateCartQuantity = (productId, quantity) => {
    setCart((prev) =>
      prev.map((entry) =>
        entry.id === productId ? { ...entry, quantity: clampQuantity(quantity) } : entry,
      ),
    )
  }

  const removeFromCart = (productId) => {
    setCart((prev) => prev.filter((entry) => entry.id !== productId))
    showToast('Item removed from cart')
  }

  const clearCart = () => {
    setCart([])
    showToast('Cart cleared')
  }

  const handleRegister = (details) => {
    const email = String(details.email).trim().toLowerCase()
    if (accounts.some((account) => account.email === email)) {
      return { ok: false, error: 'An account with this email already exists.' }
    }

    setAccounts((prev) => [
      ...prev,
      {
        email,
        password: details.password,
        role: 'customer',
        name: details.contactName,
      },
    ])
    setCustomers((prev) => [
      ...prev,
      {
        id: `c-${String(prev.length + 1).padStart(3, '0')}`,
        name: details.contactName,
        email,
        phone: details.contactNumber,
        lastTransaction: 'No transaction yet',
      },
    ])
    return { ok: true }
  }

  const handleLogin = ({ email, password }) => {
    const normalized = String(email).trim().toLowerCase()
    const found = accounts.find((account) => account.email === normalized)

    if (found) {
      if (found.password !== password) {
        return { ok: false, error: 'Incorrect password.' }
      }
      setUser({
        email: found.email,
        name: found.name,
        role: found.role,
      })
      return { ok: true, role: found.role }
    }

    // Demo fallback for first-time testers.
    const role = normalized.includes('admin') ? 'admin' : 'customer'
    const name = normalized.split('@')[0] || 'User'
    setUser({ email: normalized, name, role })
    setAccounts((prev) =>
      prev.some((account) => account.email === normalized)
        ? prev
        : [...prev, { email: normalized, password, role, name }],
    )
    return { ok: true, role }
  }

  const handleLogout = () => {
    setUser(null)
    clearState('user')
    showToast('Signed out')
  }

  const handleSubmitOrder = ({ deliveryMode, paymentMode, total }) => {
    if (detailedCart.length === 0 || !user) {
      return null
    }

    const newOrder = {
      id: `#LMN-${Math.floor(100000 + Math.random() * 900000)}`,
      total,
      items: detailedCart.map((item) => ({ ...item })),
      deliveryMode,
      paymentMode,
      orderDate: todayLabel(),
    }

    setOrders((prev) => [
      {
        id: `ORD ${String(prev.length + 1).padStart(3, '0')}`,
        customer: user.name,
        orderDate: todayLabel(),
        status: 'Pending',
      },
      ...prev,
    ])
    setCustomers((prev) =>
      prev.map((customer) =>
        customer.email === user.email
          ? { ...customer, lastTransaction: todayLabel() }
          : customer,
      ),
    )
    setRecentOrder(newOrder)
    setCart([])
    showToast('Purchase order submitted')
    return newOrder
  }

  const handleAddCustomer = (customer) => {
    setCustomers((prev) => [
      {
        id: `c-${String(prev.length + 1).padStart(3, '0')}`,
        ...customer,
        lastTransaction: customer.lastTransaction || 'No transaction yet',
      },
      ...prev,
    ])
    showToast('Customer added')
  }

  const handleUpdateOrderStatus = (orderId, status) => {
    setOrders((prev) =>
      prev.map((order) => (order.id === orderId ? { ...order, status } : order)),
    )
    showToast(`Order marked ${status}`)
  }

  const defaultPath = user ? (user.role === 'admin' ? '/admin/dashboard' : '/home') : '/login'
  const featuredProducts = featuredDealIds
    .map((id) => inventory.find((item) => item.id === id))
    .filter(Boolean)

  return (
    <>
      <Toast message={toast} onClose={() => setToast('')} />
      <Routes>
        <Route path="/" element={<Navigate to={defaultPath} replace />} />
        <Route
          path="/register"
          element={
            user ? <Navigate to={defaultPath} replace /> : <RegisterPage onRegister={handleRegister} />
          }
        />
        <Route
          path="/login"
          element={user ? <Navigate to={defaultPath} replace /> : <LoginPage onLogin={handleLogin} />}
        />

        <Route
          element={
            user?.role === 'customer' ? (
              <CustomerLayout
                categories={wholesaleCategories}
                cartCount={cartCount}
                activeCategory={activeCategory}
                onSelectCategory={setActiveCategory}
                onLogout={handleLogout}
                userName={user.name}
              />
            ) : (
              <Navigate to="/login" replace />
            )
          }
        >
          <Route
            path="/home"
            element={
              <CustomerHomePage
                featured={featuredProducts}
                onAddToCart={addToCart}
                onSelectCategory={setActiveCategory}
              />
            }
          />
          <Route
            path="/categories"
            element={
              <CustomerCategoriesPage
                products={inventory}
                categories={wholesaleCategories}
                activeCategory={activeCategory}
                onAddToCart={addToCart}
              />
            }
          />
        </Route>

        <Route
          path="/cart"
          element={
            user?.role === 'customer' ? (
              <CustomerCartPage
                cartItems={detailedCart}
                onUpdateQuantity={updateCartQuantity}
                onRemoveItem={removeFromCart}
                onClearCart={clearCart}
                subtotal={subtotal}
                onSubmitOrder={handleSubmitOrder}
                onLogout={handleLogout}
              />
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />
        <Route
          path="/order-success"
          element={
            user?.role === 'customer' ? (
              <OrderSuccessPage order={recentOrder} onLogout={handleLogout} />
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />

        <Route path="/admin" element={<Navigate to="/admin/dashboard" replace />} />
        <Route
          element={
            user?.role === 'admin' ? (
              <AdminLayout onLogout={handleLogout} userName={user.name} />
            ) : (
              <Navigate to="/login" replace />
            )
          }
        >
          <Route
            path="/admin/dashboard"
            element={<AdminDashboardPage orders={orders} customersCount={customers.length} />}
          />
          <Route
            path="/admin/customers"
            element={
              <AdminCustomersPage customers={customers} onAddCustomer={handleAddCustomer} />
            }
          />
          <Route
            path="/admin/inventory"
            element={
              <AdminInventoryPage
                categories={wholesaleCategories}
                inventory={inventory}
                onAddInventoryProduct={(item) => {
                  setInventory((prev) => [
                    {
                      ...item,
                      id: `w-${String(prev.length + 1).padStart(3, '0')}`,
                    },
                    ...prev,
                  ])
                  showToast('Product added to inventory')
                }}
              />
            }
          />
          <Route
            path="/admin/orders"
            element={
              <AdminOrdersPage orders={orders} onUpdateStatus={handleUpdateOrderStatus} />
            }
          />
          <Route path="/admin/report" element={<AdminReportPage orders={orders} inventory={inventory} />} />
        </Route>

        <Route path="*" element={<Navigate to={defaultPath} replace />} />
      </Routes>
    </>
  )
}

export default App
