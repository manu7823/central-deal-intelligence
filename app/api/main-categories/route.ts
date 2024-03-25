import { Database } from '@/types_db';
import { createClient } from '@supabase/supabase-js';

// Note: supabaseAdmin uses the SERVICE_ROLE_KEY which you must only use in a secure server-side context
// as it has admin privileges and overwrites RLS policies!
const supabaseAdmin = createClient<Database>(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

export async function GET(req: Request) {
  if (req.method === 'GET') {
    try {
      const res = await supabaseAdmin
        .from('categories')
        .select()
        .filter('subscribable', 'eq', 'true')
        .filter('level', 'eq', '1')
        .order('name', { ascending: true });

      if (res.error) throw res.error;

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
