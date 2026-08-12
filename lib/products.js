import productsData from './data/products.json';

// Simple delay to simulate network/db latency if needed
const delay = (ms) => new Promise((res) => setTimeout(res, ms));

export async function getProducts(params = {}) {
  // await delay(100);
  let result = [...productsData];

  // Filtering
  if (params.category) {
    result = result.filter(p => p.category.toLowerCase() === params.category.toLowerCase());
  }
  if (params.collection) {
    result = result.filter(p => p.collection.toLowerCase() === params.collection.toLowerCase());
  }
  if (params.featured !== undefined) {
    result = result.filter(p => p.featured === params.featured);
  }
  if (params.active !== undefined) {
    result = result.filter(p => p.active === params.active);
  }
  
  if (params.query) {
    const q = params.query.toLowerCase();
    result = result.filter(p => 
      p.name.toLowerCase().includes(q) || 
      p.description.toLowerCase().includes(q) || 
      p.category.toLowerCase().includes(q)
    );
  }

  // Sorting
  if (params.orderBy) {
    for (const key in params.orderBy) {
      const order = params.orderBy[key]; // 'asc' or 'desc'
      result.sort((a, b) => {
        if (a[key] < b[key]) return order === 'asc' ? -1 : 1;
        if (a[key] > b[key]) return order === 'asc' ? 1 : -1;
        return 0;
      });
    }
  } else {
    // Default sort by created at desc
    result.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  }

  // Pagination
  const page = params.page || 1;
  const limit = params.limit;
  let total = result.length;

  if (limit) {
    const start = (page - 1) * limit;
    result = result.slice(start, start + limit);
  }

  return {
    products: result,
    total,
    page,
    totalPages: limit ? Math.ceil(total / limit) : 1
  };
}

export async function getProductById(id) {
  return productsData.find(p => p.id === id) || null;
}

export async function getProductBySlug(slug) {
  return productsData.find(p => p.slug === slug) || null;
}
