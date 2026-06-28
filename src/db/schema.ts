import { relations } from 'drizzle-orm';
import { integer, pgTable, serial, text, timestamp } from 'drizzle-orm/pg-core';

// 1. Users table
export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  uid: text('uid').notNull().unique(), // Firebase Auth UID
  email: text('email').notNull(),
  role: text('role').notNull().default('user'), // 'user' | 'admin'
  createdAt: timestamp('created_at').defaultNow(),
});

// Users relations
export const usersRelations = relations(users, ({ many }) => ({
  orders: many(orders),
}));

// 2. Products table
export const products = pgTable('products', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  description: text('description').notNull(),
  price: integer('price').notNull(), // price in cents
  imageUrl: text('image_url').notNull(),
  category: text('category').notNull(),
  stock: integer('stock').notNull().default(10),
  createdAt: timestamp('created_at').defaultNow(),
});

// Products relations
export const productsRelations = relations(products, ({ many }) => ({
  orderItems: many(orderItems),
}));

// 3. Orders table
export const orders = pgTable('orders', {
  id: serial('id').primaryKey(),
  userId: integer('user_id')
    .references(() => users.id)
    .notNull(),
  status: text('status').notNull().default('pending'), // 'pending', 'processing', 'completed', 'cancelled'
  total: integer('total').notNull(), // total in cents
  shippingAddress: text('shipping_address').notNull(),
  createdAt: timestamp('created_at').defaultNow(),
});

// Orders relations
export const ordersRelations = relations(orders, ({ one, many }) => ({
  user: one(users, {
    fields: [orders.userId],
    references: [users.id],
  }),
  items: many(orderItems),
}));

// 4. Order Items table
export const orderItems = pgTable('order_items', {
  id: serial('id').primaryKey(),
  orderId: integer('order_id')
    .references(() => orders.id, { onDelete: 'cascade' })
    .notNull(),
  productId: integer('product_id')
    .references(() => products.id)
    .notNull(),
  quantity: integer('quantity').notNull(),
  price: integer('price').notNull(), // price at purchase in cents
});

// Order items relations
export const orderItemsRelations = relations(orderItems, ({ one }) => ({
  order: one(orders, {
    fields: [orderItems.orderId],
    references: [orders.id],
  }),
  product: one(products, {
    fields: [orderItems.productId],
    references: [products.id],
  }),
}));
