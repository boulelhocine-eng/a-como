import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useAuth } from './AuthContext';
import {
  getCartUserId,
  fetchCartFromSupabase,
  syncAddToCart,
  syncUpdateQuantity,
  syncRemoveFromCart,
  syncClearCart
} from '../lib/cartService';

export interface Product {
  id: number;
  name: string;
  cat: string;
  price: string;
  desc: string;
  image: string;
  sizes?: string[];
  selectedSize?: string;
}

export interface CartItem extends Product {
  quantity: number;
}

interface FlyingItem {
  id: string;
  image: string;
  startX: number;
  startY: number;
  endX: number;
  endY: number;
}

interface CartContextType {
  cart: CartItem[];
  addToCart: (product: Product, event?: React.MouseEvent, customQty?: number) => void;
  removeFromCart: (productId: number, selectedSize?: string) => void;
  updateQuantity: (productId: number, quantity: number, selectedSize?: string) => void;
  clearCart: () => void;
  cartTotal: number;
  cartCount: number;
  checkoutProduct: Product | null;
  setCheckoutProduct: (product: Product | null) => void;
  isCheckoutOpen: boolean;
  setIsCheckoutOpen: (open: boolean) => void;
  isCartBumping: boolean;
  isCartOpen: boolean;
  setIsCartOpen: (open: boolean) => void;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: ReactNode }) {
  const { currentUser } = useAuth();
  const [cart, setCart] = useState<CartItem[]>(() => {
    try {
      const saved = localStorage.getItem('fashion_cart_cache');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });
  const [checkoutProduct, setCheckoutProduct] = useState<Product | null>(null);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [flyingItems, setFlyingItems] = useState<FlyingItem[]>([]);
  const [isCartBumping, setIsCartBumping] = useState(false);

  const cartUserId = getCartUserId(currentUser?.id);

  // Sync cart with Supabase on mount or when user changes
  useEffect(() => {
    let isMounted = true;
    async function loadSupabaseCart() {
      const remoteCart = await fetchCartFromSupabase(cartUserId);
      if (isMounted && remoteCart.length > 0) {
        setCart(remoteCart);
        localStorage.setItem('fashion_cart_cache', JSON.stringify(remoteCart));
      }
    }
    loadSupabaseCart();
    return () => {
      isMounted = false;
    };
  }, [cartUserId]);

  // Persist local cache whenever cart state changes
  useEffect(() => {
    localStorage.setItem('fashion_cart_cache', JSON.stringify(cart));
  }, [cart]);

  const triggerCartBump = () => {
    setIsCartBumping(true);
    setTimeout(() => {
      setIsCartBumping(false);
    }, 400);
  };

  const addToCart = (product: Product, event?: React.MouseEvent, customQty?: number) => {
    const qtyToAdd = customQty !== undefined ? customQty : 1;
    let newQuantity = qtyToAdd;

    setCart((prev) => {
      const existing = prev.find((item) => item.id === product.id && item.selectedSize === product.selectedSize);
      if (existing) {
        newQuantity = existing.quantity + qtyToAdd;
        return prev.map((item) =>
          (item.id === product.id && item.selectedSize === product.selectedSize) ? { ...item, quantity: newQuantity } : item
        );
      }
      return [...prev, { ...product, quantity: qtyToAdd }];
    });

    // Sync to Supabase in background
    syncAddToCart(cartUserId, product, newQuantity);

    // Check if we should run the fly-to-cart animation
    let hasFlyAnimation = false;
    if (event) {
      const cartElement = document.getElementById('header-cart-icon');
      if (cartElement) {
        hasFlyAnimation = true;
        const cartRect = cartElement.getBoundingClientRect();
        const startX = event.clientX;
        const startY = event.clientY;
        const endX = cartRect.left + cartRect.width / 2;
        const endY = cartRect.top + cartRect.height / 2;

        const id = Math.random().toString(36).substring(2, 9);
        const image = product.image || `https://picsum.photos/seed/clothing${product.id}/300/400`;

        setFlyingItems((prev) => [
          ...prev,
          { id, image, startX, startY, endX, endY }
        ]);
      }
    }

    if (!hasFlyAnimation) {
      // Keep cart closed as requested
    }
  };

  const removeFromCart = (productId: number, selectedSize?: string) => {
    setCart((prev) => prev.filter((item) => !(item.id === productId && item.selectedSize === selectedSize)));
    syncRemoveFromCart(cartUserId, productId);
  };

  const clearCart = () => {
    setCart([]);
    syncClearCart(cartUserId);
  };

  const updateQuantity = (productId: number, quantity: number, selectedSize?: string) => {
    if (quantity <= 0) {
      removeFromCart(productId, selectedSize);
      return;
    }
    setCart((prev) =>
      prev.map((item) =>
        (item.id === productId && item.selectedSize === selectedSize) ? { ...item, quantity } : item
      )
    );
    syncUpdateQuantity(cartUserId, productId, quantity);
  };

  const cartTotal = cart.reduce((total, item) => {
    const price = parseFloat(item.price.replace('$', ''));
    return total + price * item.quantity;
  }, 0);

  const cartCount = cart.reduce((count, item) => count + item.quantity, 0);

  return (
    <CartContext.Provider value={{ 
      cart, 
      addToCart, 
      removeFromCart, 
      updateQuantity, 
      clearCart,
      cartTotal, 
      cartCount,
      checkoutProduct,
      setCheckoutProduct,
      isCheckoutOpen,
      setIsCheckoutOpen,
      isCartBumping,
      isCartOpen,
      setIsCartOpen
    }}>
      {children}
      
      {/* Floating animations layer */}
      <div className="fixed inset-0 pointer-events-none select-none" style={{ zIndex: 99999 }} dir="ltr">
        <AnimatePresence>
          {flyingItems.map((item) => (
            <motion.div
              key={item.id}
              initial={{
                position: 'fixed',
                left: 0,
                right: 'auto',
                top: 0,
                x: item.startX - 24,
                y: item.startY - 24,
                scale: 1.0,
                opacity: 1.0,
                rotate: 0
              }}
              animate={{
                x: item.endX - 24,
                y: [
                  item.startY - 24,
                  Math.min(item.startY, item.endY) - 30, // Very flat, direct path to the cart with a tiny natural lift
                  item.endY - 24
                ],
                scale: [1.0, 0.5, 0.05], // Shrinks gradually from full size (1.0) to microscopic size (0.05)
                opacity: [1.0, 0.9, 0], // Fades out completely just as it enters the cart
                rotate: [0, 5, 0] // Gentle, tiny tilt instead of spinning wildly
              }}
              transition={{
                duration: 1.3, // Slower, premium, highly visible
                ease: [0.25, 1, 0.4, 1], // Custom cubic-bezier for rich parabolic feel
              }}
              onAnimationComplete={() => {
                triggerCartBump();
                // Keep cart closed as requested
                setFlyingItems((prev) => prev.filter((i) => i.id !== item.id));
              }}
              className="w-12 h-12 rounded-full border-2 border-primary bg-white shadow-2xl overflow-hidden flex items-center justify-center p-0.5"
            >
              <img 
                src={item.image} 
                alt="" 
                className="w-full h-full object-cover rounded-full" 
                referrerPolicy="no-referrer"
              />
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
}
