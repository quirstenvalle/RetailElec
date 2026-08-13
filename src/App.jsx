import { useCallback, useEffect, useMemo, useState } from 'react'
import { Navigate, Route, Routes } from 'react-router-dom'
import AdminLayout from './components/AdminLayout'
import CustomerLayout from './components/CustomerLayout'
import Toast from './components/Toast'
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
import PaymentCallbackPage from './pages/customer/PaymentCallbackPage'
import PaymentDemoPage from './pages/customer/PaymentDemoPage'
import CustomerProfilePage from './pages/customer/CustomerProfilePage'
import AdminSettingsPage from './pages/admin/AdminSettingsPage'
import { LegalPage, ResourcePage } from './pages/customer/ContentPages'
import {
  addCustomer,
  addProduct,
  updateProduct,
  deleteProduct,
  addToCartRemote,
  clearCartRemote,
  createCheckout,
  fetchCart,
  fetchCategories,
  fetchCustomers,
  fetchOrders,
  fetchProducts,
  getSessionUser,
  login,
  logout,
  onAuthStateChange,
  register,
  removeCartItem,
  submitOrder,
  updateCustomer,
  updateOrderStatus,
  updateProfile,
  upsertCartItem,
} from './api'
import './App.css'

function App() {
  const [user, setUser] = useState(null)
  const [bootstrapping, setBootstrapping] = useState(true)
  const [customers, setCustomers] = useState([])
  const [orders, setOrders] = useState([])
  const [inventory, setInventory] = useState([])
  const [categories, setCategories] = useState([])
  const [cart, setCart] = useState([])
  const [recentOrder, setRecentOrder] = useState(null)
  const [activeCategory, setActiveCategory] = usePersistedState(
    'activeCategory',
    'Laundry Care',
  )
  const [toast, setToast] = useState('')

  const showToast = useCallback((message) => {
    setToast(message)
  }, [])

  const loadCatalog = useCallback(async () => {
    const [nextCategories, nextProducts] = await Promise.all([
      fetchCategories(),
      fetchProducts(),
    ])
    setCategories(nextCategories)
    setInventory(nextProducts)
    setActiveCategory((prev) =>
      nextCategories.includes(prev) ? prev : nextCategories[0] || prev,
    )
  }, [setActiveCategory])

  const loadAdminData = useCallback(async () => {
    const [nextCustomers, nextOrders] = await Promise.all([fetchCustomers(), fetchOrders()])
    setCustomers(nextCustomers)
    setOrders(nextOrders)
  }, [])

  const loadCustomerData = useCallback(async (profile) => {
    const nextCart = await fetchCart(profile.id)
    setCart(nextCart)
  }, [])

  useEffect(() => {
    let active = true

    async function bootstrap() {
      try {
        const profile = await getSessionUser()
        if (!active) return
        setUser(profile)
        await loadCatalog()
        if (profile?.role === 'admin') {
          await loadAdminData()
        } else if (profile?.role === 'customer') {
          await loadCustomerData(profile)
        }
      } catch (error) {
        console.error(error)
        if (active) showToast(error.message || 'Failed to load app data')
      } finally {
        if (active) setBootstrapping(false)
      }
    }

    bootstrap()
    const unsubscribe = onAuthStateChange(async (profile) => {
      setUser(profile)
      if (!profile) {
        setCart([])
        setCustomers([])
        setOrders([])
        return
      }
      try {
        await loadCatalog()
        if (profile.role === 'admin') {
          await loadAdminData()
        } else {
          await loadCustomerData(profile)
        }
      } catch (error) {
        console.error(error)
      }
    })

    return () => {
      active = false
      unsubscribe()
    }
  }, [loadAdminData, loadCatalog, loadCustomerData, showToast])

  const detailedCart = useMemo(
    () =>
      cart
        .map((entry) => {
          const product = inventory.find((item) => item.id === entry.id)
          if (!product) return null
          const pricingUnit = entry.pricingUnit === 'piece' ? 'piece' : 'box'
          const linePrice = pricingUnit === 'piece' ? product.piecePrice : product.unitPrice
          return {
            ...product,
            quantity: entry.quantity,
            pricingUnit,
            linePrice: Number(linePrice) || 0,
            cartKey: `${entry.id}:${pricingUnit}`,
          }
        })
        .filter(Boolean),
    [cart, inventory],
  )

  const subtotal = useMemo(
    () => detailedCart.reduce((sum, item) => sum + item.linePrice * item.quantity, 0),
    [detailedCart],
  )

  const cartCount = useMemo(
    () => cart.reduce((total, item) => total + item.quantity, 0),
    [cart],
  )

  const addToCart = async (productId, quantity = 1, pricingUnit = 'box') => {
    if (!user) return
    const selected = inventory.find((item) => item.id === productId)
    if (!selected) return
    const unit = pricingUnit === 'piece' ? 'piece' : 'box'

    try {
      await addToCartRemote(user.id, productId, quantity, unit)
      const nextCart = await fetchCart(user.id)
      setCart(nextCart)
      showToast(`${selected.name} added (${unit === 'piece' ? 'per piece' : 'per box'})`)
    } catch (error) {
      showToast(error.message || 'Could not update cart')
    }
  }

  const updateCartQuantity = async (productId, quantity, pricingUnit = 'box') => {
    if (!user) return
    const unit = pricingUnit === 'piece' ? 'piece' : 'box'
    try {
      await upsertCartItem(user.id, productId, quantity, unit)
      setCart((prev) =>
        prev.map((entry) =>
          entry.id === productId && (entry.pricingUnit || 'box') === unit
            ? { ...entry, quantity: Math.max(1, Number(quantity) || 1), pricingUnit: unit }
            : entry,
        ),
      )
    } catch (error) {
      showToast(error.message || 'Could not update quantity')
    }
  }

  const removeFromCart = async (productId, pricingUnit = 'box') => {
    if (!user) return
    const unit = pricingUnit === 'piece' ? 'piece' : 'box'
    try {
      await removeCartItem(user.id, productId, unit)
      setCart((prev) =>
        prev.filter((entry) => !(entry.id === productId && (entry.pricingUnit || 'box') === unit)),
      )
      showToast('Item removed from cart')
    } catch (error) {
      showToast(error.message || 'Could not remove item')
    }
  }

  const clearCart = async () => {
    if (!user) return
    try {
      await clearCartRemote(user.id)
      setCart([])
      showToast('Cart cleared')
    } catch (error) {
      showToast(error.message || 'Could not clear cart')
    }
  }

  const handleRegister = async (details) => register(details)

  const handleLogin = async ({ email, password }) => {
    const result = await login({ email, password })
    if (!result.ok) return result
    setUser(result.user)
    if (result.user.role === 'admin') {
      await loadAdminData()
    } else {
      await loadCustomerData(result.user)
    }
    await loadCatalog()
    return result
  }

  const handleLogout = async () => {
    try {
      await logout()
      setUser(null)
      setCart([])
      setRecentOrder(null)
      showToast('Signed out')
    } catch (error) {
      showToast(error.message || 'Could not sign out')
    }
  }

  const handleSubmitOrder = async ({ deliveryMode, paymentMode, total, shippingAddress }) => {
    if (detailedCart.length === 0 || !user) return null
    try {
      const newOrder = await submitOrder({
        user,
        cartItems: detailedCart,
        deliveryMode,
        paymentMode,
        total,
        shippingAddress,
      })
      setRecentOrder(newOrder)
      setCart([])
      showToast('Purchase order submitted')
      return newOrder
    } catch (error) {
      showToast(error.message || 'Could not submit order')
      return null
    }
  }

  const handleSaveDeliveryAddress = async (shippingAddress) => {
    const updated = await updateProfile({
      name: user.name,
      phone: user.phone,
      businessName: user.businessName,
      ...shippingAddress,
    })
    setUser(updated)
    return updated
  }

  const handleStartOnlinePayment = async ({ deliveryMode, shippingAddress }) => {
    if (!user || detailedCart.length === 0) {
      throw new Error('Add items to your cart before paying online.')
    }
    const checkout = await createCheckout({
      deliveryMode,
      returnOrigin: window.location.origin,
      shippingAddress,
    })
    if (!checkout?.checkoutUrl) {
      throw new Error('Payment gateway did not return a checkout URL.')
    }
    showToast(
      checkout.mode === 'paymongo'
        ? 'Opening PayMongo payment gateway…'
        : 'Opening demo checkout…',
    )
    window.location.assign(checkout.checkoutUrl)
  }

  const handlePaidOrder = useCallback(
    (order) => {
      setRecentOrder(order)
      setCart([])
      showToast('Online payment successful')
    },
    [showToast],
  )

  const handleUpdateProfile = async (details) => {
    const updated = await updateProfile(details)
    setUser(updated)
    showToast('Profile updated')
    return updated
  }

  const handleAddCustomer = async (customer) => {
    try {
      const created = await addCustomer(customer)
      setCustomers((prev) => [created, ...prev])
      showToast('Customer added')
    } catch (error) {
      showToast(error.message || 'Could not add customer')
      throw error
    }
  }

  const handleUpdateCustomer = async (customerId, payload) => {
    try {
      const updated = await updateCustomer(customerId, payload)
      setCustomers((prev) => prev.map((row) => (row.id === customerId ? { ...row, ...updated } : row)))
      showToast('Customer updated')
    } catch (error) {
      showToast(error.message || 'Could not update customer')
      throw error
    }
  }

  const handleUpdateOrderStatus = async (orderId, status) => {
    try {
      const updated = await updateOrderStatus(orderId, status)
      setOrders((prev) =>
        prev.map((order) => (order.id === orderId ? { ...order, ...updated } : order)),
      )
      showToast(`Order marked ${status}`)
    } catch (error) {
      showToast(error.message || 'Could not update order')
      throw error
    }
  }

  const handleOrderShipped = (updated) => {
    setOrders((prev) =>
      prev.map((order) => (order.id === updated.id ? { ...order, ...updated } : order)),
    )
    showToast('Order marked Shipped')
  }

  const handleAddInventoryProduct = async (item) => {
    try {
      const created = await addProduct(item)
      setInventory((prev) => [created, ...prev])
      showToast('Product added to inventory')
    } catch (error) {
      showToast(error.message || 'Could not add product')
      throw error
    }
  }

  const handleUpdateInventoryProduct = async (productId, item) => {
    try {
      const updated = await updateProduct(productId, item)
      setInventory((prev) => prev.map((row) => (row.id === productId ? { ...row, ...updated } : row)))
      showToast('Product updated')
    } catch (error) {
      showToast(error.message || 'Could not update product')
      throw error
    }
  }

  const handleDeleteInventoryProduct = async (productId) => {
    try {
      await deleteProduct(productId)
      setInventory((prev) => prev.filter((row) => row.id !== productId))
      setCart((prev) => prev.filter((row) => row.id !== productId))
      showToast('Product deleted')
    } catch (error) {
      showToast(error.message || 'Could not delete product')
      throw error
    }
  }

  const defaultPath = user ? (user.role === 'admin' ? '/admin/dashboard' : '/home') : '/login'
  const featuredProducts = inventory.filter((item) => item.isFeatured)

  if (bootstrapping) {
    return (
      <div className="boot-screen">
        <p>Loading Arlen&apos;s Store...</p>
      </div>
    )
  }

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
                categories={categories}
                cartCount={cartCount}
                activeCategory={activeCategory}
                onSelectCategory={setActiveCategory}
                onLogout={handleLogout}
                user={user}
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
                categories={categories}
                activeCategory={activeCategory}
                onAddToCart={addToCart}
              />
            }
          />
          <Route
            path="/profile"
            element={<CustomerProfilePage user={user} onSave={handleUpdateProfile} onLogout={handleLogout} />}
          />
          <Route path="/info/:slug" element={<ResourcePage />} />
          <Route path="/legal/:slug" element={<LegalPage />} />
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
                onStartOnlinePayment={handleStartOnlinePayment}
                onSaveDeliveryAddress={handleSaveDeliveryAddress}
                onLogout={handleLogout}
                user={user}
              />
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />
        <Route
          path="/payment/demo"
          element={
            user?.role === 'customer' ? (
              <PaymentDemoPage onPaid={handlePaidOrder} onLogout={handleLogout} user={user} />
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />
        <Route
          path="/payment/callback"
          element={
            user?.role === 'customer' ? (
              <PaymentCallbackPage onPaid={handlePaidOrder} />
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />
        <Route
          path="/order-success"
          element={
            user?.role === 'customer' ? (
              <OrderSuccessPage order={recentOrder} onLogout={handleLogout} user={user} />
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />

        <Route path="/admin" element={<Navigate to="/admin/dashboard" replace />} />
        <Route
          element={
            user?.role === 'admin' ? (
              <AdminLayout onLogout={handleLogout} user={user} />
            ) : (
              <Navigate to="/login" replace />
            )
          }
        >
          <Route
            path="/admin/dashboard"
            element={<AdminDashboardPage orders={orders} customersCount={customers.length} inventory={inventory} />}
          />
          <Route
            path="/admin/customers"
            element={
              <AdminCustomersPage
                customers={customers}
                onAddCustomer={handleAddCustomer}
                onUpdateCustomer={handleUpdateCustomer}
              />
            }
          />
          <Route
            path="/admin/inventory"
            element={
              <AdminInventoryPage
                categories={categories}
                inventory={inventory}
                onAddInventoryProduct={handleAddInventoryProduct}
                onUpdateInventoryProduct={handleUpdateInventoryProduct}
                onDeleteInventoryProduct={handleDeleteInventoryProduct}
              />
            }
          />
          <Route
            path="/admin/orders"
            element={
              <AdminOrdersPage
                orders={orders}
                onUpdateStatus={handleUpdateOrderStatus}
                onOrderShipped={handleOrderShipped}
              />
            }
          />
          <Route path="/admin/report" element={<AdminReportPage orders={orders} inventory={inventory} />} />
          <Route
            path="/admin/settings"
            element={
              <AdminSettingsPage
                user={user}
                onSaveProfile={handleUpdateProfile}
                onLogout={handleLogout}
              />
            }
          />
          <Route path="/admin/profile" element={<Navigate to="/admin/settings?tab=profile" replace />} />
        </Route>

        <Route path="*" element={<Navigate to={defaultPath} replace />} />
      </Routes>
    </>
  )
}

export default App
