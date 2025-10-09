export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  mrp: number;
  discount: number;
  images: string[];
  category: string;
  offer_ends_at: string | null;
  sizes: string[];
  colors: string[];
  stock_quantity: number;
  is_active: boolean;
  seller_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface CartItem extends Product {
  quantity: number;
  selectedSize?: string;
  selectedColor?: string;
}

export interface User {
  id: string;
  email: string;
  name?: string;
  phone?: string;
  created_at: string;
  updated_at: string;
}

export interface Address {
  id: string;
  user_id: string;
  name: string;
  phone: string;
  street: string;
  city: string;
  state: string;
  pincode: string;
  is_default: boolean;
  created_at: string;
}

export interface Order {
  id: string;
  user_id: string;
  address_id: string;
  total_amount: number;
  subtotal?: number;
  discount_amount?: number;
  coupon_id?: string | null;
  status: 'pending' | 'confirmed' | 'processing' | 'shipped' | 'out_for_delivery' | 'delivered' | 'cancelled' | 'returned';
  payment_id: string | null;
  payment_status: 'pending' | 'completed' | 'failed' | 'refunded';
  tracking_number: string | null;
  expected_delivery: string | null;
  created_at: string;
  updated_at: string;
}

export interface OrderItem {
  id: string;
  order_id: string;
  product_id: string;
  quantity: number;
  price: number;
  mrp?: number;
  selected_size: string | null;
  selected_color: string | null;
}

export interface OrderTracking {
  id: string;
  order_id: string;
  status: string;
  message: string;
  location: string | null;
  created_at: string;
}

export interface Review {
  id: string;
  product_id: string;
  user_id: string;
  rating: number;
  comment: string | null;
  images: string[];
  is_verified: boolean;
  created_at: string;
  user?: {
    name: string | null;
    phone: string;
  };
}

export interface Banner {
  id: string;
  title: string;
  subtitle: string | null;
  image_url: string;
  button_text: string;
  link_url: string | null;
  is_active: boolean;
  sort_order: number;
  created_at: string;
}

export interface PromoCode {
  id: string;
  code: string;
  description: string | null;
  discount_type: 'percentage' | 'fixed';
  discount_value: number;
  min_order_amount: number;
  max_discount_amount: number | null;
  usage_limit: number | null;
  used_count: number;
  valid_from: string;
  valid_until: string;
  is_active: boolean;
  created_at: string;
}

export interface TodaysDeal {
  id: string;
  product_id: string;
  deal_price: number;
  original_price: number;
  starts_at: string;
  ends_at: string;
  is_active: boolean;
  created_at: string;
  product?: Product;
}