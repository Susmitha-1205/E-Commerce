export interface Product {
  id: number;
  name: string;
  description: string;
  price: number; // in cents
  imageUrl: string;
  category: string;
  stock: number;
  createdAt: string;
}

export interface User {
  id: number;
  uid: string;
  email: string;
  role: 'admin' | 'user';
  createdAt: string;
}

export interface OrderItem {
  id: number;
  orderId: number;
  productId: number;
  quantity: number;
  price: number; // price at purchase in cents
  product?: Product;
}

export interface Order {
  id: number;
  userId: number;
  status: 'pending' | 'processing' | 'shipped' | 'completed' | 'cancelled';
  total: number; // in cents
  shippingAddress: string;
  createdAt: string;
  items?: OrderItem[];
  user?: User; // available for admin
}

export interface CartItem {
  product: Product;
  quantity: number;
}
