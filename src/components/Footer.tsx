import React from 'react';
import { Facebook, Twitter, Instagram, Mail, Phone, MapPin } from 'lucide-react';

interface FooterProps {
  onNavigate: (page: string) => void;
}

const Footer: React.FC<FooterProps> = ({ onNavigate }) => {
  return (
    <footer className="bg-gray-900 text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Company Info */}
          <div>
            <h3 className="text-2xl font-bold text-pink-400 mb-4">DressHub</h3>
            <p className="text-gray-300 mb-4">
              Your one-stop destination for beautiful dresses. From traditional sarees to modern western wear, 
              we have everything you need to look stunning.
            </p>
            <div className="flex space-x-4">
              <a href="#" className="text-gray-400 hover:text-pink-400 transition-colors">
                <Facebook className="h-5 w-5" />
              </a>
              <a href="#" className="text-gray-400 hover:text-pink-400 transition-colors">
                <Twitter className="h-5 w-5" />
              </a>
              <a href="#" className="text-gray-400 hover:text-pink-400 transition-colors">
                <Instagram className="h-5 w-5" />
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-lg font-semibold mb-4">Quick Links</h4>
            <ul className="space-y-2">
              <li>
                <button onClick={() => onNavigate('about')} className="text-gray-300 hover:text-pink-400 transition-colors">
                  About Us
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate('size-guide')} className="text-gray-300 hover:text-pink-400 transition-colors">
                  Size Guide
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate('shipping')} className="text-gray-300 hover:text-pink-400 transition-colors">
                  Shipping Info
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate('shipping')} className="text-gray-300 hover:text-pink-400 transition-colors">
                  Return Policy
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate('faq')} className="text-gray-300 hover:text-pink-400 transition-colors">
                  FAQ
                </button>
              </li>
            </ul>
          </div>

          {/* Categories */}
          <div>
            <h4 className="text-lg font-semibold mb-4">Categories</h4>
            <ul className="space-y-2">
              <li>
                <a href="#" className="text-gray-300 hover:text-pink-400 transition-colors">
                  Sarees
                </a>
              </li>
              <li>
                <a href="#" className="text-gray-300 hover:text-pink-400 transition-colors">
                  Western Wear
                </a>
              </li>
              <li>
                <a href="#" className="text-gray-300 hover:text-pink-400 transition-colors">
                  Ethnic Wear
                </a>
              </li>
              <li>
                <a href="#" className="text-gray-300 hover:text-pink-400 transition-colors">
                  Party Wear
                </a>
              </li>
              <li>
                <a href="#" className="text-gray-300 hover:text-pink-400 transition-colors">
                  Casual Wear
                </a>
              </li>
            </ul>
          </div>

          {/* Contact Info */}
          <div>
            <h4 className="text-lg font-semibold mb-4">Contact Us</h4>
            <div className="space-y-3">
              <div className="flex items-center space-x-3">
                <MapPin className="h-5 w-5 text-pink-400 flex-shrink-0" />
                <span className="text-gray-300">
                  123 Fashion Street, Mumbai, Maharashtra 400001
                </span>
              </div>
              <div className="flex items-center space-x-3">
                <Phone className="h-5 w-5 text-pink-400 flex-shrink-0" />
                <span className="text-gray-300">+91 98765 43210</span>
              </div>
              <div className="flex items-center space-x-3">
                <Mail className="h-5 w-5 text-pink-400 flex-shrink-0" />
                <span className="text-gray-300">support@dresshub.com</span>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-gray-800 mt-8 pt-8">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <p className="text-gray-400 text-sm">
              © 2025 DressHub. All rights reserved.
            </p>
            <div className="flex flex-wrap justify-center md:justify-end gap-4 md:gap-6 mt-4 md:mt-0">
              <button onClick={() => onNavigate('privacy')} className="text-gray-400 hover:text-pink-400 text-sm transition-colors">
                Privacy Policy
              </button>
              <button onClick={() => onNavigate('terms')} className="text-gray-400 hover:text-pink-400 text-sm transition-colors">
                Terms of Service
              </button>
              <button onClick={() => onNavigate('privacy')} className="text-gray-400 hover:text-pink-400 text-sm transition-colors">
                Cookie Policy
              </button>
              <button onClick={() => onNavigate('admin')} className="text-gray-400 hover:text-pink-400 text-sm transition-colors font-semibold">
                Admin
              </button>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;