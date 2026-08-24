import { supabase } from './supabase';

export interface Driver {
  id: string;
  name: string;
  username?: string;
  phone: string;
  vehicle?: string;
  plateNumber?: string;
  createdAt?: string;
  isActive?: boolean;
}

export async function updateDriverActiveStatus(driverId: string, isActive: boolean): Promise<void> {
  if (!driverId) return;

  // Update local storage list
  const localDriversRaw = localStorage.getItem('fashion_drivers');
  if (localDriversRaw) {
    try {
      const parsed: Driver[] = JSON.parse(localDriversRaw);
      const updated = parsed.map(d => (d.id === driverId || d.phone === driverId) ? { ...d, isActive } : d);
      localStorage.setItem('fashion_drivers', JSON.stringify(updated));
    } catch (e) {
      console.error(e);
    }
  }

  // Update currentDriver if logged in as this driver
  const currentDriverStr = localStorage.getItem('currentDriver');
  if (currentDriverStr) {
    try {
      const curr = JSON.parse(currentDriverStr);
      if (curr.id === driverId || curr.phone === driverId) {
        localStorage.setItem('currentDriver', JSON.stringify({ ...curr, isActive, is_active: isActive }));
      }
    } catch (e) {
      console.error(e);
    }
  }

  // Update Supabase database
  try {
    await supabase
      .from('drivers')
      .update({ is_active: isActive })
      .or(`id.eq.${driverId},phone.eq.${driverId}`);
  } catch (err) {
    console.error('Failed to update driver active status in Supabase:', err);
  }
}

export async function getDrivers(): Promise<Driver[]> {
  try {
    const { data, error } = await supabase
      .from('drivers')
      .select('*')
      .order('created_at', { ascending: false });

    if (!error && data) {
      const realDrivers: Driver[] = data
        .filter((d: any) => d.id !== 'DRV-101' && d.username !== 'driver') // exclude old mock data
        .map((d: any) => ({
          id: d.id || `DRV-${d.phone}`,
          name: d.name || 'Repartidor',
          username: d.username,
          phone: d.phone || '',
          vehicle: d.vehicle || 'Coche / Motocicleta',
          plateNumber: d.plate_number || d.plateNumber || 'ABC-1234',
          createdAt: d.created_at || d.createdAt || new Date().toISOString(),
          isActive: d.is_active !== undefined ? d.is_active : (d.isActive !== undefined ? d.isActive : true)
        }));

      localStorage.setItem('fashion_drivers', JSON.stringify(realDrivers));
      return realDrivers;
    }
  } catch (err) {
    console.error('Failed to query drivers from Supabase:', err);
  }

  // Fallback to local storage if offline/error, excluding mock data
  const localDriversRaw = localStorage.getItem('fashion_drivers');
  if (localDriversRaw) {
    try {
      const parsed: Driver[] = JSON.parse(localDriversRaw);
      return parsed
        .filter((d: Driver) => d.id !== 'DRV-101' && d.username !== 'driver')
        .map((d: Driver) => ({
          ...d,
          isActive: d.isActive !== undefined ? d.isActive : true
        }));
    } catch (e) {
      console.error('Failed to parse local drivers:', e);
    }
  }

  return [];
}
