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

      const sub_pref_merchant_records = jsonMerchants.map((merchant: any) => ({
        sub_pref: newPreferencesId,
        merchant: merchant.id
      }));

      // 4. Insert the merchants preferences association into the database
      const resultAddMerchants = await supabaseAdmin
        .from('deal_sub_pref_merchants')
        .insert(sub_pref_merchant_records);

      if (resultAddMerchants.error) throw resultAddMerchants.error;

      const sub_pref_category_records = jsonCategories.map((category: any) => ({
        sub_pref: newPreferencesId,
        category: category.id
      }));

      // 5. Insert the categories preferences association into the database
      const resultAddCategories = await supabaseAdmin
        .from('deal_sub_pref_categories')
        .insert(sub_pref_category_records);

      if (resultAddCategories.error) throw resultAddCategories.error;

      const sub_pref_brands_records = jsonBrands.map((brands: any) => ({
        sub_pref: newPreferencesId,
        merchant: brands.id
      }));

      // 6. Insert the brands preferences association into the database
      const resultAddBrands = await supabaseAdmin
        .from('deal_sub_pref_brands')
        .insert(sub_pref_brands_records);

      if (resultAddBrands.error) throw resultAddBrands.error;

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

      // 3. Delete all the merchants preferences association from the database
      const resultDeleteMerchants = await supabaseAdmin
        .from('deal_sub_pref_merchants')
        .delete()
        .eq('sub_pref', id);

      if (resultDeleteMerchants.error) throw resultDeleteMerchants.error;

      const sub_pref_merchant_records = jsonMerchants.map((merchant: any) => ({
        sub_pref: id,
        merchant: merchant.id
      }));

      // 4. Insert the merchants preferences association into the database
      const resultAddMerchants = await supabaseAdmin
        .from('deal_sub_pref_merchants')
        .insert(sub_pref_merchant_records);

      if (resultAddMerchants.error) throw resultAddMerchants.error;

      // 5. Delete all the categories preferences association from the database
      const resultDeleteCategories = await supabaseAdmin
        .from('deal_sub_pref_categories')
        .delete()
        .eq('sub_pref', id);

      if (resultDeleteCategories.error) throw resultDeleteCategories.error;

      const sub_pref_category_records = jsonCategories.map((category: any) => ({
        sub_pref: id,
        category: category.id
      }));

      // 6. Insert the categories preferences association into the database
      const resultAddCategories = await supabaseAdmin
        .from('deal_sub_pref_categories')
        .insert(sub_pref_category_records);

      if (resultAddCategories.error) throw resultAddCategories.error;

      // 7. Delete all the brands preferences association from the database
      const resultDeleteBrands = await supabaseAdmin
        .from('deal_sub_pref_brands')
        .delete()
        .eq('sub_pref', id);

      if (resultDeleteBrands.error) throw resultDeleteBrands.error;

      const sub_pref_brands_records = jsonBrands.map((brands: any) => ({
        sub_pref: id,
        brand: brands.id
      }));

      // 8. Insert the brands preferences association into the database
      const resultAddBrands = await supabaseAdmin
        .from('deal_sub_pref_brands')
        .insert(sub_pref_brands_records);

      if (resultAddBrands.error) throw resultAddBrands.error;

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
