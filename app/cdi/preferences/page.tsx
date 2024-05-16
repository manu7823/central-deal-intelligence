import { getSession } from '../../supabase-server';
import TablePreferences from '@/components/TablePreferences';
import Link from 'next/link';
import { redirect } from 'next/navigation';

const PreferecesPage = async () => {
  const [session] = await Promise.all([getSession()]);

  if (!session) {
    return redirect('/signin');
  }

  return (
    <section className="container mx-auto mb-20">
      <h1 className="text-4xl my-8">Preferences</h1>
      <div className="sm:flex sm:items-center">
        <div className="sm:flex-auto">
          <p className="mt-2 text-sm text-gray-700">
            A list of all preferences in your account.
          </p>
        </div>
        <div className="mt-4 sm:ml-16 sm:mt-0 sm:flex-none">
          <Link
            href={'/cdi/preferences/new'}
            type="button"
            className="block rounded-md bg-indigo-600 px-3 py-2 text-center text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
          >
            Add preference
          </Link>
        </div>
      </div>
      <TablePreferences />
    </section>
  );
};

export default PreferecesPage;
