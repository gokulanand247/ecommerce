import React from 'react';
import { ShoppingCart, User, Phone, LogOut, Package, Home } from 'lucide-react';
import { User as UserType } from '../types';

interface HeaderProps {
  cartCount: number;
  onCartClick: () => void;
  onAuthClick: () => void;
  onOrdersClick: () => void;
  onStoreClick: () => void;
  onHomeClick: () => void;
  user: UserType | null;
  onLogout: () => void;
  currentView: 'home' | 'product' | 'orders' | 'store';
}

const Header: React.FC<HeaderProps> = ({
  cartCount,
  onCartClick,
  onAuthClick,
  onOrdersClick,
  onHomeClick,
  onStoreClick,
  user,
  onLogout,
  currentView
}) => {
  return (
    <header className="bg-white shadow-md sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div className="flex items-center cursor-pointer" onClick={onHomeClick}>
            <h1 className="text-2xl font-bold text-pink-600">DressHub</h1>
          </div>

          {/* Search Bar - Hidden on mobile */}
          {currentView === 'home' && (
            <div className="hidden md:flex flex-1 max-w-md mx-8">
              <input
                type="text"
                placeholder="Search for dresses..."
                className="w-full px-4 py-2 border border-gray-300 rounded-l-md focus:outline-none focus:ring-2 focus:ring-pink-500"
              />
              <button className="bg-pink-600 text-white px-6 py-2 rounded-r-md hover:bg-pink-700 transition-colors">
                Search
              </button>
            </div>
          )}

          {/* User Actions */}
          <div className="flex items-center space-x-4">
            {/* Home */}
            <button
              onClick={onHomeClick}
              className={`flex items-center space-x-2 transition-colors ${
                currentView === 'home' ? 'text-pink-600' : 'text-gray-700 hover:text-pink-600'
              }`}
            >
              <Home className="h-5 w-5" />
              <span className="hidden sm:inline">Home</span>
            </button>

            {/* Store */}
<button
  onClick={onStoreClick}
  className={`flex items-center space-x-2 transition-colors ${
    currentView === 'store' ? 'text-pink-600' : 'text-gray-700 hover:text-pink-600'
  }`}
>
  <Package className="h-5 w-5" />
  <span className="hidden sm:inline">Store</span>
</button>

            {/* User Auth */}
            {user ? (
              <div className="flex items-center space-x-4">
                {/* Orders */}
                <button
                  onClick={onOrdersClick}
                  className={`flex items-center space-x-2 transition-colors ${
                    currentView === 'orders' ? 'text-pink-600' : 'text-gray-700 hover:text-pink-600'
                  }`}
                >
                  <Package className="h-5 w-5" />
                  <span className="hidden sm:inline">Orders</span>
                </button>

                <div className="relative group">
                  <button className="flex items-center space-x-2 text-gray-700 hover:text-pink-600 transition-colors">
                    <Phone className="h-5 w-5" />
                    <span className="hidden sm:inline">{user.phone}</span>
                  </button>
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200">
                    <div className="py-2">
                      <button
                        onClick={onLogout}
                        className="flex items-center space-x-2 w-full px-4 py-2 text-left text-gray-700 hover:bg-gray-100"
                      >
                        <LogOut className="h-4 w-4" />
                        <span>Logout</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <button
                onClick={onAuthClick}
                className="flex items-center space-x-2 text-gray-700 hover:text-pink-600 transition-colors"
              >
                <User className="h-5 w-5" />
                <span className="hidden sm:inline">Login</span>
              </button>
            )}

            {/* Cart */}
            <button
              onClick={onCartClick}
              className="relative flex items-center space-x-2 text-gray-700 hover:text-pink-600 transition-colors"
            >
              <ShoppingCart className="h-5 w-5" />
              {cartCount > 0 && (
                <span className="absolute -top-2 -right-2 bg-pink-600 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                  {cartCount}
                </span>
              )}
              <span className="hidden sm:inline">Cart</span>
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Search Bar */}
      {currentView === 'home' && (
        <div className="md:hidden px-4 pb-4">
          <div className="flex">
            <input
              type="text"
              placeholder="Search for dresses..."
              className="flex-1 px-4 py-2 border border-gray-300 rounded-l-md focus:outline-none focus:ring-2 focus:ring-pink-500"
            />
            <button className="bg-pink-600 text-white px-4 py-2 rounded-r-md hover:bg-pink-700 transition-colors">
              Search
            </button>
          </div>
        </div>
      )}
    </header>
  );
};

export default Header;