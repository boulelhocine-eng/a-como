import { supabase } from './supabase';
import { formatThousandsPrice } from '../utils/price';

const DEFAULT_FEE = '5.000';

export async function getDeliveryFee(): Promise<string> {
  // Check local storage first
  const localFee = localStorage.getItem('fashion_delivery_fee');
  
  try {
    const { data, error } = await supabase
      .from('app_settings')
      .select('value')
      .eq('key', 'delivery_fee')
      .single();

    if (data && data.value) {
      const formatted = formatThousandsPrice(data.value);
      localStorage.setItem('fashion_delivery_fee', formatted || data.value);
      return formatted || data.value;
    }
  } catch (err) {
    // ignore supabase error, fallback to local
  }

  if (localFee) {
    return formatThousandsPrice(localFee) || localFee;
  }

  return DEFAULT_FEE;
}

export async function saveDeliveryFee(fee: string): Promise<string> {
  const formattedFee = formatThousandsPrice(fee) || fee || DEFAULT_FEE;
  localStorage.setItem('fashion_delivery_fee', formattedFee);

  try {
    await supabase
      .from('app_settings')
      .upsert([
        { key: 'delivery_fee', value: formattedFee, updated_at: new Date().toISOString() }
      ]);
  } catch (err) {
    console.warn('Failed to save delivery_fee to Supabase:', err);
  }

  return formattedFee;
}
