import { Database } from '@/types_db';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { createClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';
import { parse } from 'url';

// Note: supabaseAdmin uses the SERVICE_ROLE_KEY which you must only use in a secure server-side context
// as it has admin privileges and overwrites RLS policies!
const supabaseAdmin = createClient<Database>(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

export async function POST(req: Request) {
  if (req.method === 'POST') {
    try {
      // 1. Get the user from Supabase auth
      const supabase = createRouteHandlerClient<Database>({ cookies });
      const {
        data: { user }
      } = await supabase.auth.getUser();

      if (!user) {
        return new Response('Unauthorized', {
          status: 401
        });
      }

      // 2. Retrieve data from the request body
      const {
        name,
        country,
        minScore,
        delay,
        priceError,
        merchants,
        categories,
        brands,
        cadence,
        incrementalOnly,
        whatsappNotificationReport,
        whatsappNotificationSingleDeals
      } = await req.json();
      const jsonMerchants = JSON.parse(merchants);
      const jsonCategories = JSON.parse(categories);
      const jsonBrands = JSON.parse(brands);

      // TODO: Improvement: Do all the insert call with one transactional rpc call

      // 3. Insert the preferences into the database
      const resultAddPreferences = await supabaseAdmin
        .from('deal_sub_pref')
        .insert({
          user: user.id,
          name,
          country,
          min_score: minScore,
          delay,
          price_error: priceError,
          cadence,
          incremental: incrementalOnly,
          whatsapp_notification_report: whatsappNotificationReport,
          whatsapp_notification_single_deals: whatsappNotificationSingleDeals
        })
        .select('id')
        .single();

      if (resultAddPreferences.error) throw resultAddPreferences.error;

      const newPreferencesId = resultAddPreferences.data.id;

      // 4. Erich the merchants with their IDs
      const enrichedMerchants = await Promise.all(
        jsonMerchants.map(async (merchant: any) => ({
          ...merchant,
          id: await supabaseAdmin
            .from('deal_merchants')
            .select('id')
            .eq('name', merchant.label)
            .single()
            .then((res: any) => res.data.id)
        }))
      );

      // 5. Insert the merchants preferences association into the database
      await Promise.all(
        enrichedMerchants.map(async (merchant: any) => {
          const { data, error } = await supabaseAdmin
            .from('deal_sub_pref_merchants')
            .insert([
              {
                sub_pref: newPreferencesId,
                merchant: merchant.id
              }
            ]);

          if (error) throw error;
        })
      );

      // 6. Enrich the categories with their IDs
      const enrichedCategories = await Promise.all(
        jsonCategories.map(async (category: any) => ({
          ...category,
          id: await supabaseAdmin
            .from('categories')
            .select('id')
            .eq('slug', category.slug)
            .single()
            .then((res: any) => res.data.id)
        }))
      );

      // 7. Insert the categories preferences association into the database
      await Promise.all(
        enrichedCategories.map(async (category: any) => {
          const { data, error } = await supabaseAdmin
            .from('deal_sub_pref_categories')
            .insert([
              {
                sub_pref: newPreferencesId,
                category: category.id
              }
            ]);

          if (error) throw error;
        })
      );

      // 8. Enrich the brands with their IDs
      const enrichedBrands = await Promise.all(
        jsonBrands.map(async (brand: any) => ({
          ...brand,
          id: await supabaseAdmin
            .from('brands')
            .select('id')
            .eq('slug', brand.key)
            .single()
            .then((res: any) => res.data.id)
        }))
      );

      // 9. Insert the brands preferences association into the database
      await Promise.all(
        enrichedBrands.map(async (brand: any) => {
          const { data, error } = await supabaseAdmin
            .from('deal_sub_pref_brands')
            .insert([
              {
                sub_pref: newPreferencesId,
                brand: brand.id
              }
            ]);

          if (error) throw error;
        })
      );

      return new Response('ok', {
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

export async function GET(req: Request) {
  if (req.method === 'GET') {
    try {
      // 1. Get the user from Supabase auth
      const supabase = createRouteHandlerClient<Database>({ cookies });
      const {
        data: { user }
      } = await supabase.auth.getUser();

      if (!user) {
        return new Response('Unauthorized', {
          status: 401
        });
      }

      // 2. Get all preferences from the database
      const resultAllPreferences = await supabaseAdmin
        .from('deal_sub_pref')
        .select()
        .eq('user', user.id)
        .order('created_at', { ascending: false });

      if (resultAllPreferences.error) throw resultAllPreferences.error;

      return new Response(JSON.stringify({ resultAllPreferences }), {
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
      headers: { Allow: 'GET' },
      status: 405
    });
  }
}

export async function PUT(req: Request) {
  if (req.method === 'PUT') {
    try {
      // 1. Get the user from Supabase auth
      const supabase = createRouteHandlerClient<Database>({ cookies });
      const {
        data: { user }
      } = await supabase.auth.getUser();

      if (!user) {
        return new Response('Unauthorized', {
          status: 401
        });
      }

      // 2. Retrieve data from the request body
      const {
        id,
        name,
        country,
        minScore,
        delay,
        priceError,
        merchants,
        categories,
        brands,
        cadence,
        incrementalOnly,
        whatsappNotificationReport,
        whatsappNotificationSingleDeals
      } = await req.json();
      const jsonMerchants = JSON.parse(merchants);
      const jsonCategories = JSON.parse(categories);
      const jsonBrands = JSON.parse(brands);

      // 2. Update preference
      const resultUpdatePreference = await supabaseAdmin
        .from('deal_sub_pref')
        .update({
          name,
          country,
          min_score: minScore,
          delay,
          price_error: priceError,
          cadence,
          incremental: incrementalOnly,
          whatsapp_notification_report: whatsappNotificationReport,
          whatsapp_notification_single_deals: whatsappNotificationSingleDeals
        })
        .eq('id', id)
        .eq('user', user.id);

      if (resultUpdatePreference.error) throw resultUpdatePreference.error;

      // 3. Erich new merchants with their IDs
      const enrichedNewMerchants = await Promise.all(
        jsonMerchants.map(async (merchant: any) => ({
          ...merchant,
          id: await supabaseAdmin
            .from('deal_merchants')
            .select('id')
            .eq('name', merchant.label)
            .single()
            .then((res: any) => res.data.id)
        }))
      );

      // 4. Delete all the merchants preferences association from the database
      const resultDeleteMerchants = await supabaseAdmin
        .from('deal_sub_pref_merchants')
        .delete()
        .eq('sub_pref', id);

      if (resultDeleteMerchants.error) throw resultDeleteMerchants.error;

      // 5. Insert the merchants preferences association into the database
      await Promise.all(
        enrichedNewMerchants.map(async (merchant: any) => {
          const { data, error } = await supabaseAdmin
            .from('deal_sub_pref_merchants')
            .insert([
              {
                sub_pref: id,
                merchant: merchant.id
              }
            ]);

          if (error) throw error;
        })
      );

      // 6. Enrich the categories with their IDs
      const enrichedNewCategories = await Promise.all(
        jsonCategories.map(async (category: any) => ({
          ...category,
          id: await supabaseAdmin
            .from('categories')
            .select('id')
            .eq('slug', category.slug)
            .single()
            .then((res: any) => res.data.id)
        }))
      );

      // 7. Delete all the categories preferences association from the database
      const resultDeleteCategories = await supabaseAdmin
        .from('deal_sub_pref_categories')
        .delete()
        .eq('sub_pref', id);

      if (resultDeleteCategories.error) throw resultDeleteCategories.error;

      // 8. Insert the categories preferences association into the database
      await Promise.all(
        enrichedNewCategories.map(async (category: any) => {
          const { data, error } = await supabaseAdmin
            .from('deal_sub_pref_categories')
            .insert([
              {
                sub_pref: id,
                category: category.id
              }
            ]);

          if (error) throw error;
        })
      );

      // 9. Enrich the brands with their IDs
      const enrichedNewBrands = await Promise.all(
        jsonBrands.map(async (brand: any) => ({
          ...brand,
          id: await supabaseAdmin
            .from('brands')
            .select('id')
            .eq('slug', brand.key)
            .single()
            .then((res: any) => res.data.id)
        }))
      );

      // 10. Delete all the brands preferences association from the database
      const resultDeleteBrands = await supabaseAdmin
        .from('deal_sub_pref_brands')
        .delete()
        .eq('sub_pref', id);

      if (resultDeleteBrands.error) throw resultDeleteBrands.error;

      // 11. Insert the brands preferences association into the database
      await Promise.all(
        enrichedNewBrands.map(async (brand: any) => {
          const { data, error } = await supabaseAdmin
            .from('deal_sub_pref_brands')
            .insert([
              {
                sub_pref: id,
                brand: brand.id
              }
            ]);

          if (error) throw error;
        })
      );

      return new Response(JSON.stringify({ resultUpdatePreference }), {
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
      headers: { Allow: 'PUT' },
      status: 405
    });
  }
}
