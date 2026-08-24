import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'motion/react';
import { Product } from '../../types';
import { useLanguage } from '../../context/LanguageContext';
import { getProducts, addProduct, updateProduct, deleteProduct } from '../../lib/productsService';
import { getFormattedOriginalPrice, formatThousandsPrice } from '../../utils/price';
import { 
  Upload, 
  Image as ImageIcon, 
  Link as LinkIcon, 
  X, 
  FileImage, 
  Check, 
  RefreshCw,
  Trash2,
  Edit2,
  AlertCircle,
  Star,
  Plus,
  ChevronLeft,
  ChevronRight,
  Layers,
  Globe,
  Sparkles,
  Cpu,
  Shirt,
  Monitor,
  HardDrive
} from 'lucide-react';

// Helper to clean and upgrade Alibaba & AliExpress image URLs to full high-definition original images
export const cleanAlibabaUrl = (url: string): string => {
  let cleaned = url.trim();
  if (!cleaned) return '';

  if (cleaned.startsWith('//')) cleaned = 'https:' + cleaned;
  if (cleaned.startsWith('http://')) cleaned = cleaned.replace('http://', 'https://');
  if (cleaned.startsWith('www.')) cleaned = 'https://' + cleaned;

  // Remove escaping backslashes if present
  cleaned = cleaned.replace(/\\/g, '');

  // If it's an Alibaba / AliExpress CDN image URL (alicdn, alibaba, aliexpress, aliexpress-media)
  if (/alicdn\.com|alibaba\.com|aliexpress\.com|aliexpress-media\.com/i.test(cleaned)) {
    // 1. Remove thumbnail/compression suffixes like _640x640.jpg, _350x350.png, _Q90.jpg_.webp, _220x220.jpg, _50x50.jpg, _Q75.jpg, _.webp, .jpg_Q90.jpg
    cleaned = cleaned.replace(/_(?:\d+x\d+|Q\d+|xz|Q\d+.*|\.webp)+.*$/i, '');
    cleaned = cleaned.replace(/\.(jpg|jpeg|png|webp)_(?:Q\d+|\d+x\d+|\.webp).*$/i, '.$1');
    cleaned = cleaned.replace(/_(?:\d+x\d+)\.(jpg|png|jpeg|webp)$/i, '');
    
    // 2. Remove trailing URL query params if they restrict image size
    if (cleaned.includes('alicdn.com') && cleaned.includes('?')) {
      cleaned = cleaned.split('?')[0];
    }
  }

  return cleaned;
};

// Check if a URL or text is an Alibaba or AliExpress product page link
export const isAlibabaProductPageUrl = (text: string): boolean => {
  if (!text) return false;
  return /(?:aliexpress\.com\/item|alibaba\.com\/product-detail|alibaba\.com\/p-detail|a\.aliexpress\.com|s\.click\.aliexpress\.com)/i.test(text);
};

// Extract product images directly from an Alibaba or AliExpress product detail page
export const fetchImagesFromAlibabaProductPage = async (pageUrl: string): Promise<string[]> => {
  try {
    const proxyUrls = [
      `https://api.allorigins.win/get?url=${encodeURIComponent(pageUrl)}`,
      `https://corsproxy.io/?${encodeURIComponent(pageUrl)}`
    ];

    let htmlContent = '';
    
    for (const proxy of proxyUrls) {
      try {
        const response = await fetch(proxy);
        if (response.ok) {
          if (proxy.includes('allorigins')) {
            const data = await response.json();
            htmlContent = data.contents || '';
          } else {
            htmlContent = await response.text();
          }
          if (htmlContent && htmlContent.length > 500) {
            break;
          }
        }
      } catch {
        // try next proxy silently
      }
    }

    if (!htmlContent) return [];

    // Extract all alicdn image matches from HTML/JSON
    const matches = htmlContent.match(/(?:https?:)?\/\/[a-z0-9.-]*alicdn\.com\/[^\s"'<>\\]+?\.(?:jpg|jpeg|png|webp)(?:_[^\s"'<>\\]+)?/gi);
    
    if (!matches || matches.length === 0) return [];

    const extractedImages: string[] = [];
    for (let rawMatch of matches) {
      let cleaned = cleanAlibabaUrl(rawMatch);
      if (cleaned && 
          !cleaned.includes('avatar') && 
          !cleaned.includes('logo') && 
          !cleaned.includes('icon') &&
          !extractedImages.includes(cleaned)) {
        extractedImages.push(cleaned);
      }
    }

    return extractedImages;
  } catch (err) {
    console.error('Failed to extract images from Alibaba/AliExpress page:', err);
    return [];
  }
};

// Helper to extract and normalize URLs from any pasted text or input string, including Photopea & Alibaba/AliExpress links
const extractAndNormalizeUrls = (rawText: string): string[] => {
  if (!rawText || !rawText.trim()) return [];

  // Handle Photopea shared JSON or URI parameters
  if (rawText.includes('photopea.com')) {
    try {
      const urlMatches = rawText.match(/https?:\/\/[^\s"'<>]+\.(?:jpg|jpeg|png|webp|gif|svg|avif)(?:\?[^\s"'<>]*)?/gi);
      if (urlMatches && urlMatches.length > 0) {
        return Array.from(new Set(urlMatches.map(cleanAlibabaUrl)));
      }
      const decoded = decodeURIComponent(rawText);
      const decodedMatches = decoded.match(/https?:\/\/[^\s"'<>]+\.(?:jpg|jpeg|png|webp|gif|svg|avif)(?:\?[^\s"'<>]*)?/gi);
      if (decodedMatches && decodedMatches.length > 0) {
        return Array.from(new Set(decodedMatches.map(cleanAlibabaUrl)));
      }
    } catch {
      // fallback
    }
  }

  // Direct check for Alibaba / AliExpress CDN image matches (including alicdn.com/kf/...)
  const alibabaMatches = rawText.match(/(?:https?:)?\/\/[a-z0-9.-]*(?:alicdn|alibaba|aliexpress)\.com\/[^\s"'<>\\]+?\.(?:jpg|jpeg|png|webp)(?:_[^\s"'<>\\]+)?/gi);

  // 1. Extract URLs from HTML img tags or Markdown image syntax if present
  let processedText = rawText
    .replace(/<img[^>]+src=["']([^"']+)["']/gi, ' $1 ')
    .replace(/\[.*?\]\((https?:\/\/[^\s\)]+)\)/gi, ' $1 ');

  // 2. Split text by newlines, spaces, tabs, commas, or quotes
  const tokens = processedText.split(/[\n,\t\s"'<>"']+/);
  const validUrls: string[] = [];

  // Add cleaned Alibaba direct CDN matches first
  if (alibabaMatches && alibabaMatches.length > 0) {
    for (let match of alibabaMatches) {
      const cleaned = cleanAlibabaUrl(match);
      if (cleaned && !validUrls.includes(cleaned)) {
        validUrls.push(cleaned);
      }
    }
  }

  for (let token of tokens) {
    let url = token.trim();
    if (!url) continue;

    // Strip trailing or leading punctuation/brackets
    url = url.replace(/[\)\];>]+$/, '').replace(/^[\(<\[]+/, '');

    // Preserve base64 image data URIs
    if (url.startsWith('data:image/')) {
      if (!validUrls.includes(url)) validUrls.push(url);
      continue;
    }

    // Auto-fix domain missing protocol
    if (url.startsWith('www.')) {
      url = 'https://' + url;
    } else if (url.startsWith('//')) {
      url = 'https:' + url;
    } else if (!/^https?:\/\//i.test(url) && /^[a-zA-Z0-9-]+\.[a-zA-Z]{2,}\/.+/i.test(url)) {
      url = 'https://' + url;
    }

    // Skip raw product page URLs here (handled separately by product page fetcher)
    if (isAlibabaProductPageUrl(url)) {
      continue;
    }

    // Validate standard HTTP/HTTPS URL syntax
    if (/^https?:\/\/[^\s\/$.?#].[^\s]*$/i.test(url) || /^https?:\/\/.+/i.test(url)) {
      const cleaned = cleanAlibabaUrl(url);
      if (cleaned && !validUrls.includes(cleaned)) {
        validUrls.push(cleaned);
      }
    }
  }

  return validUrls;
};

// Hardware & Electronics category list
export const PC_HARDWARE_CATEGORIES = [
  'Chasis de PC',
  'Tarjeta madre',
  'RAM',
  'Fuente de poder',
  'Procesador',
  'Tarjeta gráfica',
  'Disco duro',
  'Accesorios',
  'Electrónica',
  'Smartphones',
  'Audio & Auriculares',
  'Smartwatches',
  'Laptops & Tablets',
  'Accesorios Tech'
];

// Preset fashion gallery collections for quick testing
const fashionPresets = [
  {
    name: 'Vestido elegante (4 imágenes)',
    images: [
      'https://images.unsplash.com/photo-1595777457583-95e059d581b8?q=80&w=800&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1539109136881-3be0616acf4b?q=80&w=800&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?q=80&w=800&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1496747611176-843222e1e57c?q=80&w=800&auto=format&fit=crop'
    ]
  },
  {
    name: 'Abaya y vestido de noche (3 imágenes)',
    images: [
      'https://images.unsplash.com/photo-1566174053879-31528523f8ae?q=80&w=800&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1502716119720-b23a93e5fe1b?q=80&w=800&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1572804013309-59a88b7e92f1?q=80&w=800&auto=format&fit=crop'
    ]
  },
  {
    name: 'Bolso y calzado (3 imágenes)',
    images: [
      'https://images.unsplash.com/photo-1584917865442-de89df76afd3?q=80&w=800&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1590874103328-eac38a683ce7?q=80&w=800&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1548036328-c9fa89d128fa?q=80&w=800&auto=format&fit=crop'
    ]
  }
];

// Preset hardware & electronics collections for quick testing
const techPresets = [
  {
    name: 'Chasis Gamer ATX RGB (3 imágenes)',
    images: [
      'https://images.unsplash.com/photo-1587202372775-e229f172b9d7?q=80&w=800&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1547394765-185e1e68f34e?q=80&w=800&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1593640408182-31c70c8268f5?q=80&w=800&auto=format&fit=crop'
    ]
  },
  {
    name: 'Tarjeta Gráfica GPU RTX (3 imágenes)',
    images: [
      'https://images.unsplash.com/photo-1591488320449-011701bb6704?q=80&w=800&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1587202372634-32705e3bf49c?q=80&w=800&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1550745165-9bc0b252726f?q=80&w=800&auto=format&fit=crop'
    ]
  },
  {
    name: 'Memoria RAM & Placa Base (3 imágenes)',
    images: [
      'https://images.unsplash.com/photo-1562976540-1502c2145186?q=80&w=800&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1518770660439-4636190af475?q=80&w=800&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1597872200969-2b65d56bd16b?q=80&w=800&auto=format&fit=crop'
    ]
  },
  {
    name: 'Smartphones & Audio Gadgets (3 imágenes)',
    images: [
      'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?q=80&w=800&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1508685096489-7aacd43bd3b1?q=80&w=800&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1590658268037-6bf12165a8df?q=80&w=800&auto=format&fit=crop'
    ]
  }
];

// Helper to compress images client-side using standard HTML5 Canvas
const compressImage = (file: File, maxWidth: number = 900, maxHeight: number = 900, quality: number = 0.75): Promise<string> => {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = (readerEvent) => {
      const image = new Image();
      image.onload = () => {
        const canvas = document.createElement('canvas');
        let width = image.width;
        let height = image.height;

        if (width > height) {
          if (width > maxWidth) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          }
        } else {
          if (height > maxHeight) {
            width = Math.round((width * maxHeight) / height);
            height = maxHeight;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(image, 0, 0, width, height);
          const compressedDataUrl = canvas.toDataURL('image/jpeg', quality);
          resolve(compressedDataUrl);
        } else {
          resolve(readerEvent.target?.result as string);
        }
      };
      image.src = readerEvent.target?.result as string;
    };
    reader.readAsDataURL(file);
  });
};

export default function ProductManagement() {
  const { lang } = useLanguage();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [newProduct, setNewProduct] = useState<Partial<Product>>({
    name: '', cat: '\u0646\u0633\u0627\u0626\u064a', price: '', desc: '', image: '', images: [], type: '\u0641\u0633\u062a\u0627\u0646', gender: '\u0627\u0645\u0631\u0623\u0629', isOutOfStock: false, quantityRemaining: 10, quantitySold: 0, sizes: []
  });

  // Image addition & Interactive Gallery state
  const [selectedGalleryIndex, setSelectedGalleryIndex] = useState<number>(0);
  const [urlInput, setUrlInput] = useState<string>('');
  const [isFetchingUrl, setIsFetchingUrl] = useState(false);
  const [imageTab, setImageTab] = useState<'url' | 'upload'>('url');
  const [dragOver, setDragOver] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [productToDelete, setProductToDelete] = useState<number | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [customSize, setCustomSize] = useState('');

  // Helper to resolve current product's gallery images
  const galleryImages: string[] = Array.isArray(newProduct.images) && newProduct.images.length > 0
    ? newProduct.images
    : (newProduct.image ? [newProduct.image] : []);

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const data = await getProducts();
      setProducts(data);
    } catch (err) {
      console.error('Failed to load products:', err);
    } finally {
      setLoading(false);
    }
  };

  const confirmDelete = async () => {
    if (productToDelete) {
      try {
        await deleteProduct(productToDelete);
        await fetchProducts();
        setProductToDelete(null);
      } catch (err) {
        console.error('Failed to delete product:', err);
      }
    }
  };

  const handleSaveProduct = async () => {
    if (!newProduct.name || !newProduct.price) return;
    
    const finalImages = Array.isArray(newProduct.images) && newProduct.images.length > 0
      ? newProduct.images
      : (newProduct.image ? [newProduct.image] : []);

    const primaryImage = finalImages.length > 0 ? finalImages[0] : (newProduct.image || '');
    const isElect = newProduct.department === 'Electrónica' || PC_HARDWARE_CATEGORIES.includes(newProduct.cat || '') || PC_HARDWARE_CATEGORIES.includes(newProduct.type || '');

    try {
      if (editingProduct) {
        const updatedItem = { 
          ...editingProduct, 
          ...newProduct, 
          department: isElect ? 'Electrónica' : 'Ropa',
          gender: isElect ? 'General' : (newProduct.gender || 'Mujer'),
          image: primaryImage,
          images: finalImages 
        } as Product;
        await updateProduct(updatedItem);
        setEditingProduct(null);
        setSuccessMessage('¡Producto actualizado con éxito!');
      } else {
        const product: Product = {
          id: Date.now(),
          name: newProduct.name as string,
          cat: newProduct.cat as string,
          department: isElect ? 'Electrónica' : 'Ropa',
          price: newProduct.price as string,
          originalPrice: newProduct.originalPrice ? newProduct.originalPrice : undefined,
          desc: newProduct.desc as string,
          image: primaryImage,
          images: finalImages,
          type: newProduct.type as any,
          gender: isElect ? 'General' : (newProduct.gender || 'Mujer'),
          offer: newProduct.offer || 0,
          isOutOfStock: newProduct.isOutOfStock || false,
          quantityRemaining: newProduct.quantityRemaining || 0,
          quantitySold: newProduct.quantitySold || 0,
          sizes: newProduct.sizes || [],
        };
        await addProduct(product);
        setSuccessMessage('¡Producto agregado con éxito!');
      }
      
      setTimeout(() => setSuccessMessage(null), 4000);
      
      setNewProduct({
        name: '', 
        cat: 'Chasis de PC', 
        department: 'Electrónica',
        price: '', 
        originalPrice: '',
        desc: '', 
        image: '', 
        images: [], 
        type: 'Chasis de PC', 
        gender: 'General', 
        isOutOfStock: false, 
        quantityRemaining: 10, 
        quantitySold: 0, 
        sizes: []
      });
      setUrlInput('');
      setSelectedGalleryIndex(0);
      setImageError(false);
    } catch (err) {
      console.error('Failed to save product:', err);
    } finally {
      await fetchProducts();
    }
  };

  const handleEdit = (product: Product) => {
    setEditingProduct(product);
    const isElect = product.department === 'Electrónica' || PC_HARDWARE_CATEGORIES.includes(product.cat) || PC_HARDWARE_CATEGORIES.includes(product.type || '');
    const prodImages = Array.isArray(product.images) && product.images.length > 0
      ? product.images
      : (product.image ? [product.image] : []);
    setNewProduct({
      ...product,
      department: isElect ? 'Electrónica' : 'Ropa',
      gender: isElect ? 'General' : (product.gender || 'Mujer'),
      images: prodImages
    });
    setSelectedGalleryIndex(0);
    setImageError(false);
    if (product.image) {
      if (product.image.startsWith('data:image')) {
        setImageTab('upload');
      } else {
        setImageTab('url');
      }
    }
  };

  const handleDelete = async (id: number) => {
    setProductToDelete(id);
  };

  // Add single/multiple extracted URLs or fetch images directly from Alibaba & AliExpress product links
  const handleAddUrlToGallery = async () => {
    const extracted = extractAndNormalizeUrls(urlInput);
    const hasProductPage = isAlibabaProductPageUrl(urlInput);

    if (extracted.length === 0 && !hasProductPage) {
      alert('No se encontraron enlaces de imagen o producto de Alibaba/AliExpress válidos.');
      return;
    }

    let newImages = [...extracted];

    if (hasProductPage) {
      setIsFetchingUrl(true);
      try {
        const tokens = urlInput.split(/[\s,\n]+/);
        for (let token of tokens) {
          const cleanToken = token.trim();
          if (isAlibabaProductPageUrl(cleanToken)) {
            const fetched = await fetchImagesFromAlibabaProductPage(cleanToken);
            for (let img of fetched) {
              if (!newImages.includes(img)) {
                newImages.push(img);
              }
            }
          }
        }
      } catch (err) {
        console.error('Error fetching product images from link:', err);
      } finally {
        setIsFetchingUrl(false);
      }
    }

    if (newImages.length === 0) {
      alert('No se pudieron extraer imágenes automáticamente del enlace de AliExpress/Alibaba. Para un resultado instantáneo, haz clic derecho en la imagen del producto -> "Copiar dirección de la imagen" y pégala aquí.');
      return;
    }

    const updated = [...galleryImages];
    for (let img of newImages) {
      if (!updated.includes(img)) {
        updated.push(img);
      }
    }

    setNewProduct(prev => ({
      ...prev,
      images: updated,
      image: prev.image || updated[0]
    }));
    setUrlInput('');
    setSelectedGalleryIndex(updated.length - 1);
    setImageError(false);
  };

  const handleAddPresetImages = (presetImages: string[]) => {
    const updated = [...galleryImages, ...presetImages];
    setNewProduct(prev => ({
      ...prev,
      images: updated,
      image: prev.image || updated[0]
    }));
    setSelectedGalleryIndex(updated.length - 1);
    setImageError(false);
  };

  // Process multiple file uploads for gallery with canvas-level image compression
  const processImageFiles = (files: FileList | File[]) => {
    const validFiles = Array.from(files).filter(f => f.type.startsWith('image/'));
    if (validFiles.length === 0) {
      alert('Por favor seleccione archivos de imagen válidos');
      return;
    }

    const compressionPromises = validFiles.map(file => compressImage(file, 900, 900, 0.75));

    Promise.all(compressionPromises).then(newImageUrls => {
      const updated = [...galleryImages, ...newImageUrls];
      setNewProduct(prev => ({
        ...prev,
        images: updated,
        image: prev.image || updated[0]
      }));
      setSelectedGalleryIndex(updated.length - 1);
      setImageError(false);
    });
  };

  const handleMultipleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      processImageFiles(e.target.files);
    }
  };

  // Drag and drop handlers
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = () => {
    setDragOver(false);
  };

  const handleDropMultiple = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processImageFiles(e.dataTransfer.files);
    }
  };

  const handleSetCoverImage = (index: number) => {
    if (index === 0) return;
    const updated = [...galleryImages];
    const [selected] = updated.splice(index, 1);
    updated.unshift(selected);
    setNewProduct(prev => ({
      ...prev,
      images: updated,
      image: updated[0]
    }));
    setSelectedGalleryIndex(0);
  };

  const handleRemoveGalleryImage = (index: number) => {
    const updated = galleryImages.filter((_, i) => i !== index);
    setNewProduct(prev => ({
      ...prev,
      images: updated,
      image: updated.length > 0 ? updated[0] : ''
    }));
    if (selectedGalleryIndex >= updated.length) {
      setSelectedGalleryIndex(Math.max(0, updated.length - 1));
    }
  };

  const handleMoveImage = (index: number, direction: 'left' | 'right') => {
    const targetIndex = direction === 'left' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= galleryImages.length) return;
    const updated = [...galleryImages];
    const temp = updated[index];
    updated[index] = updated[targetIndex];
    updated[targetIndex] = temp;
    setNewProduct(prev => ({
      ...prev,
      images: updated,
      image: updated[0]
    }));
    setSelectedGalleryIndex(targetIndex);
  };

  const clearAllGallery = () => {
    setNewProduct(prev => ({ ...prev, image: '', images: [] }));
    setSelectedGalleryIndex(0);
    setImageError(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className={`space-y-8 text-left [direction:ltr]`}>
      
      {/* Add/Edit Product Form */}
      <div className="bg-white rounded-2xl border border-neutral-100 shadow-sm overflow-hidden transition-all duration-300">
        <div className="p-6 border-b border-neutral-100 bg-neutral-50/50 flex justify-between items-center">
          <h3 className="text-lg font-bold text-neutral-900 flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-primary"></span>
            {editingProduct 
              ? ('Editar Producto') 
              : ('Agregar Nuevo Producto')}
          </h3>
          {editingProduct && (
            <button 
              onClick={() => {
                setEditingProduct(null); 
                setNewProduct({ name: '', cat: '\u0646\u0633\u0627\u0626\u064a', price: '', desc: '', image: '', type: '\u0641\u0633\u062a\u0627\u0646', gender: '\u0627\u0645\u0631\u0623\u0629', isOutOfStock: false, quantityRemaining: 10, quantitySold: 0, sizes: [] });
                setImageError(false);
              }}
              className="text-sm font-bold text-red-500 hover:bg-red-50 px-3 py-1.5 rounded-lg transition-colors cursor-pointer"
            >
              'Cancelar Edición'
            </button>
          )}
        </div>

        {successMessage && (
          <div className="mx-6 mt-6 p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl font-bold text-sm flex items-center gap-3 shadow-sm animate-fade-in">
            <div className="w-8 h-8 rounded-full bg-emerald-500 text-white flex items-center justify-center flex-shrink-0">
              ✓
            </div>
            <span>{successMessage}</span>
          </div>
        )}

        <div className="p-6 grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* Form Fields: 7 Columns on Large Screens */}
          <div className="lg:col-span-7 space-y-5">
            
            {/* Title / Description */}
            <div className="grid grid-cols-1 gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-neutral-500">'Nombre del Producto *'</label>
                <input 
                  type="text" 
                  placeholder='Nombre del Producto' 
                  className="p-3 rounded-xl border border-neutral-200 focus:border-primary focus:ring-2 focus:ring-primary/10 outline-none transition-all font-medium text-neutral-800" 
                  value={newProduct.name} 
                  onChange={e => setNewProduct({...newProduct, name: e.target.value})} 
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-neutral-500">'Descripción'</label>
                <textarea 
                  rows={2}
                  placeholder='Descripción del producto' 
                  className="p-3 rounded-xl border border-neutral-200 focus:border-primary focus:ring-2 focus:ring-primary/10 outline-none transition-all font-medium text-neutral-800 resize-none" 
                  value={newProduct.desc || ''} 
                  onChange={e => setNewProduct({...newProduct, desc: e.target.value})} 
                />
              </div>
            </div>

            {/* Department / Macro-Category Selector */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-neutral-600 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-primary"></span>
                القسم الرئيسي للمنتج (Departamento)
              </label>
              <div className="grid grid-cols-2 gap-2 bg-neutral-100 p-1.5 rounded-2xl border border-neutral-200/70">
                <button
                  type="button"
                  onClick={() => {
                    setNewProduct({
                      ...newProduct,
                      department: 'Electrónica',
                      cat: 'Chasis de PC',
                      type: 'Chasis de PC',
                      gender: 'General',
                      sizes: []
                    });
                  }}
                  className={`py-2.5 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
                    (newProduct.department === 'Electrónica' || PC_HARDWARE_CATEGORIES.includes(newProduct.cat || ''))
                      ? 'bg-white text-primary shadow-sm border border-neutral-200/50'
                      : 'text-neutral-500 hover:text-neutral-800'
                  }`}
                >
                  <Cpu size={16} className={(newProduct.department === 'Electrónica' || PC_HARDWARE_CATEGORIES.includes(newProduct.cat || '')) ? 'text-primary' : 'text-neutral-400'} />
                  <span>Electrónica & Componentes PC (إلكترونيات)</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setNewProduct({
                      ...newProduct,
                      department: 'Ropa',
                      cat: 'نسائي',
                      type: 'Vestido',
                      gender: 'Mujer',
                      sizes: []
                    });
                  }}
                  className={`py-2.5 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
                    (newProduct.department !== 'Electrónica' && !PC_HARDWARE_CATEGORIES.includes(newProduct.cat || ''))
                      ? 'bg-white text-primary shadow-sm border border-neutral-200/50'
                      : 'text-neutral-500 hover:text-neutral-800'
                  }`}
                >
                  <Shirt size={16} className={(newProduct.department !== 'Electrónica' && !PC_HARDWARE_CATEGORIES.includes(newProduct.cat || '')) ? 'text-primary' : 'text-neutral-400'} />
                  <span>Moda, Ropa y Calzado (ملابس وأحذية)</span>
                </button>
              </div>
            </div>

            {/* Classification (Category, Type & Gender ONLY for Clothing) */}
            {(() => {
              const isElect = newProduct.department === 'Electrónica' || PC_HARDWARE_CATEGORIES.includes(newProduct.cat || '') || PC_HARDWARE_CATEGORIES.includes(newProduct.type || '');
              return (
                <div className={`grid grid-cols-1 ${isElect ? 'sm:grid-cols-2' : 'sm:grid-cols-3'} gap-4`}>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-bold text-neutral-500">Categoría Principal (الفئة)</label>
                    <select 
                      className="p-3 rounded-xl border border-neutral-200 focus:border-primary focus:ring-2 focus:ring-primary/10 outline-none bg-white transition-all font-bold text-neutral-800" 
                      value={newProduct.cat} 
                      onChange={e => {
                        const selectedCat = e.target.value;
                        let defaultType = newProduct.type;
                        if (isElect) {
                          defaultType = selectedCat === 'Electrónica' ? 'Smartphones' : (selectedCat as any);
                        } else {
                          defaultType = 'Vestido';
                        }
                        setNewProduct({
                          ...newProduct, 
                          cat: selectedCat,
                          type: defaultType,
                          gender: isElect ? 'General' : (newProduct.gender === 'General' ? 'Mujer' : newProduct.gender || 'Mujer')
                        });
                      }}
                    >
                      {isElect ? (
                        <>
                          <optgroup label="Hardware y Componentes PC">
                            <option value="Chasis de PC">Chasis de PC (صناديق الكمبيوتر)</option>
                            <option value="Tarjeta madre">Tarjeta Madre (اللوحة الأم)</option>
                            <option value="RAM">RAM (الذاكرة العشوائية)</option>
                            <option value="Fuente de poder">Fuente de Poder (مزود الطاقة)</option>
                            <option value="Procesador">Procesador (المعالج CPU)</option>
                            <option value="Tarjeta gráfica">Tarjeta Gráfica (كرت الشاشة GPU)</option>
                            <option value="Disco duro">Disco Duro & SSD (القرص الصلب)</option>
                            <option value="Accesorios">Accesorios (إكسسوارات وملحقات)</option>
                          </optgroup>
                          <optgroup label="Dispositivos y Gadgets">
                            <option value="Electrónica">Electrónica General / Gadgets</option>
                          </optgroup>
                        </>
                      ) : (
                        <>
                          <option value="نسائي">Mujeres (نسائي)</option>
                          <option value="رجالي">Hombres (رجالي)</option>
                          <option value="أطفال">Niños (أطفال)</option>
                        </>
                      )}
                    </select>
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-bold text-neutral-500">Tipo de Producto (النوع)</label>
                    <select 
                      className="p-3 rounded-xl border border-neutral-200 focus:border-primary focus:ring-2 focus:ring-primary/10 outline-none bg-white transition-all font-bold text-neutral-800" 
                      value={newProduct.type} 
                      onChange={e => setNewProduct({...newProduct, type: e.target.value as any})}
                    >
                      {isElect ? (
                        <>
                          <option value="Chasis de PC">Chasis de PC (Gabinete / Case)</option>
                          <option value="Tarjeta madre">Tarjeta Madre (Motherboard)</option>
                          <option value="RAM">Memoria RAM</option>
                          <option value="Fuente de poder">Fuente de Poder (PSU)</option>
                          <option value="Procesador">Procesador (CPU)</option>
                          <option value="Tarjeta gráfica">Tarjeta Gráfica (GPU)</option>
                          <option value="Disco duro">Disco Duro (HDD / SSD / NVMe)</option>
                          <option value="Accesorios">Accesorios (Teclado, Mouse, etc.)</option>
                          <option value="Smartphones">Smartphones (هواتف)</option>
                          <option value="Audio & Auriculares">Audio & Auriculares (سماعات)</option>
                          <option value="Smartwatches">Smartwatches (ساعات ذكية)</option>
                          <option value="Laptops & Tablets">Laptops & Tablets (لوحيات)</option>
                          <option value="Electrónica">Electrónica General</option>
                        </>
                      ) : (
                        <>
                          <option value="Vestido">Vestido (فستان)</option>
                          <option value="Pijama">Pijama (بيجاما)</option>
                          <option value="Pantalones">Pantalones (سروال)</option>
                          <option value="Camisetas">Camisetas (قميص / تيشيرت)</option>
                          <option value="Zapatos">Zapatos (أحذية)</option>
                        </>
                      )}
                    </select>
                  </div>

                  {/* Strictly hide gender for electronics & PC components */}
                  {!isElect && (
                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs font-bold text-neutral-500">Público / Género (النوع / الجنس)</label>
                      <select 
                        className="p-3 rounded-xl border border-neutral-200 focus:border-primary focus:ring-2 focus:ring-primary/10 outline-none bg-white transition-all font-bold text-neutral-800" 
                        value={newProduct.gender || 'Mujer'} 
                        onChange={e => setNewProduct({...newProduct, gender: e.target.value as any})}
                      >
                        <option value="Mujer">Mujer (نساء)</option>
                        <option value="Hombre">Hombre (رجال)</option>
                        <option value="Niño">Niño (أولاد)</option>
                        <option value="Niña">Niña (بنات)</option>
                        <option value="Unisex">Unisex (للجميع)</option>
                      </select>
                    </div>
                  )}
                </div>
              );
            })()}

            {/* Price & Discounts & Quantity */}
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-neutral-500">Precio Actual *</label>
                <input 
                  type="text" 
                  placeholder='Precio (ej: $45.00)' 
                  className="p-3 rounded-xl border border-neutral-200 focus:border-primary focus:ring-2 focus:ring-primary/10 outline-none transition-all font-bold text-neutral-800" 
                  value={newProduct.price} 
                  onChange={e => setNewProduct({...newProduct, price: e.target.value})} 
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-orange-600 flex items-center justify-between">
                  <span>السعر القديم (Precio Anterior)</span>
                </label>
                <input 
                  type="text" 
                  placeholder='مثال: 60.000 أو 60' 
                  className="p-3 rounded-xl border border-orange-200 focus:border-orange-500 focus:ring-2 focus:ring-orange-500/10 outline-none transition-all font-bold text-orange-600 bg-orange-50/20" 
                  value={newProduct.originalPrice || ''} 
                  onChange={e => setNewProduct({...newProduct, originalPrice: e.target.value})} 
                />
                {newProduct.originalPrice ? (
                  <div className="text-[11px] text-orange-600 flex items-center gap-1 font-medium">
                    <span>المعاينة:</span>
                    <span className="italic font-normal text-orange-500 line-through decoration-1 decoration-orange-500">
                      COP {formatThousandsPrice(newProduct.originalPrice)}
                    </span>
                  </div>
                ) : (
                  <span className="text-[10px] text-neutral-400 font-normal italic">
                    سيظهر بخط مائل ورقيق مشطوب بالآلاف (مثال: 60.000)
                  </span>
                )}
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-neutral-500">Oferta (%)</label>
                <input 
                  type="number" 
                  min="0"
                  max="100"
                  placeholder="0" 
                  className="p-3 rounded-xl border border-neutral-200 focus:border-primary focus:ring-2 focus:ring-primary/10 outline-none transition-all font-bold text-neutral-800" 
                  value={newProduct.offer || ''} 
                  onChange={e => setNewProduct({...newProduct, offer: Math.min(100, Math.max(0, parseInt(e.target.value) || 0))})} 
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-neutral-500">Stock</label>
                <input 
                  type="number" 
                  min="0"
                  placeholder="10" 
                  className="p-3 rounded-xl border border-neutral-200 focus:border-primary focus:ring-2 focus:ring-primary/10 outline-none transition-all font-bold text-neutral-800" 
                  value={newProduct.quantityRemaining} 
                  onChange={e => setNewProduct({...newProduct, quantityRemaining: Math.max(0, parseInt(e.target.value) || 0)})} 
                />
              </div>
            </div>

            {/* Sizes & Measurements (Tallas y Medidas / Variantes) */}
            <div className="p-4 rounded-xl border border-neutral-100 bg-neutral-50/40 space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-neutral-600 flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-primary"></span>
                  {['Chasis de PC', 'Tarjeta madre', 'RAM', 'Fuente de poder', 'Procesador', 'Tarjeta gráfica', 'Disco duro', 'Accesorios', 'Electrónica', '\u0625\u0644\u0643\u062a\u0631\u0648\u0646\u064a\u0627\u062a'].includes(newProduct.cat)
                    ? 'Variantes / Capacidades / Modelos / Colores'
                    : (newProduct.type === 'Zapatos' ? 'Tallas de Calzado (أرقام الأحذية)' : 'Tallas de Ropa (S, M, L, XL)')}
                </label>
                <span className="text-[10px] bg-neutral-200 text-neutral-600 px-2 py-0.5 rounded-full font-extrabold">
                  {(newProduct.sizes || []).length} agregadas
                </span>
              </div>

              {/* Custom Size Input */}
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder={
                    newProduct.cat === 'RAM' ? "Ej: 16GB DDR5, 32GB 6000MHz" :
                    newProduct.cat === 'Disco duro' ? "Ej: 1TB NVMe, 2TB Gen4" :
                    newProduct.cat === 'Tarjeta gráfica' ? "Ej: 12GB OC, 16GB VRAM" :
                    newProduct.cat === 'Fuente de poder' ? "Ej: 750W Gold, 850W Modular" :
                    newProduct.cat === 'Chasis de PC' ? "Ej: Negro, Blanco, Vidrio Templado" :
                    newProduct.cat === 'Procesador' ? "Ej: Con Cooler, Box Edition" :
                    newProduct.type === 'Zapatos' ? "Ej: 38, 39, 40, 41, 42" : "Ej: S, M, L, XL, 3-4 Años"
                  }
                  className="flex-1 p-2.5 rounded-lg border border-neutral-200 text-xs font-bold outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 bg-white text-neutral-800"
                  value={customSize}
                  onChange={(e) => setCustomSize(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      if (customSize.trim()) {
                        const currentSizes = newProduct.sizes || [];
                        if (!currentSizes.includes(customSize.trim())) {
                          setNewProduct({ ...newProduct, sizes: [...currentSizes, customSize.trim()] });
                        }
                        setCustomSize('');
                      }
                    }
                  }}
                />
                <button
                  type="button"
                  onClick={() => {
                    if (customSize.trim()) {
                      const currentSizes = newProduct.sizes || [];
                      if (!currentSizes.includes(customSize.trim())) {
                        setNewProduct({ ...newProduct, sizes: [...currentSizes, customSize.trim()] });
                      }
                      setCustomSize('');
                    }
                  }}
                  className="px-4 py-2 bg-neutral-800 text-white hover:bg-neutral-900 rounded-lg text-xs font-bold transition-all flex items-center gap-1 cursor-pointer"
                >
                  <Plus size={14} />
                  <span>Agregar</span>
                </button>
              </div>

              {/* Quick Select Preset Size Chips Based on Selected Category and Type */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <p className="text-[10px] font-bold text-neutral-400">
                    {newProduct.cat === 'RAM' ? '⚡ خيارات الرام السريعة (RAM Presets):' :
                     newProduct.cat === 'Disco duro' ? '⚡ سعات التخزين السريعة (Storage Presets):' :
                     newProduct.cat === 'Tarjeta gráfica' ? '⚡ خيارات كرت الشاشة (GPU Presets):' :
                     newProduct.cat === 'Fuente de poder' ? '⚡ قدرات مزود الطاقة (PSU Presets):' :
                     newProduct.cat === 'Procesador' ? '⚡ فئات المعالجات (CPU Presets):' :
                     newProduct.cat === 'Chasis de PC' ? '⚡ خيارات الصناديق (Case Presets):' :
                     newProduct.type === 'Zapatos' ? '⚡ أرقام الأحذية السريعة (Tallas numéricas):' :
                     '⚡ مقاسات سريعة:'}
                  </p>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {(
                    newProduct.cat === 'RAM'
                      ? ['16GB (2x8GB)', '32GB (2x16GB)', '64GB (2x32GB)', 'DDR4 3200MHz', 'DDR4 3600MHz', 'DDR5 5600MHz', 'DDR5 6000MHz', 'RGB Edition']
                      : newProduct.cat === 'Disco duro'
                      ? ['500GB NVMe', '1TB NVMe', '2TB NVMe', '4TB NVMe', '1TB SATA SSD', '2TB SATA SSD', '2TB HDD 7200RPM', 'Gen4 x4']
                      : newProduct.cat === 'Tarjeta gráfica'
                      ? ['8GB VRAM', '12GB VRAM', '16GB VRAM', '24GB VRAM', 'Dual Fan', 'Triple Fan OC', 'White Edition']
                      : newProduct.cat === 'Fuente de poder'
                      ? ['550W Bronze', '650W Bronze', '750W Gold', '850W Gold', '1000W Platinum', 'Full Modular', 'Semi Modular']
                      : newProduct.cat === 'Procesador'
                      ? ['Intel Core i5', 'Intel Core i7', 'Intel Core i9', 'AMD Ryzen 5', 'AMD Ryzen 7', 'AMD Ryzen 9', 'Con Disipador']
                      : newProduct.cat === 'Chasis de PC'
                      ? ['Mid Tower ATX', 'Micro-ATX', 'Mini-ITX', 'Full Tower', 'Negro', 'Blanco', 'Mesh Frontal', '4x ARGB Fans']
                      : newProduct.cat === 'Accesorios'
                      ? ['Switches Red', 'Switches Blue', 'Switches Brown', 'Inalámbrico 2.4GHz', 'Bluetooth 5.3', 'RGB Chroma', 'Cable USB-C']
                      : newProduct.type === 'Zapatos'
                      ? ['36', '37', '38', '39', '40', '41', '42', '43', '44', '45']
                      : (newProduct.cat === 'Electrónica' || newProduct.cat === '\u0625\u0644\u0643\u062a\u0631\u0648\u0646\u064a\u0627\u062a')
                      ? ['64GB', '128GB', '256GB', '512GB', '1TB', '40mm', '44mm', '49mm', 'Estándar', 'Pro', 'Negro', 'Blanco']
                      : (newProduct.cat === '\u0623\u0637\u0641\u0627\u0644' || newProduct.gender === 'Niño' || newProduct.gender === 'Niña'
                          ? ['1-2 Años', '3-4 Años', '5-6 Años', '7-8 Años', '9-10 Años', '11-12 Años', 'S', 'M']
                          : ['XS', 'S', 'M', 'L', 'XL', 'XXL', '3XL']
                        )
                  ).map((preset) => {
                    const isSelected = newProduct.sizes?.includes(preset);
                    return (
                      <button
                        key={preset}
                        type="button"
                        onClick={() => {
                          const currentSizes = newProduct.sizes || [];
                          if (isSelected) {
                            setNewProduct({ ...newProduct, sizes: currentSizes.filter((s) => s !== preset) });
                          } else {
                            setNewProduct({ ...newProduct, sizes: [...currentSizes, preset] });
                          }
                        }}
                        className={`text-[10.5px] px-2.5 py-1 rounded-full border transition-all font-bold cursor-pointer select-none ${
                          isSelected
                            ? 'bg-primary border-primary text-white shadow-sm'
                            : 'bg-white border-neutral-200 text-neutral-600 hover:border-neutral-300'
                        }`}
                      >
                        {preset}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Display Current Added Sizes */}
              {newProduct.sizes && newProduct.sizes.length > 0 && (
                <div className="pt-2 border-t border-dashed border-neutral-200 space-y-1.5">
                  <p className="text-[10px] font-bold text-neutral-400">'Tallas seleccionadas (haz clic para eliminar):'</p>
                  <div className="flex flex-wrap gap-1.5">
                    {newProduct.sizes.map((size) => (
                      <button
                        key={size}
                        type="button"
                        onClick={() => {
                          const currentSizes = newProduct.sizes || [];
                          setNewProduct({ ...newProduct, sizes: currentSizes.filter((s) => s !== size) });
                        }}
                        className="bg-neutral-100 hover:bg-red-50 hover:text-red-600 text-neutral-800 text-xs px-2.5 py-1 rounded-full font-bold flex items-center gap-1 transition-all cursor-pointer group"
                      >
                        <span>{size}</span>
                        <X size={12} className="text-neutral-400 group-hover:text-red-500 transition-colors" />
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Availability Checkbox & Button */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-2">
              <label className="flex items-center gap-3 cursor-pointer select-none">
                <input 
                  type="checkbox" 
                  className="w-5 h-5 rounded text-primary focus:ring-primary border-neutral-300 transition-all cursor-pointer"
                  checked={newProduct.isOutOfStock} 
                  onChange={e => setNewProduct({...newProduct, isOutOfStock: e.target.checked})} 
                />
                <span className="font-bold text-sm text-neutral-700">'Marcar como agotado'</span>
              </label>

              <button 
                onClick={handleSaveProduct} 
                disabled={!newProduct.name || !newProduct.price}
                className={`px-8 py-3.5 bg-primary hover:bg-primary-hover text-white rounded-xl font-bold transition-all shadow-md hover:shadow-lg flex items-center justify-center gap-2 cursor-pointer ${(!newProduct.name || !newProduct.price) ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                {editingProduct 
                  ? ('Guardar Cambios') 
                  : ('Agregar Producto')}
              </button>
            </div>

          </div>

          {/* Interactive Image Gallery Panel */}
          <div className="lg:col-span-5 space-y-4">
            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-neutral-700 flex items-center gap-1.5">
                  <Layers size={14} className="text-primary" />
                  <span>'Galería de Imágenes Interactivas'</span>
                  <span className="text-[10px] bg-primary/10 text-primary px-2 py-0.5 rounded-full font-extrabold">
                    {galleryImages.length} 'fotos'
                  </span>
                </label>
                {galleryImages.length > 0 && (
                  <button 
                    onClick={clearAllGallery}
                    type="button"
                    className="text-xs text-red-500 hover:underline flex items-center gap-1 cursor-pointer font-bold"
                  >
                    <Trash2 size={12} />
                    <span>'Borrar todas'</span>
                  </button>
                )}
              </div>

              {/* Main Interactive Preview Container */}
              <div className="relative aspect-square rounded-2xl border-2 border-neutral-200 overflow-hidden bg-neutral-900 flex flex-col items-center justify-center transition-all group shadow-inner">
                {galleryImages.length > 0 && galleryImages[selectedGalleryIndex] ? (
                  <>
                    <img 
                      src={galleryImages[selectedGalleryIndex]} 
                      alt="Selected product preview" 
                      className="w-full h-full object-contain transition-transform duration-300"
                      referrerPolicy="no-referrer"
                      onError={() => setImageError(true)}
                    />

                    {/* Badge Indicator */}
                    <div className="absolute top-3 right-3 flex items-center gap-2">
                      {selectedGalleryIndex === 0 ? (
                        <span className="bg-amber-500 text-white text-[11px] font-black px-2.5 py-1 rounded-full flex items-center gap-1 shadow-md">
                          <Star size={12} className="fill-white" />
                          'Imagen Principal'
                        </span>
                      ) : (
                        <button
                          type="button"
                          onClick={() => handleSetCoverImage(selectedGalleryIndex)}
                          className="bg-black/70 hover:bg-amber-500 text-white text-[11px] font-bold px-2.5 py-1 rounded-full transition-colors flex items-center gap-1 cursor-pointer backdrop-blur-sm"
                        >
                          <Star size={12} />
                          'Establecer Portada'
                        </button>
                      )}
                    </div>

                    {/* Counter Pill */}
                    <div className="absolute top-3 left-3 bg-black/60 text-white text-[10px] font-bold px-2 py-0.5 rounded-full backdrop-blur-sm">
                      {selectedGalleryIndex + 1} / {galleryImages.length}
                    </div>

                    {/* Navigation Arrows on Preview */}
                    {galleryImages.length > 1 && (
                      <>
                        <button
                          type="button"
                          onClick={() => setSelectedGalleryIndex((prev) => (prev - 1 + galleryImages.length) % galleryImages.length)}
                          className="absolute left-2 top-1/2 -translate-y-1/2 p-2 bg-white/80 hover:bg-white text-neutral-800 rounded-full shadow-lg backdrop-blur-sm transition-all cursor-pointer"
                        >
                          <ChevronLeft size={18} />
                        </button>
                        <button
                          type="button"
                          onClick={() => setSelectedGalleryIndex((prev) => (prev + 1) % galleryImages.length)}
                          className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-white/80 hover:bg-white text-neutral-800 rounded-full shadow-lg backdrop-blur-sm transition-all cursor-pointer"
                        >
                          <ChevronRight size={18} />
                        </button>
                      </>
                    )}

                    {/* Delete overlay button */}
                    <button 
                      type="button"
                      onClick={() => handleRemoveGalleryImage(selectedGalleryIndex)}
                      className="absolute bottom-3 right-3 p-2 bg-red-600/90 hover:bg-red-600 text-white rounded-full shadow-md backdrop-blur-sm transition-transform cursor-pointer hover:scale-110"
                      title='Eliminar esta imagen'
                    >
                      <Trash2 size={16} />
                    </button>
                  </>
                ) : (
                  <div className="text-center p-6 space-y-3 text-neutral-400">
                    <div className="w-16 h-16 bg-neutral-800 rounded-2xl flex items-center justify-center mx-auto text-neutral-500">
                      <ImageIcon size={32} />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-neutral-200">'Galería vacía'</p>
                      <p className="text-xs text-neutral-400 mt-1">'Agregue URL o suba imágenes para ver la galería'</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Selected Image URL Direct Editor */}
              {galleryImages.length > 0 && (
                <div className="bg-neutral-50 p-3.5 rounded-xl border border-neutral-100 space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-[11px] font-bold text-neutral-600 flex items-center gap-1.5">
                      <Edit2 size={12} className="text-primary" />
                      <span>'Editar enlace de la imagen seleccionada:'</span>
                    </label>
                    {galleryImages[selectedGalleryIndex]?.startsWith('data:image') && (
                      <span className="text-[10px] bg-primary/10 text-primary px-2 py-0.5 rounded-full font-black">
                        'Imagen subida (Comprimida)'
                      </span>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      className="flex-1 p-2.5 rounded-lg border border-neutral-200 text-xs font-bold outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 bg-white text-neutral-800"
                      value={galleryImages[selectedGalleryIndex] || ''}
                      placeholder='Enlace de la imagen...'
                      onChange={(e) => {
                        const val = e.target.value;
                        const updated = [...galleryImages];
                        updated[selectedGalleryIndex] = val;
                        setNewProduct(prev => ({
                          ...prev,
                          images: updated,
                          image: selectedGalleryIndex === 0 ? val : (prev.image || updated[0])
                        }));
                      }}
                    />
                  </div>
                  <p className="text-[10px] text-neutral-400 font-medium">
                    'Puede editar el enlace o ingresar uno nuevo para actualizar la imagen inmediatamente en la galería y el producto.'
                  </p>
                </div>
              )}

              {/* Gallery Thumbnails List */}
              {galleryImages.length > 0 && (
                <div className="space-y-2">
                  <div className="text-xs font-bold text-neutral-600 flex items-center justify-between">
                    <span>'Miniaturas de la galería'</span>
                    <span className="text-[10px] text-neutral-400">'Click para seleccionar'</span>
                  </div>

                  <div className="flex gap-2 overflow-x-auto pb-2 pt-1">
                    {galleryImages.map((img, idx) => (
                      <div 
                        key={idx}
                        className={`relative group flex-shrink-0 w-16 h-16 rounded-xl overflow-hidden border-2 cursor-pointer transition-all ${
                          idx === selectedGalleryIndex 
                            ? 'border-primary ring-2 ring-primary/30 scale-105 shadow-md' 
                            : 'border-neutral-200 opacity-70 hover:opacity-100'
                        }`}
                        onClick={() => setSelectedGalleryIndex(idx)}
                      >
                        <img src={img} alt={`Gallery ${idx}`} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                        
                        {/* Cover star badge */}
                        {idx === 0 && (
                          <div className="absolute top-1 right-1 bg-amber-500 text-white p-0.5 rounded-full shadow-sm">
                            <Star size={10} className="fill-white" />
                          </div>
                        )}

                        {/* Hover Overlay with Action icons */}
                        <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1">
                          {idx > 0 && (
                            <button
                              type="button"
                              onClick={(e) => { e.stopPropagation(); handleMoveImage(idx, 'left'); }}
                              className="p-1 bg-white/80 text-neutral-800 rounded-full hover:bg-white"
                              title='Mover izquierda'
                            >
                              <ChevronLeft size={10} />
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={(e) => { e.stopPropagation(); handleRemoveGalleryImage(idx); }}
                            className="p-1 bg-red-600 text-white rounded-full hover:scale-110"
                            title='Eliminar'
                          >
                            <X size={10} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Interactive Selector Tabs for Adding/Editing Images */}
            <div className="bg-neutral-100 p-1.5 rounded-xl flex gap-1">
              <button 
                type="button"
                onClick={() => setImageTab('url')}
                className={`flex-1 py-2 px-3 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${imageTab === 'url' ? 'bg-white text-neutral-900 shadow-sm' : 'text-neutral-500 hover:text-neutral-800'}`}
              >
                <LinkIcon size={14} />
                <span>'Enlace URL / Texto'</span>
              </button>
              <button 
                type="button"
                onClick={() => setImageTab('upload')}
                className={`flex-1 py-2 px-3 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${imageTab === 'upload' ? 'bg-white text-neutral-900 shadow-sm' : 'text-neutral-500 hover:text-neutral-800'}`}
              >
                <Upload size={14} />
                <span>'Subir Archivos'</span>
              </button>
            </div>

            {/* Tab Body */}
            <div className="min-h-[140px] bg-neutral-50/50 p-4 rounded-xl border border-neutral-100 space-y-3">
              
              {/* Tab 1: URL input */}
              {imageTab === 'url' && (() => {
                const detectedUrls = extractAndNormalizeUrls(urlInput);
                const hasProductPage = isAlibabaProductPageUrl(urlInput);
                return (
                  <div className="space-y-3">
                    <div className="flex flex-col gap-2">
                      <div className="relative">
                        <textarea 
                          rows={3}
                          placeholder="Pegue enlaces de imágenes directos o enlaces de productos de Alibaba / AliExpress (ej. https://ae01.alicdn.com/kf/... o https://www.aliexpress.com/item/...)" 
                          className="w-full p-3 pb-7 rounded-xl border border-neutral-200 focus:border-primary focus:ring-2 focus:ring-primary/10 outline-none text-xs font-medium bg-white resize-none leading-relaxed" 
                          value={urlInput} 
                          onChange={e => setUrlInput(e.target.value)}
                          onKeyDown={e => {
                            if (e.key === 'Enter' && !e.shiftKey) {
                              e.preventDefault();
                              handleAddUrlToGallery();
                            }
                          }}
                        />
                        {detectedUrls.length > 0 && (
                          <div className="absolute bottom-2 left-2.5 bg-primary/10 text-primary text-[10px] font-extrabold px-2 py-0.5 rounded-md flex items-center gap-1 backdrop-blur-sm">
                            <Check size={11} />
                            <span>{`${detectedUrls.length} imágenes HD detectadas`}</span>
                          </div>
                        )}
                      </div>

                      {hasProductPage && (
                        <div className="bg-amber-50 text-amber-800 text-[11px] font-bold px-3 py-1.5 rounded-xl flex items-center gap-2 border border-amber-200">
                          <Sparkles size={13} className="text-amber-600 animate-bounce flex-shrink-0" />
                          <span>Enlace de producto Alibaba / AliExpress detectado - Extracción de imágenes en HD activada</span>
                        </div>
                      )}

                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={handleAddUrlToGallery}
                          disabled={(detectedUrls.length === 0 && !hasProductPage) || isFetchingUrl}
                          className="flex-1 py-2.5 bg-primary text-white font-bold rounded-xl text-xs hover:bg-primary-hover transition-all disabled:opacity-50 cursor-pointer flex items-center justify-center gap-1.5 shadow-sm"
                        >
                          {isFetchingUrl ? (
                            <>
                              <RefreshCw size={15} className="animate-spin text-white" />
                              <span>Extrayendo imágenes de AliExpress / Alibaba...</span>
                            </>
                          ) : (
                            <>
                              <Plus size={15} />
                              <span>
                                {hasProductPage && detectedUrls.length === 0 
                                  ? 'Extraer Imágenes del Producto (HD)' 
                                  : 'Agregar a la Galería'}
                              </span>
                            </>
                          )}
                        </button>
                      </div>
                    </div>

                    {/* Quick Presets (Tech or Fashion depending on product type) */}
                    <div className="pt-2 border-t border-neutral-200/60 space-y-1.5">
                      <div className="text-[11px] font-bold text-neutral-600 flex items-center gap-1">
                        <Sparkles size={12} className="text-amber-500" />
                        <span>
                          {newProduct.department === 'Electrónica' || PC_HARDWARE_CATEGORIES.includes(newProduct.cat || '') 
                            ? 'Modelos rápidos de Hardware & Tech:' 
                            : 'Modelos rápidos de Ropa y Moda:'}
                        </span>
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {(newProduct.department === 'Electrónica' || PC_HARDWARE_CATEGORIES.includes(newProduct.cat || '') ? techPresets : fashionPresets).map((preset, idx) => (
                          <button
                            key={idx}
                            type="button"
                            onClick={() => handleAddPresetImages(preset.images)}
                            className="px-2.5 py-1 bg-white hover:bg-neutral-100 border border-neutral-200 text-neutral-700 rounded-lg text-[10px] font-bold transition-all cursor-pointer flex items-center gap-1 hover:border-primary/40 shadow-2xs"
                          >
                            <Plus size={10} className="text-primary" />
                            <span>{preset.name}</span>
                          </button>
                        ))}
                      </div>
                    </div>

                    <p className="text-[10px] text-neutral-500 leading-relaxed font-medium flex items-center gap-1.5">
                      <Globe size={12} className="text-primary flex-shrink-0" />
                      <span>
                        Acepta enlaces directos de imágenes y enlaces de productos de <strong>Alibaba</strong>, <strong>AliExpress</strong>, Photopea, Unsplash y más. Las miniaturas se convierten automáticamente a Alta Definición (HD).
                      </span>
                    </p>
                  </div>
                );
              })()}

              {/* Tab 2: Multi-file upload drag and drop */}
              {imageTab === 'upload' && (
                <div 
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDropMultiple}
                  onClick={() => fileInputRef.current?.click()}
                  className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all duration-200 flex flex-col items-center justify-center ${dragOver ? 'border-primary bg-primary/5' : 'border-neutral-200 hover:border-neutral-300 bg-white'}`}
                >
                  <input 
                    type="file" 
                    ref={fileInputRef} 
                    className="hidden" 
                    accept="image/*" 
                    multiple
                    onChange={handleMultipleFileChange} 
                  />
                  <Upload size={24} className={dragOver ? 'text-primary animate-bounce' : 'text-neutral-400'} />
                  <span className="text-xs font-bold text-neutral-700 mt-2">
                    {dragOver 
                      ? ('¡Suelte las imágenes aquí!') 
                      : ('Click o arrastre para subir imágenes')}
                  </span>
                  <span className="text-[10px] text-neutral-400 mt-1 font-medium">
                    'PNG, JPG, WEBP (puede seleccionar varias)'
                  </span>
                </div>
              )}

            </div>
          </div>

        </div>
      </div>

      {/* Product List */}
      <div className="bg-white rounded-2xl border border-neutral-100 shadow-sm overflow-hidden">
        <div className="p-5 border-b border-neutral-100 bg-neutral-50/50 flex justify-between items-center">
          <h4 className="text-base font-bold text-neutral-900">
            {`Inventario y Productos Disponibles`}
          </h4>
        </div>
        
        {loading ? (
          <div className="p-12 text-center text-neutral-500 font-medium flex items-center justify-center gap-2">
            <RefreshCw size={18} className="animate-spin text-primary" />
            <span>'Cargando catálogo...'</span>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className={`w-full text-left text-sm`}>
              <thead className="bg-neutral-50/80 text-neutral-500 border-b border-neutral-100 font-semibold">
                <tr>
                  <th className="p-4 font-bold">'Producto'</th>
                  <th className="p-4 font-bold">'Categoría / Tipo'</th>
                  <th className="p-4 font-bold">'Precio'</th>
                  <th className="p-4 font-bold">'Oferta'</th>
                  <th className="p-4 font-bold">'Cantidad'</th>
                  <th className="p-4 font-bold">'Vendido'</th>
                  <th className="p-4 font-bold">'Estado'</th>
                  <th className="p-4 font-bold text-center">'Acciones'</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100">
                {products.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="p-12 text-center text-neutral-400 font-medium">
                      'No hay productos disponibles.'
                    </td>
                  </tr>
                ) : (
                  products.map(p => (
                    <tr key={p.id} className="hover:bg-neutral-50/50 transition-colors">
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-lg overflow-hidden border border-neutral-100 shrink-0 bg-neutral-100">
                            {p.image ? (
                              <img src={p.image} alt={p.name} className="w-full h-full object-cover" />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-neutral-400">
                                <ImageIcon size={16} />
                              </div>
                            )}
                          </div>
                          <div>
                            <div className="font-bold text-neutral-900">{p.name}</div>
                            <div className="text-xs text-neutral-400 mt-1 flex flex-wrap gap-1 items-center">
                              {p.department === 'Electrónica' || PC_HARDWARE_CATEGORIES.includes(p.cat) || PC_HARDWARE_CATEGORIES.includes(p.type || '') ? (
                                <span className="text-[10px] bg-sky-50 text-sky-700 font-bold px-1.5 py-0.5 rounded border border-sky-200/60">
                                  Hardware / Tech
                                </span>
                              ) : (
                                <span>{p.gender}</span>
                              )}
                              {p.sizes && p.sizes.length > 0 && (
                                <>
                                  <span className="w-1 h-1 rounded-full bg-neutral-300 mx-1"></span>
                                  <span className="text-[10px] bg-neutral-100 text-neutral-700 px-1.5 py-0.5 rounded font-bold">
                                    {p.sizes.join(', ')}
                                  </span>
                                </>
                              )}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="p-4 font-medium text-neutral-600">
                        <div className="font-semibold text-neutral-800">{p.cat}</div>
                        {p.type && <div className="text-xs text-neutral-400 mt-0.5">{p.type}</div>}
                      </td>
                      <td className="p-4">
                        <div className="font-extrabold text-neutral-900">COP {formatThousandsPrice(p.price)}</div>
                        {(() => {
                          const origFormatted = getFormattedOriginalPrice(p.originalPrice, p.price, p.offer);
                          if (!origFormatted) return null;
                          return (
                            <div className="italic font-normal text-xs text-orange-500 line-through decoration-1 decoration-orange-500">
                              COP {origFormatted}
                            </div>
                          );
                        })()}
                      </td>
                      <td className="p-4">
                        {p.offer ? (
                          <span className="px-2 py-0.5 rounded bg-red-50 text-red-600 text-xs font-bold">
                            {p.offer}% 'Desct'
                          </span>
                        ) : (
                          <span className="text-neutral-400">-</span>
                        )}
                      </td>
                      <td className="p-4 font-semibold text-neutral-700">{p.quantityRemaining}</td>
                      <td className="p-4 text-neutral-500">{p.quantitySold || 0}</td>
                      <td className="p-4">
                        {p.isOutOfStock || p.quantityRemaining === 0 ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-red-100 text-red-700 text-xs font-bold">
                            <AlertCircle size={12} />
                            'Agotado'
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-700 text-xs font-bold">
                            <Check size={12} />
                            'Disponible'
                          </span>
                        )}
                      </td>
                      <td className="p-4">
                        <div className="flex items-center justify-center gap-3">
                          <button 
                            onClick={() => handleEdit(p)} 
                            className="p-1.5 hover:bg-primary/5 text-primary rounded-lg transition-colors cursor-pointer"
                            title='Editar'
                          >
                            <Edit2 size={16} />
                          </button>
                          <button 
                            onClick={() => handleDelete(p.id)} 
                            className="p-1.5 hover:bg-red-50 text-red-500 rounded-lg transition-colors cursor-pointer"
                            title='Eliminar'
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Confirmation Modal */}
      {productToDelete && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white p-6 rounded-2xl shadow-xl max-w-sm w-full"
          >
            <h3 className="text-lg font-bold text-neutral-900 mb-2">
              'Confirmar eliminación'
            </h3>
            <p className="text-neutral-500 mb-6">
              '¿Estás seguro de que quieres eliminar este producto? Esta acción no se puede deshacer.'
            </p>
            <div className="flex justify-end gap-3">
              <button 
                onClick={() => setProductToDelete(null)}
                className="px-4 py-2 text-neutral-600 font-bold hover:bg-neutral-100 rounded-full transition-colors cursor-pointer"
              >
                'Cancelar'
              </button>
              <button 
                onClick={confirmDelete}
                className="px-4 py-2 bg-red-600 text-white font-bold hover:bg-red-700 rounded-full transition-colors cursor-pointer"
              >
                'Eliminar'
              </button>
            </div>
          </motion.div>
        </div>
      )}

    </div>
  );
}

