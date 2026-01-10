'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { BankAccountForm } from './bank-account-form';
import { deleteBankAccount, setDefaultBankAccount } from '@/lib/bank-accounts/actions';
import type { BankAccount } from '@/lib/db/schema';
import { Plus, Edit, Trash2, Star, CreditCard, QrCode } from 'lucide-react';
import Image from 'next/image';
import useSWR from 'swr';

const fetcher = (url: string) => fetch(url).then((res) => res.json());

interface BankAccountsListProps {
  initialAccounts: BankAccount[];
}

export function BankAccountsList({ initialAccounts }: BankAccountsListProps) {
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [editingAccount, setEditingAccount] = useState<BankAccount | null>(null);
  const { data: accounts, mutate } = useSWR<BankAccount[]>(
    '/api/bank-accounts',
    fetcher,
    { fallbackData: initialAccounts }
  );

  const handleDelete = async (accountId: number) => {
    const result = await deleteBankAccount({ id: accountId });
    if ('success' in result && result.success) {
      mutate();
    } else {
      alert(('error' in result && result.error) || 'Failed to delete account');
    }
  };

  const handleSetDefault = async (accountId: number) => {
    const result = await setDefaultBankAccount({ id: accountId });
    if ('success' in result && result.success) {
      mutate();
    } else {
      alert(('error' in result && result.error) || 'Failed to set default account');
    }
  };

  const handleFormSuccess = () => {
    setIsAddDialogOpen(false);
    setEditingAccount(null);
    mutate();
  };

  const getPaymentMethodLabel = (method: string) => {
    const methodMap: Record<string, string> = {
      bank_transfer: 'Bank Transfer',
      mbob: 'mBoB',
      mpay: 'mPay',
      cash: 'Cash',
      cheque: 'Cheque',
      other: 'Other',
    };
    return methodMap[method] || method;
  };

  return (
    <div className="space-y-6">
      {/* Add Button */}
      <div className="flex justify-end">
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-orange-500 hover:bg-orange-600 text-white">
              <Plus className="mr-2 h-4 w-4" />
              Add Bank Account
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Add Bank Account</DialogTitle>
              <DialogDescription>
                Add a new bank account for receiving payments
              </DialogDescription>
            </DialogHeader>
            <BankAccountForm onSuccess={handleFormSuccess} />
          </DialogContent>
        </Dialog>
      </div>

      {/* Accounts List */}
      {accounts && accounts.length > 0 ? (
        <div className="grid gap-6 md:grid-cols-2">
          {accounts.map((account) => (
            <Card key={account.id} className={account.isDefault ? 'border-orange-500 border-2' : ''}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <CardTitle className="text-lg">{account.bankName}</CardTitle>
                      {account.isDefault && (
                        <Badge className="bg-orange-500">
                          <Star className="h-3 w-3 mr-1" />
                          Default
                        </Badge>
                      )}
                    </div>
                    <CardDescription className="mt-1">
                      {account.accountName}
                    </CardDescription>
                  </div>
                  <div className="flex gap-2">
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setEditingAccount(account)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                        <DialogHeader>
                          <DialogTitle>Edit Bank Account</DialogTitle>
                          <DialogDescription>
                            Update bank account details
                          </DialogDescription>
                        </DialogHeader>
                        <BankAccountForm account={account} onSuccess={handleFormSuccess} />
                      </DialogContent>
                    </Dialog>

                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="ghost" size="sm" className="text-red-600 hover:text-red-700">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Delete Bank Account</AlertDialogTitle>
                          <AlertDialogDescription>
                            Are you sure you want to delete this bank account? This action cannot be undone.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => handleDelete(account.id)}
                            className="bg-red-600 hover:bg-red-700"
                          >
                            Delete
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2">
                    <CreditCard className="h-4 w-4 text-gray-400" />
                    <span className="text-gray-600">Account Number:</span>
                    <span className="font-medium">{account.accountNumber}</span>
                  </div>
                  {account.branch && (
                    <div className="flex items-center gap-2">
                      <span className="text-gray-600">Branch:</span>
                      <span>{account.branch}</span>
                    </div>
                  )}
                  {account.accountType && (
                    <div className="flex items-center gap-2">
                      <span className="text-gray-600">Type:</span>
                      <span className="capitalize">{account.accountType}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-2">
                    <span className="text-gray-600">Payment Method:</span>
                    <Badge variant="outline">{getPaymentMethodLabel(account.paymentMethod)}</Badge>
                  </div>
                </div>

                {account.qrCodeUrl && (
                  <div className="pt-4 border-t">
                    <div className="flex items-center gap-2 mb-2">
                      <QrCode className="h-4 w-4 text-gray-400" />
                      <span className="text-sm font-medium">Payment QR Code</span>
                    </div>
                    <Image
                      src={account.qrCodeUrl}
                      alt="Payment QR Code"
                      width={150}
                      height={150}
                      className="border rounded-lg"
                    />
                  </div>
                )}

                {account.notes && (
                  <div className="pt-4 border-t">
                    <p className="text-sm text-gray-600">{account.notes}</p>
                  </div>
                )}

                {!account.isDefault && (
                  <div className="pt-4 border-t">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleSetDefault(account.id)}
                      className="w-full"
                    >
                      <Star className="h-4 w-4 mr-2" />
                      Set as Default
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <CreditCard className="h-12 w-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No bank accounts yet</h3>
            <p className="text-sm text-gray-500 mb-4">
              Add your first bank account to start receiving payments
            </p>
            <Button
              onClick={() => setIsAddDialogOpen(true)}
              className="bg-orange-500 hover:bg-orange-600 text-white"
            >
              <Plus className="mr-2 h-4 w-4" />
              Add Bank Account
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
