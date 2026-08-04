import { useMemo, useState } from 'react'
import { Navigate, Route, Routes } from 'react-router-dom'
import AdminLayout from './components/AdminLayout'
import CustomerLayout from './components/CustomerLayout'
import {
  featuredDealIds,
  initialCustomers,
  initialOrders,
  wholesaleCategories,
  wholesaleProducts,
} from './data/systemData'
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
import { clampQuantity } from './utils/formatters'
import './App.css'

function App() {
  const [user, setUser] = useState(null)
  const [customers, setCustomers] = useState(initialCustomers)
  const [orders, setOrders] = useState(initialOrders)
  const [inventory, setInventory] = useState(wholesaleProducts)
  const [cart, setCart] = useState([])
  const [recentOrder, setRecentOrder] = useState(null)
  const [activeCategory, setActiveCategory] = useState(wholesaleCategories[0])

  const detailedCart = useMemo(
    () =>
      cart
        .map((entry) => {
          const product = inventory.find((item) => item.id === entry.id)
          if (!product) {
            return null
          }

          return {
            ...product,
            quantity: entry.quantity,
          }
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
            ? {
                ...entry,
                quantity: entry.quantity + safeQuantity,
              }
            : entry,
        )
      }

      return [...prev, { id: productId, quantity: safeQuantity }]
    })
  }

  const updateCartQuantity = (productId, quantity) => {
    setCart((prev) =>
      prev.map((entry) =>
        entry.id === productId
          ? {
              ...entry,
              quantity: clampQuantity(quantity),
            }
          : entry,
      ),
    )
  }

  const removeFromCart = (productId) => {
    setCart((prev) => prev.filter((entry) => entry.id !== productId))
  }

  const clearCart = () => {
    setCart([])
  }

  const handleRegister = (details) => {
    setCustomers((prev) => [
      ...prev,
      {
        id: `c-${String(prev.length + 1).padStart(3, '0')}`,
        name: details.contactName,
        email: details.email,
        phone: details.contactNumber,
        lastTransaction: 'No transaction yet',
      },
    ])
  }

  const handleSubmitOrder = ({ total }) => {
    if (detailedCart.length === 0 || !user) {
      return null
    }

    const newOrder = {
      id: `#LMN-${Math.floor(100000 + Math.random() * 900000)}`,
      total,
      items: detailedCart,
    }

    setOrders((prev) => [
      {
        id: `ORD-${200 + prev.length}`,
        customer: user.name,
        orderDate: 'August 05, 2026',
        status: 'Pending',
      },
      ...prev,
    ])
    setRecentOrder(newOrder)
    setCart([])
    return newOrder
  }

  const defaultPath = user ? (user.role === 'admin' ? '/admin/dashboard' : '/home') : '/login'
  const featuredProducts = featuredDealIds
    .map((id) => inventory.find((item) => item.id === id))
    .filter(Boolean)

  return (
    <Routes>
      <Route path="/" element={<Navigate to={defaultPath} replace />} />
      <Route
        path="/register"
        element={user ? <Navigate to={defaultPath} replace /> : <RegisterPage onRegister={handleRegister} />}
      />
      <Route
        path="/login"
        element={user ? <Navigate to={defaultPath} replace /> : <LoginPage onLogin={setUser} />}
      />

      <Route
        element={
          user?.role === 'customer' ? (
            <CustomerLayout
              categories={wholesaleCategories}
              cartCount={cartCount}
              activeCategory={activeCategory}
              onSelectCategory={setActiveCategory}
            />
          ) : (
            <Navigate to="/login" replace />
          )
        }
      >
        <Route
          path="/home"
          element={<CustomerHomePage featured={featuredProducts} onAddToCart={addToCart} />}
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
            <OrderSuccessPage order={recentOrder} />
          ) : (
            <Navigate to="/login" replace />
          )
        }
      />

      <Route path="/admin" element={<Navigate to="/admin/dashboard" replace />} />
      <Route
        element={user?.role === 'admin' ? <AdminLayout /> : <Navigate to="/login" replace />}
      >
        <Route path="/admin/dashboard" element={<AdminDashboardPage />} />
        <Route path="/admin/customers" element={<AdminCustomersPage customers={customers} />} />
        <Route
          path="/admin/inventory"
          element={
            <AdminInventoryPage
              categories={wholesaleCategories}
              inventory={inventory}
              onAddInventoryProduct={(item) =>
                setInventory((prev) => [
                  {
                    ...item,
                    id: `w-${String(prev.length + 1).padStart(3, '0')}`,
                  },
                  ...prev,
                ])
              }
            />
          }
        />
        <Route path="/admin/orders" element={<AdminOrdersPage orders={orders} />} />
        <Route path="/admin/report" element={<AdminReportPage />} />
      </Route>

      <Route path="*" element={<Navigate to={defaultPath} replace />} />
    </Routes>
  )
}

export default App
