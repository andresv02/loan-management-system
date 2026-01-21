import { db } from '@/lib/db';
import { companies } from '@/lib/schema';
import CompaniesTable from '@/components/CompaniesTable';
import { redirect } from 'next/navigation';
import { getSession } from '@/lib/auth';

export default async function CompaniesPage() {
  const session = await getSession();
  if (!session) {
    redirect('/login');
  }
  const companiesData = await db.query.companies.findMany({
    orderBy: (companies, { asc }) => [asc(companies.name)],
  });

  return (
    <div className="flex min-h-screen flex-col">
      <div className="container mx-auto py-10">
        <h1 className="text-2xl font-bold mb-6">Compañías</h1>
        <CompaniesTable companies={companiesData} />
      </div>
    </div>
  );
}