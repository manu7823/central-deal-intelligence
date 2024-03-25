import { Database } from '@/types_db';
import { createClient } from '@supabase/supabase-js';
import { parse } from 'url';

// Note: supabaseAdmin uses the SERVICE_ROLE_KEY which you must only use in a secure server-side context
// as it has admin privileges and overwrites RLS policies!
const supabaseAdmin = createClient<Database>(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

export async function GET(req: Request) {
  const url = parse(req.url, true);
  const queryParameters = url.query;

  if (req.method === 'GET') {
    try {
      // get brand slugs from URL query parameters
      let brands: { name: any; slug: any }[] | null = null;
      if (queryParameters['slugs']) {
        let slugs: string[];
        if (typeof queryParameters['slugs'] === 'string') {
          slugs = queryParameters['slugs'].split(',');
        } else {
          slugs = queryParameters['slugs'] || [];
        }

        // get brand ids from slugs
        const res = await supabaseAdmin
          .from('brands_categories_enriched')
          .select('brand_id')
          .in('slug', slugs);

        if (res.error) throw res.error;

        const brand_ids = res.data;

        var uniqueBrandIds = new Set(
          brand_ids.map((brand: any) => brand.brand_id)
        );

        // get brands from brand ids
        const resBrands = await supabaseAdmin
          .from('brands')
          .select('name, slug')
          .in('id', Array.from(uniqueBrandIds))
          .order('name', { ascending: true });

        if (resBrands.error) throw resBrands.error;

        brands = resBrands.data;
      }

      return new Response(JSON.stringify({ brands }), {
        status: 200
      });
    } catch (err: any) {
      console.log(err);
      return new Response(
        JSON.stringify({ error: { statusCode: 500, message: err.message } }),
        {
          status: 500
        }
      );
    }
  } else {
    return new Response('Method Not Allowed', {
      headers: { Allow: 'POST' },
      status: 405
    });
  }
}
