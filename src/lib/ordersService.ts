import { supabase } from './supabase';

export interface Order {
  id: string;
  customer: string;
  email?: string;
  date: string;
  total: string;
  status: string;
  phone?: string;
  address?: string;
  driver_id?: string;
  driver_name?: string;
  delivery_fee?: string;
}

// Get all Orders (merging local state with Supabase)
export async function getOrders(): Promise<Order[]> {
  try {
    const { data, error } = await supabase
      .from('orders')
      .select('*');
    
    if (error) {
      console.warn('Failed to fetch orders from Supabase, using localStorage:', error.message);
      return JSON.parse(localStorage.getItem('adminOrders') || '[]');
    }

    if (!data || data.length === 0) {
      const local = JSON.parse(localStorage.getItem('adminOrders') || '[]');
      return local;
    }

    const mappedOrders: Order[] = data.map((item: any) => ({
      id: item.id || item.order_id || '',
      customer: item.customer || item.customer_name || '',
      email: item.email || '',
      date: item.date || item.created_at || '',
      total: item.total || '$0.00',
      status: item.status || 'Pendiente',
      phone: item.phone || '',
      address: item.address || '',
      driver_id: item.driver_id || '',
      driver_name: item.driver_name || '',
      delivery_fee: item.delivery_fee || ''
    }));

    return mappedOrders;
  } catch (err) {
    console.error('Error fetching orders from Supabase:', err);
    return JSON.parse(localStorage.getItem('adminOrders') || '[]');
  }
}

// Save Order
export async function saveOrder(order: Order): Promise<void> {
  // First, save locally
  const allLocal = JSON.parse(localStorage.getItem('adminOrders') || '[]');
  const updatedLocal = [order, ...allLocal.filter((o: any) => o.id !== order.id)];
  localStorage.setItem('adminOrders', JSON.stringify(updatedLocal));

  try {
    const payload: any = {
      id: order.id,
      customer: order.customer,
      email: order.email || '',
      date: order.date,
      total: order.total,
      status: order.status,
      phone: order.phone || '',
      address: order.address || '',
      driver_id: order.driver_id || null,
      driver_name: order.driver_name || null
    };

    const { error } = await supabase
      .from('orders')
      .upsert([payload]);

    if (error) {
      console.warn('Upsert order to Supabase failed, trying core columns:', error.message);
      // Try simple columns
      const corePayload = {
        id: order.id,
        customer: order.customer,
        total: order.total,
        status: order.status
      };
      await supabase.from('orders').upsert([corePayload]);
    }
  } catch (err) {
    console.error('Error saving order to Supabase:', err);
  }
}

// Update Order status (and optional driver assignment & delivery fee)
export async function updateOrderStatus(
  orderId: string, 
  newStatus: string, 
  driverId?: string, 
  driverName?: string,
  deliveryFee?: string
): Promise<void> {
  // First, update locally
  const localOrders: Order[] = JSON.parse(localStorage.getItem('adminOrders') || '[]');
  const updatedOrders = localOrders.map(order => {
    if (order.id === orderId) {
      return { 
        ...order, 
        status: newStatus,
        ...(driverId ? { driver_id: driverId } : {}),
        ...(driverName ? { driver_name: driverName } : {}),
        ...(deliveryFee ? { delivery_fee: deliveryFee } : {})
      };
    }
    return order;
  });
  localStorage.setItem('adminOrders', JSON.stringify(updatedOrders));

  try {
    const updatePayload: any = { status: newStatus };
    if (driverId) updatePayload.driver_id = driverId;
    if (driverName) updatePayload.driver_name = driverName;
    if (deliveryFee) updatePayload.delivery_fee = deliveryFee;

    const { error } = await supabase
      .from('orders')
      .update(updatePayload)
      .eq('id', orderId);

    if (error) {
      console.warn('Failed to update order status in Supabase:', error.message);
    }
  } catch (err) {
    console.error('Error updating order status in Supabase:', err);
  }
}

// Save Delivery/Verification Code in LocalStorage
export async function saveDeliveryCode(orderId: string, code: string): Promise<void> {
  const existingCodes = JSON.parse(localStorage.getItem('orderCodes') || '{}');
  existingCodes[orderId] = code;
  localStorage.setItem('orderCodes', JSON.stringify(existingCodes));

  try {
    // If we have a delivery codes or orders table, we can also store it on Supabase
    await supabase
      .from('orders')
      .update({ delivery_code: code })
      .eq('id', orderId);
  } catch (err) {
    // ignore
  }
}

// Get Delivery/Verification Code
export async function getDeliveryCode(orderId: string): Promise<string> {
  const localCodes = JSON.parse(localStorage.getItem('orderCodes') || '{}');
  if (localCodes[orderId]) return localCodes[orderId];

  try {
    const { data, error } = await supabase
      .from('orders')
      .select('delivery_code')
      .eq('id', orderId)
      .single();
    
    if (data && data.delivery_code) {
      return data.delivery_code;
    }
  } catch (err) {
    // ignore
  }
  return '';
}

// Delete Order
export async function deleteOrder(orderId: string): Promise<void> {
  // First, delete locally
  const localOrders: Order[] = JSON.parse(localStorage.getItem('adminOrders') || '[]');
  const updatedOrders = localOrders.filter(order => order.id !== orderId);
  localStorage.setItem('adminOrders', JSON.stringify(updatedOrders));

  try {
    const { error } = await supabase
      .from('orders')
      .delete()
      .eq('id', orderId);

    if (error) {
      console.warn('Failed to delete order in Supabase:', error.message);
    }
  } catch (err) {
    console.error('Error deleting order in Supabase:', err);
  }
}

// Delete All Orders
export async function deleteAllOrders(): Promise<void> {
  // First, delete locally
  localStorage.removeItem('adminOrders');

  try {
    // Note: Assuming a way to delete all orders in Supabase
    // This might be specific to your table schema
    const { error } = await supabase
      .from('orders')
      .delete()
      .not('id', 'is', null);

    if (error) {
      console.warn('Failed to delete all orders in Supabase:', error.message);
    }
  } catch (err) {
    console.error('Error deleting all orders in Supabase:', err);
  }
}
