import { supabase } from './supabase';
import { Product } from '../types';
import { PRODUCTS } from '../constants';

// Load from localStorage or fallback to default PRODUCTS
const getLocalProducts = (): Product[] => {
  const local = localStorage.getItem('supabase_products_cache');
  if (local) {
    try {
      return JSON.parse(local);
    } catch (e) {
      // ignore
    }
  }
  return PRODUCTS;
};

const saveLocalProducts = (products: Product[]) => {
  localStorage.setItem('supabase_products_cache', JSON.stringify(products));
};

export async function getProducts(): Promise<Product[]> {
  try {
    const { data, error } = await supabase
      .from('products')
      .select('*');
    
    if (error) {
      console.warn('Supabase fetch failed, using local fallback:', error.message);
      return getLocalProducts();
    }

    if (!data || data.length === 0) {
      // If Supabase is empty, let's try to seed it with the default products!
      console.log('Supabase products table is empty. Seeding with default products...');
      const seedData = PRODUCTS.map(p => ({
        id: p.id,
        name: p.name,
        price: p.price,
        original_price: p.originalPrice || null,
        description: p.desc || p.name,
        image: p.image || '',
        cat: p.cat || '',
        type: p.type || '',
        gender: p.gender || '',
        offer: p.offer || 0,
        isOutOfStock: p.isOutOfStock || false,
        quantityRemaining: p.quantityRemaining || 0,
        quantitySold: p.quantitySold || 0,
        sizes: p.sizes || []
      }));

      // Try full seed
      const { error: seedErr } = await supabase.from('products').insert(seedData);
      if (seedErr) {
        console.warn('Full seed failed, trying to seed only core columns (id, name, price, description)...');
        const coreSeedData = PRODUCTS.map(p => ({
          id: p.id,
          name: p.name,
          price: p.price,
          description: p.desc || p.name
        }));
        await supabase.from('products').insert(coreSeedData);
      }
      return PRODUCTS;
    }

    // Map Supabase columns to our Product interface
    const mappedProducts: Product[] = data.map((item: any) => ({
      id: item.id,
      name: item.name || '',
      price: item.price || '$0.00',
      originalPrice: item.original_price || item.originalPrice || undefined,
      desc: item.description || item.desc || '',
      image: item.image || 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?q=80&w=800&auto=format&fit=crop',
      images: Array.isArray(item.images) && item.images.length > 0 ? item.images : (item.image ? [item.image] : []),
      cat: item.cat || item.category || 'Mujeres',
      type: item.type || 'Vestido',
      gender: item.gender || 'Mujer',
      offer: item.offer || 0,
      isOutOfStock: item.isOutOfStock || false,
      quantityRemaining: item.quantityRemaining !== undefined ? item.quantityRemaining : 10,
      quantitySold: item.quantitySold !== undefined ? item.quantitySold : 0,
      sizes: Array.isArray(item.sizes) ? item.sizes : (typeof item.sizes === 'string' ? item.sizes.split(',').map((s: string) => s.trim()).filter(Boolean) : (PRODUCTS.find(p => p.id === item.id)?.sizes || []))
    }));

    saveLocalProducts(mappedProducts);
    return mappedProducts;
  } catch (err) {
    console.error('Error fetching products from Supabase:', err);
    return getLocalProducts();
  }
}

export async function addProduct(product: Product): Promise<Product> {
  try {
    // Try to insert with all fields
    const payload = {
      id: product.id,
      name: product.name,
      price: product.price,
      original_price: product.originalPrice || null,
      description: product.desc,
      image: product.image,
      images: product.images || (product.image ? [product.image] : []),
      cat: product.cat,
      type: product.type,
      gender: product.gender,
      offer: product.offer,
      isOutOfStock: product.isOutOfStock,
      quantityRemaining: product.quantityRemaining,
      quantitySold: product.quantitySold,
      sizes: product.sizes || []
    };

    const { error } = await supabase
      .from('products')
      .insert([payload]);

    if (error) {
      console.warn('Insert with all fields failed, trying only core columns (id, name, price, description):', error.message);
      const corePayload = {
        id: product.id,
        name: product.name,
        price: product.price,
        description: product.desc
      };
      const { error: coreErr } = await supabase
        .from('products')
        .insert([corePayload]);
      
      if (coreErr) {
        throw coreErr;
      }
    }
    
    // Update local cache
    const current = getLocalProducts();
    saveLocalProducts([...current, product]);
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new Event('products_updated'));
    }
    return product;
  } catch (err) {
    console.error('Failed to add product to Supabase, saving locally:', err);
    const current = getLocalProducts();
    saveLocalProducts([...current, product]);
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new Event('products_updated'));
    }
    return product;
  }
}

export async function updateProduct(product: Product): Promise<Product> {
  try {
    const primaryImg = product.images && product.images.length > 0 ? product.images[0] : (product.image || '');
    const allImgs = product.images && product.images.length > 0 ? product.images : (product.image ? [product.image] : []);

    const payload = {
      name: product.name,
      price: product.price,
      original_price: product.originalPrice || null,
      description: product.desc,
      image: primaryImg,
      images: allImgs,
      cat: product.cat,
      type: product.type,
      gender: product.gender,
      offer: product.offer,
      isOutOfStock: product.isOutOfStock,
      quantityRemaining: product.quantityRemaining,
      quantitySold: product.quantitySold,
      sizes: product.sizes || []
    };

    console.log('Attempting full database update for product id:', product.id);
    const { error } = await supabase
      .from('products')
      .update(payload)
      .eq('id', product.id);

    if (error) {
      console.warn('Full payload update failed, trying fallback payload with image/images array:', error.message);
      const fallbackPayload = {
        name: product.name,
        price: product.price,
        description: product.desc,
        image: primaryImg,
        images: allImgs
      };
      
      const { error: fallbackErr } = await supabase
        .from('products')
        .update(fallbackPayload)
        .eq('id', product.id);
      
      if (fallbackErr) {
        console.warn('Fallback with images array also failed, trying fallback without images array column:', fallbackErr.message);
        
        // This payload drops the "images" column in case it doesn't exist, has size constraints, or uses unsupported array formats in Supabase
        const secondFallbackPayload = {
          name: product.name,
          price: product.price,
          description: product.desc,
          image: primaryImg,
          cat: product.cat,
          type: product.type,
          gender: product.gender,
          offer: product.offer,
          isOutOfStock: product.isOutOfStock,
          quantityRemaining: product.quantityRemaining,
          quantitySold: product.quantitySold
        };
        
        const { error: secondFallbackErr } = await supabase
          .from('products')
          .update(secondFallbackPayload)
          .eq('id', product.id);
          
        if (secondFallbackErr) {
          console.warn('Second fallback also failed, trying minimal core payload with primary image:', secondFallbackErr.message);
          
          // Minimal payload containing only core columns that are absolutely guaranteed to exist
          const minimalPayload = {
            name: product.name,
            price: product.price,
            description: product.desc,
            image: primaryImg
          };
          
          const { error: minimalErr } = await supabase
            .from('products')
            .update(minimalPayload)
            .eq('id', product.id);
            
          if (minimalErr) {
            console.error('All database update attempts failed. Error:', minimalErr.message);
            throw new Error(`Database update failed completely: ${minimalErr.message}`);
          } else {
            console.log('Minimal core payload updated successfully with cover image.');
          }
        } else {
          console.log('Product details updated successfully without images array.');
        }
      } else {
        console.log('Product fallback payload updated successfully with images.');
      }
    } else {
      console.log('Product full payload updated successfully.');
    }

    // Update local cache
    const current = getLocalProducts();
    const updated = current.map(p => p.id === product.id ? product : p);
    saveLocalProducts(updated);
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new Event('products_updated'));
    }
    return product;
  } catch (err: any) {
    console.error('Failed to update product in Supabase, updating locally:', err);
    const current = getLocalProducts();
    const updated = current.map(p => p.id === product.id ? product : p);
    saveLocalProducts(updated);
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new Event('products_updated'));
    }
    return product;
  }
}

export async function deleteProduct(id: number): Promise<void> {
  try {
    const { error } = await supabase
      .from('products')
      .delete()
      .eq('id', id);
    
    if (error) throw error;

    // Update local cache
    const current = getLocalProducts();
    const filtered = current.filter(p => p.id !== id);
    saveLocalProducts(filtered);
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new Event('products_updated'));
    }
  } catch (err) {
    console.error('Failed to delete product in Supabase, deleting locally:', err);
    const current = getLocalProducts();
    const filtered = current.filter(p => p.id !== id);
    saveLocalProducts(filtered);
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new Event('products_updated'));
    }
  }
}
