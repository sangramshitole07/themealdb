import { createClient } from 'npm:@supabase/supabase-js@2.57.4';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Client-Info, Apikey',
};

const THEMEALDB_API = 'https://www.themealdb.com/api/json/v1/1';
const CACHE_EXPIRY_MINUTES = 30;
const MAX_CACHE_ENTRIES = 1000;

interface CacheEntry {
  cache_key: string;
  cache_type: string;
  data: unknown;
  expires_at: string;
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const url = new URL(req.url);
    const path = url.pathname.replace('/meal-api', '');

    if (path === '/search') {
      return await handleSearch(supabase, url);
    } else if (path === '/categories') {
      return await handleCategories(supabase);
    } else if (path === '/category') {
      return await handleCategory(supabase, url);
    } else if (path === '/random') {
      return await handleRandom(supabase);
    } else if (path === '/detail') {
      return await handleDetail(supabase, url);
    } else if (path === '/stats') {
      return await handleStats(supabase);
    } else {
      return jsonResponse({ error: 'Endpoint not found' }, 404);
    }
  } catch (error) {
    console.error('Error:', error);
    return jsonResponse({ error: 'Internal server error', message: String(error) }, 500);
  }
});

async function handleSearch(supabase: any, url: URL) {
  const query = url.searchParams.get('q');
  if (!query) {
    return jsonResponse({ error: 'Query parameter "q" is required' }, 400);
  }

  const cacheKey = `search:${query.toLowerCase()}`;
  const cached = await getCache(supabase, cacheKey);

  if (cached) {
    await recordStats(supabase, '/search', true);
    return jsonResponse({ ...cached, cached: true });
  }

  try {
    const response = await fetch(`${THEMEALDB_API}/search.php?s=${encodeURIComponent(query)}`);
    if (!response.ok) {
      throw new Error(`API returned status ${response.status}`);
    }
    const data = await response.json();

    await setCache(supabase, cacheKey, 'search', data);
    await recordStats(supabase, '/search', false);
    await enforceMaxCacheSize(supabase);

    return jsonResponse({ ...data, cached: false });
  } catch (error) {
    console.error('Search API error:', error);
    return jsonResponse({ error: 'Failed to fetch meals', details: String(error) }, 500);
  }
}

async function handleCategories(supabase: any) {
  const cacheKey = 'categories:all';
  const cached = await getCache(supabase, cacheKey);

  if (cached) {
    await recordStats(supabase, '/categories', true);
    return jsonResponse({ ...cached, cached: true });
  }

  try {
    const response = await fetch(`${THEMEALDB_API}/categories.php`);
    if (!response.ok) {
      throw new Error(`API returned status ${response.status}`);
    }
    const data = await response.json();

    await setCache(supabase, cacheKey, 'categories', data);
    await recordStats(supabase, '/categories', false);

    return jsonResponse({ ...data, cached: false });
  } catch (error) {
    console.error('Categories API error:', error);
    return jsonResponse({ error: 'Failed to fetch categories', details: String(error) }, 500);
  }
}

async function handleCategory(supabase: any, url: URL) {
  const category = url.searchParams.get('name');
  if (!category) {
    return jsonResponse({ error: 'Query parameter "name" is required' }, 400);
  }

  const cacheKey = `category:${category.toLowerCase()}`;
  const cached = await getCache(supabase, cacheKey);

  if (cached) {
    await recordStats(supabase, '/category', true);
    return jsonResponse({ ...cached, cached: true });
  }

  try {
    const response = await fetch(`${THEMEALDB_API}/filter.php?c=${encodeURIComponent(category)}`);
    if (!response.ok) {
      throw new Error(`API returned status ${response.status}`);
    }
    const data = await response.json();

    await setCache(supabase, cacheKey, 'category', data);
    await recordStats(supabase, '/category', false);
    await enforceMaxCacheSize(supabase);

    return jsonResponse({ ...data, cached: false });
  } catch (error) {
    console.error('Category API error:', error);
    return jsonResponse({ error: 'Failed to fetch category meals', details: String(error) }, 500);
  }
}

async function handleRandom(supabase: any) {
  try {
    const response = await fetch(`${THEMEALDB_API}/random.php`);
    if (!response.ok) {
      throw new Error(`API returned status ${response.status}`);
    }
    const data = await response.json();

    await recordStats(supabase, '/random', false);

    return jsonResponse({ ...data, cached: false });
  } catch (error) {
    console.error('Random meal API error:', error);
    return jsonResponse({ error: 'Failed to fetch random meal', details: String(error) }, 500);
  }
}

async function handleDetail(supabase: any, url: URL) {
  const id = url.searchParams.get('id');
  if (!id) {
    return jsonResponse({ error: 'Query parameter "id" is required' }, 400);
  }

  const cacheKey = `detail:${id}`;
  const cached = await getCache(supabase, cacheKey);

  if (cached) {
    await recordStats(supabase, '/detail', true);
    return jsonResponse({ ...cached, cached: true });
  }

  try {
    const response = await fetch(`${THEMEALDB_API}/lookup.php?i=${encodeURIComponent(id)}`);
    if (!response.ok) {
      throw new Error(`API returned status ${response.status}`);
    }
    const data = await response.json();

    await setCache(supabase, cacheKey, 'detail', data);
    await recordStats(supabase, '/detail', false);
    await enforceMaxCacheSize(supabase);

    return jsonResponse({ ...data, cached: false });
  } catch (error) {
    console.error('Meal detail API error:', error);
    return jsonResponse({ error: 'Failed to fetch meal details', details: String(error) }, 500);
  }
}

async function handleStats(supabase: any) {
  const { data, error } = await supabase
    .from('cache_stats')
    .select('*')
    .order('last_accessed', { ascending: false });

  if (error) {
    return jsonResponse({ error: 'Failed to fetch stats' }, 500);
  }

  const { count } = await supabase
    .from('meal_cache')
    .select('*', { count: 'exact', head: true });

  return jsonResponse({ stats: data, cache_size: count || 0 });
}

async function getCache(supabase: any, cacheKey: string) {
  const { data, error } = await supabase
    .from('meal_cache')
    .select('data')
    .eq('cache_key', cacheKey)
    .gt('expires_at', new Date().toISOString())
    .maybeSingle();

  if (error || !data) {
    return null;
  }

  return data.data;
}

async function setCache(supabase: any, cacheKey: string, cacheType: string, data: unknown) {
  const expiresAt = new Date(Date.now() + CACHE_EXPIRY_MINUTES * 60 * 1000).toISOString();
  
  await supabase
    .from('meal_cache')
    .upsert({
      cache_key: cacheKey,
      cache_type: cacheType,
      data: data,
      expires_at: expiresAt,
    }, {
      onConflict: 'cache_key'
    });
}

async function recordStats(supabase: any, endpoint: string, isHit: boolean) {
  const { data: existing } = await supabase
    .from('cache_stats')
    .select('*')
    .eq('endpoint', endpoint)
    .maybeSingle();

  if (existing) {
    await supabase
      .from('cache_stats')
      .update({
        hit_count: isHit ? existing.hit_count + 1 : existing.hit_count,
        miss_count: isHit ? existing.miss_count : existing.miss_count + 1,
        last_accessed: new Date().toISOString(),
      })
      .eq('endpoint', endpoint);
  } else {
    await supabase
      .from('cache_stats')
      .insert({
        endpoint: endpoint,
        hit_count: isHit ? 1 : 0,
        miss_count: isHit ? 0 : 1,
        last_accessed: new Date().toISOString(),
      });
  }
}

async function enforceMaxCacheSize(supabase: any) {
  const { count } = await supabase
    .from('meal_cache')
    .select('*', { count: 'exact', head: true });

  if (count && count > MAX_CACHE_ENTRIES) {
    const { data: oldestEntries } = await supabase
      .from('meal_cache')
      .select('id')
      .order('created_at', { ascending: true })
      .limit(count - MAX_CACHE_ENTRIES);

    if (oldestEntries && oldestEntries.length > 0) {
      const ids = oldestEntries.map((entry: any) => entry.id);
      await supabase
        .from('meal_cache')
        .delete()
        .in('id', ids);
    }
  }
}

function jsonResponse(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      ...corsHeaders,
      'Content-Type': 'application/json',
    },
  });
}