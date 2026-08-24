export type ProductType = 
  | 'Vestido' 
  | 'Pijama' 
  | 'Pantalones' 
  | 'Zapatos' 
  | 'Camisetas'
  | 'Chasis de PC'
  | 'Tarjeta madre'
  | 'RAM'
  | 'Fuente de poder'
  | 'Procesador'
  | 'Tarjeta gráfica'
  | 'Disco duro'
  | 'Accesorios'
  | 'Smartphones' 
  | 'Laptops & Tablets' 
  | 'Audio & Auriculares' 
  | 'Smartwatches' 
  | 'Accesorios Tech'
  | 'Electrónica';

export type Gender = 'Hombre' | 'Mujer' | 'Niño' | 'Niña' | 'Unisex' | 'General';
export type Department = 'Ropa' | 'Electrónica';

export interface Product {
  id: number;
  name: string;
  cat: string; // 'Mujeres' | 'Hombres' | 'Niños' | 'Electrónica' / 'إلكترونيات'
  department?: Department;
  type?: ProductType | string;
  gender?: Gender | string;
  price: string;
  originalPrice?: string; // Precio anterior/original para mostrar el descuento con línea naranja
  desc: string;
  image: string;
  images?: string[];
  offer?: number;
  isOutOfStock: boolean;
  quantityRemaining: number;
  quantitySold: number;
  sizes?: string[];
}

