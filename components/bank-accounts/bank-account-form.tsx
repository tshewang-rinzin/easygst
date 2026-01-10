'use client';

import { useState, useActionState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { createBankAccount, updateBankAccount } from '@/lib/bank-accounts/actions';
import { PAYMENT_METHODS, ACCOUNT_TYPES } from '@/lib/bank-accounts/validation';
import { Loader2, AlertCircle, CheckCircle2, Upload, X } from 'lucide-react';
import type { BankAccount } from '@/lib/db/schema';
import Image from 'next/image';

type ActionState = {
  error?: string;
  success?: string;
};

interface BankAccountFormProps {
  account?: BankAccount | null;
  onSuccess?: () => void;
}

export function BankAccountForm({ account, onSuccess }: BankAccountFormProps) {
  const [isDefault, setIsDefault] = useState(account?.isDefault ?? false);
  const [isActive, setIsActive] = useState(account?.isActive ?? true);
  const [paymentMethod, setPaymentMethod] = useState(account?.paymentMethod || 'bank_transfer');
  const [accountType, setAccountType] = useState(account?.accountType || 'savings');
  const [qrCodePreview, setQrCodePreview] = useState<string | null>(account?.qrCodeUrl || null);
  const [qrCodeFile, setQrCodeFile] = useState<File | null>(null);

  const action = account ? updateBankAccount : createBankAccount;
  const [state, formAction, isPending] = useActionState<ActionState, FormData>(
    async (prevState: ActionState, formData: FormData) => {
      const result = await action(formData);
      if ('success' in result && result.success && onSuccess) {
        onSuccess();
      }
      return result;
    },
    {}
  );

  const handleQrCodeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file size (max 2MB)
      if (file.size > 2 * 1024 * 1024) {
        alert('QR code file size must be less than 2MB');
        return;
      }

      // Validate file type
      if (!file.type.startsWith('image/')) {
        alert('Please upload an image file');
        return;
      }

      setQrCodeFile(file);

      // Create preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setQrCodePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const removeQrCode = () => {
    setQrCodePreview(null);
    setQrCodeFile(null);
  };

  return (
    <form action={formAction}>
      {account && <input type="hidden" name="id" value={account.id} />}

      <Card>
        <CardHeader>
          <CardTitle>{account ? 'Edit Bank Account' : 'Add Bank Account'}</CardTitle>
          <CardDescription>
            {account
              ? 'Update bank account details and payment information'
              : 'Add a new bank account for receiving payments'}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Bank Name */}
          <div>
            <Label htmlFor="bankName" className="mb-2">
              Bank Name <span className="text-red-500">*</span>
            </Label>
            <Input
              id="bankName"
              name="bankName"
              placeholder="e.g., Bank of Bhutan"
              defaultValue={account?.bankName || ''}
              required
              maxLength={100}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Account Number */}
            <div>
              <Label htmlFor="accountNumber" className="mb-2">
                Account Number <span className="text-red-500">*</span>
              </Label>
              <Input
                id="accountNumber"
                name="accountNumber"
                placeholder="Account number"
                defaultValue={account?.accountNumber || ''}
                required
                maxLength={50}
              />
            </div>

            {/* Account Name */}
            <div>
              <Label htmlFor="accountName" className="mb-2">
                Account Holder Name <span className="text-red-500">*</span>
              </Label>
              <Input
                id="accountName"
                name="accountName"
                placeholder="Account holder name"
                defaultValue={account?.accountName || ''}
                required
                maxLength={100}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Branch */}
            <div>
              <Label htmlFor="branch" className="mb-2">
                Branch
              </Label>
              <Input
                id="branch"
                name="branch"
                placeholder="Branch name"
                defaultValue={account?.branch || ''}
                maxLength={100}
              />
            </div>

            {/* Account Type */}
            <div>
              <Label htmlFor="accountType" className="mb-2">
                Account Type
              </Label>
              <Select
                name="accountType"
                value={accountType}
                onValueChange={setAccountType}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select account type" />
                </SelectTrigger>
                <SelectContent>
                  {ACCOUNT_TYPES.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Payment Method */}
          <div>
            <Label htmlFor="paymentMethod" className="mb-2">
              Payment Method <span className="text-red-500">*</span>
            </Label>
            <Select
              name="paymentMethod"
              value={paymentMethod}
              onValueChange={setPaymentMethod}
              required
            >
              <SelectTrigger>
                <SelectValue placeholder="Select payment method" />
              </SelectTrigger>
              <SelectContent>
                {PAYMENT_METHODS.map((method) => (
                  <SelectItem key={method.value} value={method.value}>
                    {method.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-gray-500 mt-1">
              Choose the payment method this account is associated with
            </p>
          </div>

          {/* QR Code Upload */}
          <div>
            <Label htmlFor="qrCode" className="mb-2">
              Payment QR Code
            </Label>
            {qrCodePreview ? (
              <div className="space-y-2">
                <div className="relative inline-block">
                  <Image
                    src={qrCodePreview}
                    alt="QR Code Preview"
                    width={200}
                    height={200}
                    className="border rounded-lg"
                  />
                  <button
                    type="button"
                    onClick={removeQrCode}
                    className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
                <input type="hidden" name="qrCodeUrl" value={qrCodePreview} />
              </div>
            ) : (
              <div className="flex items-center gap-4">
                <label
                  htmlFor="qrCode"
                  className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 cursor-pointer"
                >
                  <Upload className="h-4 w-4" />
                  Upload QR Code
                </label>
                <input
                  type="file"
                  id="qrCode"
                  accept="image/*"
                  onChange={handleQrCodeChange}
                  className="hidden"
                />
              </div>
            )}
            <p className="text-xs text-gray-500 mt-1">
              Upload a QR code image for customers to scan and pay (max 2MB)
            </p>
          </div>

          {/* Notes */}
          <div>
            <Label htmlFor="notes" className="mb-2">
              Notes
            </Label>
            <Textarea
              id="notes"
              name="notes"
              placeholder="Any additional notes about this account"
              defaultValue={account?.notes || ''}
              rows={3}
              maxLength={1000}
            />
          </div>

          {/* Settings */}
          <div className="space-y-4 p-4 bg-gray-50 border rounded-md">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="isDefault"
                name="isDefault"
                checked={isDefault}
                onCheckedChange={(checked) => setIsDefault(checked === true)}
              />
              <div className="flex-1">
                <Label
                  htmlFor="isDefault"
                  className="text-sm font-medium cursor-pointer"
                >
                  Set as Default Account
                </Label>
                <p className="text-xs text-gray-600 mt-1">
                  This account will be shown by default on invoices
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="isActive"
                name="isActive"
                checked={isActive}
                onCheckedChange={(checked) => setIsActive(checked === true)}
              />
              <div className="flex-1">
                <Label
                  htmlFor="isActive"
                  className="text-sm font-medium cursor-pointer"
                >
                  Active
                </Label>
                <p className="text-xs text-gray-600 mt-1">
                  Only active accounts will be available for selection
                </p>
              </div>
            </div>
          </div>

          {/* Hidden field for sortOrder */}
          <input type="hidden" name="sortOrder" value={account?.sortOrder || 0} />

          {state?.error && (
            <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-md text-red-700">
              <AlertCircle className="h-4 w-4 flex-shrink-0" />
              <span className="text-sm">{state.error}</span>
            </div>
          )}

          {state?.success && (
            <div className="flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded-md text-green-700">
              <CheckCircle2 className="h-4 w-4 flex-shrink-0" />
              <span className="text-sm">{state.success}</span>
            </div>
          )}
        </CardContent>
        <CardFooter className="gap-2">
          <Button
            type="submit"
            disabled={isPending}
            className="bg-orange-500 hover:bg-orange-600 text-white"
          >
            {isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              <>{account ? 'Update Account' : 'Add Account'}</>
            )}
          </Button>
        </CardFooter>
      </Card>
    </form>
  );
}
