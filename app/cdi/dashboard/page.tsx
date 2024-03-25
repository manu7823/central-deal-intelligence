import { getSession, getUserDetails } from '../../supabase-server';
import { redirect } from 'next/navigation';

const DashboardPage = async () => {
  const [session, userDetails] = await Promise.all([
    getSession(),
    getUserDetails()
  ]);

  const user = session?.user;

  if (!session) {
    return redirect('/signin');
  }
  return (
    <section className="container mx-auto mb-20">
      <h1 className="text-4xl my-8">
        Welcome to the Central Deals Intelligence Platform!
      </h1>
    </section>
  );
};

export default DashboardPage;
