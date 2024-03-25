import { connection } from '@/utils/pg-connection';
import { Client } from 'pg';

export async function GET(req: Request) {
  if (req.method === 'GET') {
    try {
      const client = new Client(connection);
      await client.connect();

      const res = await client.query(
        'SELECT name, url FROM deal_merchants ORDER BY name ASC'
      );
      await client.end();

      const result = res.rows;

      return new Response(JSON.stringify({ result }), {
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
