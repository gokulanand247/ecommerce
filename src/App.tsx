import { useState, useEffect } from 'react';
import Header from './components/Header';
import Banner from './components/Banner';
import OffersSection from './components/OffersSection';
import TodaysDealSection from './components/TodaysDeal';
import FeaturedProducts from './components/FeaturedProducts';
import Categories from './components/Categories';
import AdminLogin from './components/admin/AdminLogin';
import AdminDashboard from './components/admin/AdminDashboard';
import { Admin } from './services/adminService';
import ProductGrid from './components/ProductGrid';
import ProductDetail from './components/ProductDetail';
import ProductFilters from './components/ProductFilters';
import OrdersPage from './components/OrdersPage';
import StorePage from './components/StorePage';
import StoreCategories from './components/StoreCategories';
import Cart from './components/Cart';
import AuthModal from './components/AuthModal';
import EnhancedCheckoutModal from './components/EnhancedCheckoutModal';
import SellerLogin from './components/seller/SellerLogin';
import SellerDashboard from './components/seller/SellerDashboard';
import { Seller } from './services/sellerService';
import Footer from './components/Footer';
import AboutUs from './components/pages/AboutUs';
import SizeGuide from './components/pages/SizeGuide';
import ShippingInfo from './components/pages/ShippingInfo';
import PrivacyPolicy from './components/pages/PrivacyPolicy';
import TermsConditions from './components/pages/TermsConditions';
import FAQ from './components/pages/FAQ';
import { ToastContainer, showToast } from './components/Toast';
import { Product, CartItem, User } from './types';
import { useProducts } from './hooks/useSupabase';
import { getCurrentUser, signOut } from './services/authService';

function App() {
  const { products } = useProducts();
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [user, setUser] = useState<User | null>(null);
  const [currentView, setCurrentView] = useState<'home' | 'product' | 'orders' | 'store' | 'about' | 'size-guide' | 'shipping' | 'privacy' | 'terms' | 'faq' | 'admin' | 'seller'>('home');
  const [admin, setAdmin] = useState<Admin | null>(null);
  const [seller, setSeller] = useState<Seller | null>(null);
  const [selectedProductId, setSelectedProductId] = useState<string>('');
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 10000]);
  const [sortBy, setSortBy] = useState<string>('newest');
  const [minRating, setMinRating] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [storeSearchQuery, setStoreSearchQuery] = useState('');

  // Load user and cart data
  useEffect(() => {
    const loadUserData = async () => {
      try {
        const currentUser = await getCurrentUser();
        setUser(currentUser);
      } catch (error) {
        console.error('Error loading user:', error);
      } finally {
        setLoading(false);
      }
    };

    const savedCart = localStorage.getItem('cart');
    if (savedCart) {
      setCartItems(JSON.parse(savedCart));
    }

    loadUserData();
  }, []);

  // Save cart to localStorage
  useEffect(() => {
    localStorage.setItem('cart', JSON.stringify(cartItems));
  }, [cartItems]);

  const addToCart = (product: Product) => {
    setCartItems(prev => {
      const existingItem = prev.find(item => item.id === product.id);
      if (existingItem) {
        return prev.map(item =>
          item.id === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }
      return [...prev, { ...product, quantity: 1 }];
    });
  };

  const updateQuantity = (id: string, quantity: number) => {
    if (quantity <= 0) {
      setCartItems(prev => prev.filter(item => item.id !== id));
    } else {
      setCartItems(prev =>
        prev.map(item =>
          item.id === id ? { ...item, quantity } : item
        )
      );
    }
  };

  const removeFromCart = (id: string) => {
    setCartItems(prev => prev.filter(item => item.id !== id));
  };

  const handleStoreClick = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    setCurrentView('store');
  };


  const getTotalPrice = () => {
    return cartItems.reduce((total, item) => total + (item.price * item.quantity), 0);
  };

  const getCartCount = () => {
    return cartItems.reduce((total, item) => total + item.quantity, 0);
  };

  const categories = [
    { id: 'sarees', name: 'Sarees' },
    { id: 'western', name: 'Western Wear' },
    { id: 'ethnic', name: 'Ethnic Wear' },
    { id: 'party', name: 'Party Wear' },
    { id: 'casual', name: 'Casual Wear' }
  ];

  const handleResetFilters = () => {
    setSelectedCategory('all');
    setPriceRange([0, 10000]);
    setSortBy('newest');
    setMinRating(0);
  };

  const filteredProducts = products
    .filter(product => {
      if (selectedCategory !== 'all' && product.category !== selectedCategory) return false;
      if (product.price < priceRange[0] || product.price > priceRange[1]) return false;
      if (product.average_rating && product.average_rating < minRating) return false;
      return true;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'price_low':
          return a.price - b.price;
        case 'price_high':
          return b.price - a.price;
        case 'rating':
          return (b.average_rating || 0) - (a.average_rating || 0);
        case 'discount':
          return b.discount - a.discount;
        case 'newest':
        default:
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      }
    });

  const handleProductClick = (productId: string) => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    setSelectedProductId(productId);
    setCurrentView('product');
  };

  const handleLogout = async () => {
    try {
      await signOut();
      setUser(null);
      localStorage.removeItem('cart');
      setCartItems([]);
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header
        cartCount={getCartCount()}
        onCartClick={() => setIsCartOpen(true)}
        onAuthClick={() => setIsAuthOpen(true)}
        onOrdersClick={() => setCurrentView('orders')}
        onHomeClick={() => setCurrentView('home')}
        onStoreClick={handleStoreClick}
        onSearchStores={(query) => setStoreSearchQuery(query)}
        user={user}
        onLogout={handleLogout}
        currentView={currentView as any}
      />
      
      {currentView === 'home' && (
        <main>
          <Banner />
          <OffersSection />
          <TodaysDealSection
            onAddToCart={addToCart}
            onProductClick={handleProductClick}
          />
          <FeaturedProducts
            onAddToCart={addToCart}
            onProductClick={handleProductClick}
          />
          <StoreCategories
            onStoreClick={() => {
              window.scrollTo({ top: 0, behavior: 'smooth' });
              setCurrentView('store');
            }}
          />
          <Categories
            selectedCategory={selectedCategory}
            onCategoryChange={setSelectedCategory}
          />
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <ProductFilters
              categories={categories}
              selectedCategory={selectedCategory}
              priceRange={priceRange}
              sortBy={sortBy}
              minRating={minRating}
              onCategoryChange={setSelectedCategory}
              onPriceRangeChange={setPriceRange}
              onSortChange={setSortBy}
              onRatingChange={setMinRating}
              onReset={handleResetFilters}
            />
          </div>
          <ProductGrid
            products={filteredProducts}
            onAddToCart={addToCart}
            onProductClick={handleProductClick}
          />
        </main>
      )}

      {currentView === 'product' && (
        <ProductDetail
          productId={selectedProductId}
          onAddToCart={addToCart}
          onBack={() => setCurrentView('home')}
          user={user}
        />
      )}

      {currentView === 'orders' && user && (
        <OrdersPage
          user={user}
          onBack={() => { window.scrollTo({ top: 0, behavior: 'smooth' }); setCurrentView('home'); }}
        />
      )}

      {currentView === 'store' && (
        <StorePage
          onBack={() => { window.scrollTo({ top: 0, behavior: 'smooth' }); setCurrentView('home'); }}
          onAddToCart={addToCart}
          onProductClick={handleProductClick}
          initialSearchQuery={storeSearchQuery}
        />
      )}

      {currentView === 'about' && <AboutUs onBack={() => { window.scrollTo({ top: 0, behavior: 'smooth' }); setCurrentView('home'); }} />}
      {currentView === 'size-guide' && <SizeGuide onBack={() => { window.scrollTo({ top: 0, behavior: 'smooth' }); setCurrentView('home'); }} />}
      {currentView === 'shipping' && <ShippingInfo onBack={() => { window.scrollTo({ top: 0, behavior: 'smooth' }); setCurrentView('home'); }} />}
      {currentView === 'privacy' && <PrivacyPolicy onBack={() => { window.scrollTo({ top: 0, behavior: 'smooth' }); setCurrentView('home'); }} />}
      {currentView === 'terms' && <TermsConditions onBack={() => { window.scrollTo({ top: 0, behavior: 'smooth' }); setCurrentView('home'); }} />}
      {currentView === 'faq' && <FAQ onBack={() => { window.scrollTo({ top: 0, behavior: 'smooth' }); setCurrentView('home'); }} />}

      {/* Modals */}
      {isCartOpen && (
        <Cart
          items={cartItems}
          onUpdateQuantity={updateQuantity}
          onRemoveItem={removeFromCart}
          onClose={() => setIsCartOpen(false)}
          onCheckout={() => {
            setIsCartOpen(false);
            if (user) {
              setIsCheckoutOpen(true);
            } else {
              setIsAuthOpen(true);
            }
          }}
        />
      )}

      {isAuthOpen && (
        <AuthModal
          onClose={() => setIsAuthOpen(false)}
          onLogin={(userData) => {
            setUser(userData);
            setIsAuthOpen(false);
            if (cartItems.length > 0) {
              setIsCheckoutOpen(true);
            }
          }}
        />
      )}

      {isCheckoutOpen && user && (
        <EnhancedCheckoutModal
          user={user}
          cartItems={cartItems}
          totalPrice={getTotalPrice()}
          onClose={() => setIsCheckoutOpen(false)}
          onOrderComplete={() => {
            setCartItems([]);
            setIsCheckoutOpen(false);
            showToast('Order placed successfully!', 'success');
          }}
        />
      )}

      {currentView === 'admin' && !admin && (
        <AdminLogin onLogin={(adminData) => setAdmin(adminData)} />
      )}

      {currentView === 'admin' && admin && (
        <AdminDashboard admin={admin} onLogout={() => { setAdmin(null); setCurrentView('home'); }} />
      )}

      {currentView === 'seller' && !seller && (
        <SellerLogin onClose={() => setCurrentView('home')} onLoginSuccess={(sellerData) => setSeller(sellerData)} />
      )}

      {currentView === 'seller' && seller && (
        <SellerDashboard seller={seller} onLogout={() => { setSeller(null); setCurrentView('home'); }} />
      )}

      {currentView !== 'admin' && currentView !== 'seller' && (
        <Footer onNavigate={(page) => { window.scrollTo({ top: 0, behavior: 'smooth' }); setCurrentView(page as any); }} />
      )}

      <ToastContainer />
    </div>
  );
}

export default App;