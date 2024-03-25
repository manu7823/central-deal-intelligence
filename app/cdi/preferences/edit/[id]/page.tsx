import { Database } from '@/types_db';
import { getSession } from '../../../../supabase-server';
import NewFilterForm from '@/components/NewFilterForm';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';
import { createClient } from '@supabase/supabase-js';
import {
  IDbBrand,
  IDbCategory,
  IDbMerchant,
  IDbPreference
} from '@/utils/types';

// Note: supabaseAdmin uses the SERVICE_ROLE_KEY which you must only use in a secure server-side context
// as it has admin privileges and overwrites RLS policies!
const supabaseAdmin = createClient<Database>(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

const EditPreferencesPage = async ({ params }: any) => {
  const [session] = await Promise.all([getSession()]);

  if (!session) {
    return redirect('/signin');
  }

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

  // Get the preference from the database
  const resultPreference = await supabaseAdmin
    .from('deal_sub_pref')
    .select()
    .eq('id', params.id)
    .eq('user', user.id)
    .returns<IDbPreference>()
    .single();

  if (resultPreference.error) throw resultPreference.error;

  const perference = resultPreference.data;

  // Get the merchants from the database
  const resultMerchants = await supabaseAdmin
    .from('deal_sub_pref_merchants')
    .select('merchant ( id, name, url )')
    .eq('sub_pref', params.id)
    .returns<IDbMerchant[]>();

  if (resultMerchants.error) throw resultMerchants.error;

  const merchants = resultMerchants.data;

  // Get the categories from the database
  const resultCategories = await supabaseAdmin
    .from('deal_sub_pref_categories')
    .select('category ( id, name, slug, level )')
    .eq('sub_pref', params.id)
    .returns<IDbCategory[]>();

  if (resultCategories.error) throw resultCategories.error;

  const categories = resultCategories.data;

  // Get the brands from the database
  const resultBrands = await supabaseAdmin
    .from('deal_sub_pref_brands')
    .select('brand ( id, name, slug )')
    .eq('sub_pref', params.id)
    .returns<IDbBrand[]>();

  if (resultBrands.error) throw resultBrands.error;

  const brands = resultBrands.data;

  return (
    <section className="container mx-auto mb-20">
      <div className="max-w-screen-lg">
        <h1 className="text-4xl my-8">Preferences</h1>
        <div className="my-8 space-y-8 max-w-screen-md">
          <div>
            <h3 className="text-base font-semibold leading-7 text-gray-900">
              Lorem Ipsum
            </h3>
            <p className="mt-1 text-sm leading-6 text-gray-600">Lorem Ipsum</p>
            <NewFilterForm
              initPreference={perference}
              initMerchants={merchants}
              initCategories={categories}
              initBrands={brands}
            />
          </div>
        </div>
      </div>
    </section>
  );
};

export default EditPreferencesPage;
