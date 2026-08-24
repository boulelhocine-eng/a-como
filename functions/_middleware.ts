interface Env {
  VITE_SUPABASE_URL?: string;
  VITE_SUPABASE_ANON_KEY?: string;
  ASSETS?: {
    fetch: (request: Request | string) => Promise<Response>;
  };
}

interface CloudflarePagesContext {
  request: Request;
  params: Record<string, string>;
  env: Env;
  next: () => Promise<Response>;
}

const DEFAULT_SUPABASE_URL = 'https://scihwbmnhizpeqihujjc.supabase.co';
const DEFAULT_SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNjaWh3Ym1uaGl6cGVxaWh1ampjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODQ0MDY1NjAsImV4cCI6MjA5OTk4MjU2MH0.mhGPO6Lhx-olstscLmqNKuzle4O50_LbD8w-3g0IgWI';

// Fallback hardcoded products list matching constants.ts
const FALLBACK_PRODUCTS: Record<string, { name: string; desc: string; price: string; image: string }> = {
  '13': { name: 'Conjunto de Ropa Infantil', desc: 'Conjunto de ropa cómodo y moderno para niños.', price: '$30.00', image: 'https://f000.backblazeb2.com/file/jpgshared/nHEMdy_t' },
  '14': { name: 'Vestido Infantil Delicado', desc: 'Vestido de niña con un diseño suave y elegante.', price: '$40.00', image: 'https://f000.backblazeb2.com/file/jpgshared/V-ySjWju' },
  '15': { name: 'Zapatillas Deportivas Infantiles', desc: 'Zapatos deportivos cómodos para niños.', price: '$40.00', image: 'https://f000.backblazeb2.com/file/jpgshared/8Tp1n0gw' },
  '10': { name: 'Vestido Femenino Moderno', desc: 'Vestido de mujer con diseño moderno y elegante.', price: '$65.00', image: 'https://f000.backblazeb2.com/file/jpgshared/SLHTi4NY' },
  '11': { name: 'Falda Femenina Elegante', desc: 'Falda elegante y cómoda para ocasiones diarias.', price: '$45.00', image: 'https://f000.backblazeb2.com/file/jpgshared/vxxlpFaA' },
  '1': { name: 'Camiseta de Algodón Masculina', desc: 'Camiseta de algodón cómoda y de alta calidad, perfecta para el uso diario.', price: '$25.00', image: 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?q=80&w=800&auto=format&fit=crop' },
  '3': { name: 'Vestido Femenino de Verano', desc: 'Vestido de verano ligero y cómodo en colores brillantes.', price: '$60.00', image: 'https://images.unsplash.com/photo-1515372039744-b8f02a3ae446?q=80&w=800&auto=format&fit=crop' },
  '5': { name: 'Conjunto Infantil de Juego', desc: 'Conjunto de algodón cómodo y elegante para niños.', price: '$45.00', image: 'https://images.unsplash.com/photo-1519238263530-99bdd11df2ea?q=80&w=800&auto=format&fit=crop' },
  '20': { name: 'Smartwatch Deportivo Pro Ultra', desc: 'Reloj inteligente con pantalla AMOLED de alta resolución, sensor de ritmo cardíaco y GPS.', price: '$89.00', image: 'https://images.unsplash.com/photo-1508685096489-7aacd43bd3b1?q=80&w=800&auto=format&fit=crop' },
  '21': { name: 'Auriculares Inalámbricos Noise Cancelling Pro', desc: 'Auriculares con cancelación activa de ruido, sonido Hi-Fi inmersivo y 36h de batería.', price: '$69.00', image: 'https://images.unsplash.com/photo-1590658268037-6bf12165a8df?q=80&w=800&auto=format&fit=crop' },
  '22': { name: 'Smartphone Pro Max 5G (128GB/256GB)', desc: 'Teléfono inteligente con cámara triple de 108MP, pantalla fluida de 120Hz y carga ultra rápida.', price: '$349.00', image: 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?q=80&w=800&auto=format&fit=crop' },
  '23': { name: 'Altavoz Bluetooth Portátil Resistente al Agua', desc: 'Sonido potente 360 grados con graves profundos y batería de 20 horas.', price: '$45.00', image: 'https://images.unsplash.com/photo-1608043152269-423dbba4e7e1?q=80&w=800&auto=format&fit=crop' },
  '30': { name: 'Chasis Gamer ATX Vidrio Templado + 4 Fans ARGB', desc: 'Gabinete para PC con flujo de aire optimizado y panel lateral de vidrio templado.', price: '$95.00', image: 'https://images.unsplash.com/photo-1587202372775-e229f172b9d7?q=80&w=800&auto=format&fit=crop' },
  '31': { name: 'Tarjeta Madre Wi-Fi 6E DDR5 PCIe 5.0 Ultra', desc: 'Placa base de alto rendimiento con disipadores térmicos avanzados y Wi-Fi 6E.', price: '$210.00', image: 'https://images.unsplash.com/photo-1518770660439-4636190af475?q=80&w=800&auto=format&fit=crop' },
  '32': { name: 'Memoria RAM Gaming RGB DDR5 32GB (2x16GB)', desc: 'Kit de memoria RAM de ultra alta velocidad con disipador de aluminio y RGB.', price: '$129.00', image: 'https://images.unsplash.com/photo-1562976540-1502c2145186?q=80&w=800&auto=format&fit=crop' },
  '33': { name: 'Fuente de Poder 850W 80 Plus Gold Full Modular', desc: 'Fuente de alimentación con certificación 80 PLUS Gold de alta eficiencia.', price: '$135.00', image: 'https://images.unsplash.com/photo-1587202372634-32705e3bf49c?q=80&w=800&auto=format&fit=crop' },
  '34': { name: 'Procesador 8 Núcleos 16 Hilos 5.3GHz Turbo', desc: 'Procesador de última generación desbloqueado para overclocking y gaming.', price: '$319.00', image: 'https://images.unsplash.com/photo-1591799264318-7e6ef8ddb7ea?q=80&w=800&auto=format&fit=crop' },
  '35': { name: 'Tarjeta Gráfica Gaming 16GB GDDR6X Triple Fan OC', desc: 'GPU de máxima potencia para juegos 4K y trazado de rayos en tiempo real.', price: '$680.00', image: 'https://images.unsplash.com/photo-1591488320449-011701bb6704?q=80&w=800&auto=format&fit=crop' },
  '36': { name: 'Disco Duro SSD M.2 NVMe PCIe 4.0 2TB', desc: 'Unidad de estado sólido NVMe Gen4 de velocidad extrema hasta 7400 MB/s.', price: '$149.00', image: 'https://images.unsplash.com/photo-1597872200969-2b65d56bd16b?q=80&w=800&auto=format&fit=crop' },
  '37': { name: 'Kit Accesorios: Teclado Mecánico RGB + Ratón Gaming', desc: 'Combo gaming premium con teclado mecánico y ratón óptico de 16000 DPI.', price: '$79.00', image: 'https://images.unsplash.com/photo-1618384887929-16ec33fab9ef?q=80&w=800&auto=format&fit=crop' }
};

function escapeHtml(str: string): string {
  if (!str) return '';
  return str
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function extractProductImage(item: any, origin: string): string {
  const DEFAULT_FALLBACK_IMAGE = 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?q=80&w=800&auto=format&fit=crop';
  if (!item || typeof item !== 'object') {
    return `https://images.weserv.nl/?url=${encodeURIComponent(DEFAULT_FALLBACK_IMAGE)}&output=jpg&w=800&h=800&fit=cover`;
  }

  let rawImage: string | null = null;

  // 1. FIRST PRIORITY: Check "images" column (complex array, nested array, JSON string, or single url)
  if (item.images) {
    try {
      let parsed = item.images;
      if (typeof parsed === 'string') {
        const trimmed = parsed.trim();
        if (trimmed.startsWith('[') || trimmed.startsWith('{')) {
          try {
            parsed = JSON.parse(trimmed);
          } catch {
            // Keep as string if parsing fails
          }
        } else if (trimmed.startsWith('http://') || trimmed.startsWith('https://') || trimmed.startsWith('/')) {
          rawImage = trimmed;
        }
      }

      if (!rawImage && Array.isArray(parsed) && parsed.length > 0) {
        const first = parsed[0];
        if (Array.isArray(first) && first.length > 0) {
          rawImage = typeof first[0] === 'string' ? first[0] : (first[0]?.url || first[0]?.src || '');
        } else if (typeof first === 'string') {
          rawImage = first;
        } else if (first && typeof first === 'object') {
          rawImage = first.url || first.src || first.link || first.image || first.uri || '';
        }
      } else if (!rawImage && parsed && typeof parsed === 'object') {
        rawImage = parsed.url || parsed.src || parsed.link || parsed.image || parsed.uri || '';
      }
    } catch {
      // Fallback on error
    }
  }

  // 2. SECOND PRIORITY: If "images" is empty, inspect simple "image" column
  if (!rawImage && item.image && typeof item.image === 'string' && item.image.trim() !== '' && item.image !== 'undefined' && item.image !== 'null') {
    rawImage = item.image.trim();
  }

  // 3. THIRD PRIORITY: Check "primary_image", "main_image", or "photo"
  if (!rawImage) {
    const candidate = item.primary_image || item.main_image || item.photo;
    if (typeof candidate === 'string' && candidate.trim() !== '') {
      rawImage = candidate.trim();
    } else if (candidate && typeof candidate === 'object') {
      rawImage = candidate.url || candidate.src || candidate.image || '';
    }
  }

  let img = typeof rawImage === 'string' ? rawImage.trim() : '';

  // 4. Validate image URL & strictly ensure https://
  if (!img || img.startsWith('data:') || img.includes('/src/assets/images/')) {
    img = DEFAULT_FALLBACK_IMAGE;
  } else if (!img.startsWith('http://') && !img.startsWith('https://')) {
    if (img.startsWith('//')) {
      img = `https:${img}`;
    } else if (img.startsWith('/')) {
      img = `${origin.replace(/^http:\/\//i, 'https://')}${img}`;
    } else {
      img = `${origin.replace(/^http:\/\//i, 'https://')}/${img}`;
    }
  }

  // Ensure protocol is https://
  if (img.startsWith('http://')) {
    img = img.replace(/^http:\/\//i, 'https://');
  }

  // Double check that it starts with https://, otherwise fallback
  if (!img.startsWith('https://')) {
    img = DEFAULT_FALLBACK_IMAGE;
  }

  // 5. Proxy through images.weserv.nl
  if (img.includes('images.weserv.nl')) {
    return img;
  }

  return `https://images.weserv.nl/?url=${encodeURIComponent(img)}&output=jpg&w=800&h=800&fit=cover`;
}

export const onRequest = async (context: CloudflarePagesContext): Promise<Response> => {
  const { request, env, next } = context;
  const url = new URL(request.url);

  // Skip static assets
  if (url.pathname.match(/\.(js|css|png|jpg|jpeg|gif|svg|ico|woff|woff2|ttf|eot|json|xml)$/i)) {
    return next();
  }

  // Extract productId from either /products/:id or ?product=:id
  let productId: string | null = null;
  const pathMatch = url.pathname.match(/^\/products\/([^/]+)/i);
  if (pathMatch && pathMatch[1]) {
    productId = pathMatch[1];
  } else if (url.searchParams.has('product')) {
    productId = url.searchParams.get('product');
  }

  // If no product ID is present in URL, pass through to static app
  if (!productId) {
    return next();
  }

  let product: { name: string; desc: string; price: string; image?: any; images?: any; main_image?: any; primary_image?: any; photo?: any } | null = null;

  try {
    const supabaseUrl = env.VITE_SUPABASE_URL || DEFAULT_SUPABASE_URL;
    const supabaseKey = env.VITE_SUPABASE_ANON_KEY || DEFAULT_SUPABASE_ANON_KEY;

    // 1. Fetch from Supabase REST API
    const apiUrl = `${supabaseUrl}/rest/v1/products?id=eq.${encodeURIComponent(productId)}&select=*`;
    const apiRes = await fetch(apiUrl, {
      headers: {
        'apikey': supabaseKey,
        'Authorization': `Bearer ${supabaseKey}`,
        'Content-Type': 'application/json'
      }
    });

    if (apiRes.ok) {
      const data = await apiRes.json();
      if (Array.isArray(data) && data.length > 0) {
        const item = data[0];
        product = {
          name: item.name || 'Producto',
          desc: item.description || item.desc || `${item.name} - Disponible en Como`,
          price: item.price ? (item.price.toString().startsWith('$') ? item.price : `$${item.price}`) : '',
          image: item.image,
          images: item.images,
          main_image: item.main_image,
          primary_image: item.primary_image,
          photo: item.photo
        };
      }
    }
  } catch (e) {
    // Supabase query failed, fallback to local list
  }

  // 2. Fallback to hardcoded product list if not found in Supabase
  if (!product && FALLBACK_PRODUCTS[productId]) {
    product = FALLBACK_PRODUCTS[productId];
  }

  // If still no product found, pass through
  if (!product) {
    return next();
  }

  // Retrieve base index.html
  let originalHtml = '';
  try {
    if (env.ASSETS && typeof env.ASSETS.fetch === 'function') {
      const res = await env.ASSETS.fetch(new URL('/', request.url));
      originalHtml = await res.text();
    } else {
      const res = await next();
      originalHtml = await res.text();
    }
  } catch (err) {
    try {
      const res = await next();
      originalHtml = await res.text();
    } catch (e) {
      originalHtml = `<!doctype html><html lang="ar" dir="rtl"><head><meta charset="UTF-8" /><meta name="viewport" content="width=device-width, initial-scale=1.0" /><title>Como</title></head><body><div id="root"></div></body></html>`;
    }
  }

  const imageUrl = extractProductImage(product, url.origin);
  const name = product.name;
  const description = product.desc || `${name} - Compra ahora en Como`;
  const priceDisplay = product.price ? ` - ${product.price}` : '';
  const pageTitle = `${name}${priceDisplay} | Como`;
  const pageUrl = `${url.origin}/products/${productId}`;

  const rawPrice = product.price ? product.price.toString() : '';
  const cleanPriceAmount = rawPrice.replace(/[^0-9]/g, '');
  const descriptionAndPrice = product.price ? `${description} - Precio: ${product.price}` : description;

  let priceMetaTags = '';
  if (cleanPriceAmount) {
    priceMetaTags = `
    <meta property="og:price:amount" content="${escapeHtml(cleanPriceAmount)}" />
    <meta property="og:price:currency" content="COP" />`;
  }

  // Open Graph meta tags optimized for WhatsApp, Telegram, Facebook & Twitter crawlers
  const ogMetaTags = `
    <!-- Open Graph Social Media Preview Tags -->
    <title>${escapeHtml(pageTitle)}</title>
    <meta name="description" content="${escapeHtml(descriptionAndPrice)}" />
    <meta property="og:site_name" content="Como" />
    <meta property="og:title" content="${escapeHtml(name)}" />
    <meta property="og:description" content="${escapeHtml(descriptionAndPrice)}" />
    <meta property="og:image" content="${escapeHtml(imageUrl)}" />
    <meta property="og:image:secure_url" content="${escapeHtml(imageUrl)}" />
    <meta property="og:image:type" content="image/jpeg" />
    <meta property="og:image:width" content="800" />
    <meta property="og:image:height" content="800" />
    <meta property="og:url" content="${escapeHtml(pageUrl)}" />
    <meta property="og:type" content="product" />${priceMetaTags}
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:title" content="${escapeHtml(name)}" />
    <meta name="twitter:description" content="${escapeHtml(descriptionAndPrice)}" />
    <meta name="twitter:image" content="${escapeHtml(imageUrl)}" />
  `;

  let modifiedHtml = originalHtml;
  modifiedHtml = modifiedHtml.replace(/<title>.*?<\/title>/gi, '');

  // Purge any pre-existing duplicate SEO/OG/Twitter tags to prevent WhatsApp cache confusion
  const targetMetas = [
    'description', 'og:site_name', 'og:title', 'og:description', 'og:image',
    'og:image:secure_url', 'og:image:type', 'og:url', 'og:type',
    'twitter:card', 'twitter:title', 'twitter:description', 'twitter:image',
    'og:price:amount', 'og:price:currency'
  ];

  for (const metaName of targetMetas) {
    const rxName = new RegExp(`<meta\\s+[^>]*?(?:name|property)=["']${metaName}["'][^>]*?\\/?>`, 'gi');
    modifiedHtml = modifiedHtml.replace(rxName, '');
  }

  if (modifiedHtml.includes('<head>')) {
    modifiedHtml = modifiedHtml.replace('<head>', `<head>\n${ogMetaTags}`);
  } else if (modifiedHtml.includes('<meta charset')) {
    modifiedHtml = modifiedHtml.replace(/<meta charset[^>]*>/i, (m) => `${m}\n${ogMetaTags}`);
  } else {
    modifiedHtml = ogMetaTags + modifiedHtml;
  }

  return new Response(modifiedHtml, {
    status: 200,
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
      'Cache-Control': 'public, max-age=0, must-revalidate'
    }
  });
};
