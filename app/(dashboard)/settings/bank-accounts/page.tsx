import { getBankAccounts } from '@/lib/bank-accounts/queries';
import { BankAccountsList } from '@/components/bank-accounts/bank-accounts-list';

export default async function BankAccountsPage() {
  const accounts = await getBankAccounts();

  return (
    <section className="flex-1 p-4 lg:p-8">
      <div className="max-w-6xl">
        <div className="mb-6">
          <h1 className="text-lg lg:text-2xl font-medium text-gray-900">
            Bank Accounts
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Manage your business bank accounts and payment methods
          </p>
        </div>

        <BankAccountsList initialAccounts={accounts} />
      </div>
    </section>
  );
}
