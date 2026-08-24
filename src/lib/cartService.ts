import { supabase } from './supabase';

export interface CartProduct {
  id: number;
  name: string;
  cat: string;
  price: string;
  desc: string;
  image: string;
}

export interface CartItem extends CartProduct {
  quantity: number;
}

// Get or generate guest session ID for non-logged-in users
export function getCartUserId(userId?: string | null): string {
  if (userId) return userId;
  
  let guestId = localStorage.getItem('fashion_cart_guest_id');
  if (!guestId) {
    guestId = 'GUEST-' + Math.random().toString(36).substring(2, 11);
    localStorage.setItem('fashion_cart_guest_id', guestId);
  }
  return guestId;
}

// Fetch Cart from Supabase
export async function fetchCartFromSupabase(userId: string): Promise<CartItem[]> {
  try {
    const { data, error } = await supabase
      .from('cart_items')
      .select('*')
      .eq('user_id', userId);

    if (error) {
      console.warn('Failed to fetch cart from Supabase:', error.message);
      return [];
    }

    if (!data || data.length === 0) return [];

    return data.map((item: any) => ({
      id: Number(item.product_id),
      name: item.product_name || item.name || '',
      cat: item.product_cat || item.cat || 'Ropa',
      price: item.product_price || item.price || '$0',
      desc: item.product_desc || item.desc || '',
      image: item.product_image || item.image || '',
      quantity: Number(item.quantity) || 1,
    }));
  } catch (err) {
    console.error('Error fetching cart from Supabase:', err);
    return [];
  }
}

// Sync Add Item to Supabase
export async function syncAddToCart(userId: string, product: CartProduct, newQuantity: number): Promise<void> {
  try {
    const payload = {
      user_id: userId,
      product_id: product.id,
      quantity: newQuantity,
      product_name: product.name,
      product_price: product.price,
      product_image: product.image,
      product_cat: product.cat || 'Ropa',
      product_desc: product.desc || '',
      updated_at: new Date().toISOString()
    };

    const { error } = await supabase
      .from('cart_items')
      .upsert([payload], { onConflict: 'user_id,product_id' });

    if (error) {
      console.warn('Sync add to cart to Supabase failed:', error.message);
    }
  } catch (err) {
    console.error('Error syncing add to cart:', err);
  }
}

// Sync Update Quantity in Supabase
export async function syncUpdateQuantity(userId: string, productId: number, quantity: number): Promise<void> {
  try {
    if (quantity <= 0) {
      await syncRemoveFromCart(userId, productId);
      return;
    }

    const { error } = await supabase
      .from('cart_items')
      .update({ quantity, updated_at: new Date().toISOString() })
      .eq('user_id', userId)
      .eq('product_id', productId);

    if (error) {
      console.warn('Sync quantity to Supabase failed:', error.message);
    }
  } catch (err) {
    console.error('Error updating quantity in Supabase:', err);
  }
}

// Sync Remove Item from Supabase
export async function syncRemoveFromCart(userId: string, productId: number): Promise<void> {
  try {
    const { error } = await supabase
      .from('cart_items')
      .delete()
      .eq('user_id', userId)
      .eq('product_id', productId);

    if (error) {
      console.warn('Sync remove from cart in Supabase failed:', error.message);
    }
  } catch (err) {
    console.error('Error removing item from Supabase cart:', err);
  }
}

// Sync Clear Cart in Supabase
export async function syncClearCart(userId: string): Promise<void> {
  try {
    const { error } = await supabase
      .from('cart_items')
      .delete()
      .eq('user_id', userId);

    if (error) {
      console.warn('Sync clear cart in Supabase failed:', error.message);
    }
  } catch (err) {
    console.error('Error clearing cart in Supabase:', err);
  }
}
