import { getSession } from './supabase-server';
import { redirect } from 'next/navigation';

export default async function PricingPage() {
  const session = await getSession();

  if (session) {
    return redirect('/cdi/dashboard');
  } else {
    return redirect('/signin');
  }
}
