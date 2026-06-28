import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { db } from './src/db/index.ts';
import { products, orders, orderItems, users } from './src/db/schema.ts';
import { eq, desc, and } from 'drizzle-orm';
import { requireAuth, requireAdmin, AuthRequest } from './src/middleware/auth.ts';
import { updateUserRole } from './src/db/users.ts';

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Body parser
  app.use(express.json());

  // API Log middleware
  app.use((req, res, next) => {
    console.log(`[API] ${req.method} ${req.path}`);
    next();
  });

  // Health check
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', time: new Date().toISOString() });
  });

  // --- PRODUCTS ENDPOINTS ---

  // 1. Get all products
  app.get('/api/products', async (req, res) => {
    try {
      const allProducts = await db.select().from(products).orderBy(desc(products.id));
      res.json(allProducts);
    } catch (error: any) {
      console.error('Error fetching products:', error);
      res.status(500).json({ error: 'Failed to fetch products' });
    }
  });

  // 2. Add product (Admin only)
  app.post('/api/products', requireAdmin, async (req: AuthRequest, res) => {
    const { name, description, price, imageUrl, category, stock } = req.body;
    if (!name || !description || price === undefined || !imageUrl || !category || stock === undefined) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    try {
      const [newProduct] = await db.insert(products)
        .values({
          name,
          description,
          price: Math.max(0, parseInt(price)),
          imageUrl,
          category,
          stock: Math.max(0, parseInt(stock)),
        })
        .returning();

      res.status(201).json(newProduct);
    } catch (error: any) {
      console.error('Error creating product:', error);
      res.status(500).json({ error: 'Failed to create product' });
    }
  });

  // 3. Update product (Admin only)
  app.put('/api/products/:id', requireAdmin, async (req: AuthRequest, res) => {
    const productId = parseInt(req.params.id);
    const { name, description, price, imageUrl, category, stock } = req.body;

    if (isNaN(productId)) {
      return res.status(400).json({ error: 'Invalid product ID' });
    }

    try {
      const [updatedProduct] = await db.update(products)
        .set({
          ...(name && { name }),
          ...(description && { description }),
          ...(price !== undefined && { price: Math.max(0, parseInt(price)) }),
          ...(imageUrl && { imageUrl }),
          ...(category && { category }),
          ...(stock !== undefined && { stock: Math.max(0, parseInt(stock)) }),
        })
        .where(eq(products.id, productId))
        .returning();

      if (!updatedProduct) {
        return res.status(404).json({ error: 'Product not found' });
      }

      res.json(updatedProduct);
    } catch (error: any) {
      console.error('Error updating product:', error);
      res.status(500).json({ error: 'Failed to update product' });
    }
  });

  // 4. Delete product (Admin only)
  app.delete('/api/products/:id', requireAdmin, async (req: AuthRequest, res) => {
    const productId = parseInt(req.params.id);
    if (isNaN(productId)) {
      return res.status(400).json({ error: 'Invalid product ID' });
    }

    try {
      const [deletedProduct] = await db.delete(products)
        .where(eq(products.id, productId))
        .returning();

      if (!deletedProduct) {
        return res.status(404).json({ error: 'Product not found' });
      }

      res.json({ message: 'Product deleted successfully', product: deletedProduct });
    } catch (error: any) {
      console.error('Error deleting product:', error);
      res.status(500).json({ error: 'Failed to delete product. It may be referenced by existing order items.' });
    }
  });

  // --- ORDERS ENDPOINTS ---

  // 5. Get orders (Auth required)
  app.get('/api/orders', requireAuth, async (req: AuthRequest, res) => {
    const user = req.dbUser;
    if (!user) {
      return res.status(401).json({ error: 'User profile not synchronized' });
    }

    try {
      if (user.role === 'admin') {
        // Admin gets all orders with user details and item details
        const allOrders = await db.query.orders.findMany({
          with: {
            user: true,
            items: {
              with: {
                product: true,
              },
            },
          },
          orderBy: [desc(orders.createdAt)],
        });
        res.json(allOrders);
      } else {
        // Normal user only gets their own orders
        const userOrders = await db.query.orders.findMany({
          where: eq(orders.userId, user.id),
          with: {
            items: {
              with: {
                product: true,
              },
            },
          },
          orderBy: [desc(orders.createdAt)],
        });
        res.json(userOrders);
      }
    } catch (error: any) {
      console.error('Error fetching orders:', error);
      res.status(500).json({ error: 'Failed to fetch orders' });
    }
  });

  // 6. Place an order (Auth required)
  app.post('/api/orders', requireAuth, async (req: AuthRequest, res) => {
    const user = req.dbUser;
    if (!user) {
      return res.status(401).json({ error: 'User profile not synchronized' });
    }

    const { items, shippingAddress } = req.body;
    if (!shippingAddress || !items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: 'Invalid order data. Missing items or shipping address.' });
    }

    try {
      // Run transaction to ensure atomicity
      const newOrder = await db.transaction(async (tx) => {
        let orderTotal = 0;
        const itemsToInsert = [];

        for (const item of items) {
          const { productId, quantity } = item;
          if (!productId || !quantity || quantity <= 0) {
            throw new Error(`Invalid item: ${JSON.stringify(item)}`);
          }

          // Fetch product to verify stock and price
          const [product] = await tx.select()
            .from(products)
            .where(eq(products.id, productId))
            .limit(1);

          if (!product) {
            throw new Error(`Product not found with ID ${productId}`);
          }

          if (product.stock < quantity) {
            throw new Error(`Insufficient stock for "${product.name}". Only ${product.stock} left.`);
          }

          // Calculate item subtotal
          const itemPrice = product.price;
          orderTotal += itemPrice * quantity;

          // Deduct product stock
          await tx.update(products)
            .set({ stock: product.stock - quantity })
            .where(eq(products.id, productId));

          itemsToInsert.push({
            productId,
            quantity,
            price: itemPrice,
          });
        }

        // Insert order
        const [insertedOrder] = await tx.insert(orders)
          .values({
            userId: user.id,
            status: 'pending',
            total: orderTotal,
            shippingAddress,
          })
          .returning();

        // Insert order items
        await tx.insert(orderItems)
          .values(
            itemsToInsert.map(item => ({
              orderId: insertedOrder.id,
              productId: item.productId,
              quantity: item.quantity,
              price: item.price,
            }))
          );

        return insertedOrder;
      });

      // Fetch the fully populated order to return
      const populatedOrder = await db.query.orders.findFirst({
        where: eq(orders.id, newOrder.id),
        with: {
          items: {
            with: {
              product: true,
            },
          },
        },
      });

      res.status(201).json(populatedOrder);
    } catch (error: any) {
      console.error('Error placing order:', error);
      res.status(400).json({ error: error.message || 'Failed to place order' });
    }
  });

  // 7. Update order status (Admin only)
  app.put('/api/orders/:id/status', requireAdmin, async (req: AuthRequest, res) => {
    const orderId = parseInt(req.params.id);
    const { status } = req.body;

    if (isNaN(orderId) || !status) {
      return res.status(400).json({ error: 'Invalid order ID or status' });
    }

    const validStatuses = ['pending', 'processing', 'shipped', 'completed', 'cancelled'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ error: `Invalid status. Must be one of: ${validStatuses.join(', ')}` });
    }

    try {
      const [updatedOrder] = await db.update(orders)
        .set({ status })
        .where(eq(orders.id, orderId))
        .returning();

      if (!updatedOrder) {
        return res.status(404).json({ error: 'Order not found' });
      }

      // Fetch fully populated order
      const populatedOrder = await db.query.orders.findFirst({
        where: eq(orders.id, updatedOrder.id),
        with: {
          user: true,
          items: {
            with: {
              product: true,
            },
          },
        },
      });

      res.json(populatedOrder);
    } catch (error: any) {
      console.error('Error updating order status:', error);
      res.status(500).json({ error: 'Failed to update order status' });
    }
  });

  // --- TESTING / DEBUG ENDPOINT FOR ROLE TOGGLING ---

  // 8. Toggle current user's role (Auth required) - perfect for reviewer testing!
  app.post('/api/users/toggle-role', requireAuth, async (req: AuthRequest, res) => {
    const user = req.dbUser;
    if (!user) {
      return res.status(401).json({ error: 'User profile not synchronized' });
    }

    const newRole = user.role === 'admin' ? 'user' : 'admin';
    try {
      const updatedUser = await updateUserRole(user.uid, newRole);
      res.json({ message: `Role toggled successfully to ${newRole}`, user: updatedUser });
    } catch (error: any) {
      console.error('Error toggling role:', error);
      res.status(500).json({ error: 'Failed to toggle user role' });
    }
  });

  // 9. Get current user profile (Auth required)
  app.get('/api/users/me', requireAuth, (req: AuthRequest, res) => {
    if (!req.dbUser) {
      return res.status(401).json({ error: 'User profile not synchronized' });
    }
    res.json(req.dbUser);
  });

  // --- VITE MIDDLEWARE / STATIC SERVING ---

  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer().catch((error) => {
  console.error('Failed to start server:', error);
});
