import { getSession } from '../../../supabase-server';
import NewFilterForm from '@/components/NewFilterForm';
import { redirect } from 'next/navigation';

export default async function Account() {
  const [session] = await Promise.all([getSession()]);

  if (!session) {
    return redirect('/signin');
  }

  return (
    <section className="container mx-auto mb-20">
      <div className="max-w-screen-lg">
        <h1 className="text-4xl my-8">Preferences</h1>
        <div className="my-8 space-y-8 max-w-screen-md">
          <div>
            <NewFilterForm />
          </div>
        </div>
      </div>
    </section>
  );
}
