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
      // create base query for all level 1 categories
      let query1 = supabaseAdmin
        .from('categories')
        .select()
        .filter('subscribable', 'eq', 'true')
        .filter('level', 'eq', '1')
        .order('name', { ascending: true });

      const res1 = await query1;

      if (res1.error) throw res1.error;

      let query2 = supabaseAdmin
        .from('categories')
        .select()
        .filter('subscribable', 'eq', 'true')
        .filter('level', 'eq', '2')
        .order('name', { ascending: true });

      const res2 = await query2;

      if (res2.error) throw res2.error;

      let query3 = supabaseAdmin
        .from('categories')
        .select()
        .filter('subscribable', 'eq', 'true')
        .filter('level', 'eq', 3)
        .order('name', { ascending: true });

      const res3 = await query3;

      if (res3.error) throw res3.error;

      const res4 = await supabaseAdmin
        .from('categories')
        .select()
        .filter('subscribable', 'eq', 'true')
        .filter('level', 'eq', 4)
        .order('name', { ascending: true });

      if (res4.error) throw res4.error;

      const res567 = await supabaseAdmin
        .from('categories')
        .select()
        .filter('subscribable', 'eq', 'true')
        .filter('level', 'in', '(5, 6, 7)')
        .order('name', { ascending: true });

      if (res567.error) throw res567.error;

      const res = res1.data.concat(
        res2.data,
        res3.data,
        res4.data,
        res567.data
      );

      return new Response(JSON.stringify({ res }), {
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
