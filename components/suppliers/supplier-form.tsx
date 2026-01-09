'use client';

import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Supplier } from '@/lib/db/schema';

interface SupplierFormProps {
  supplier?: Supplier | null;
}

export function SupplierForm({ supplier }: SupplierFormProps) {
  return (
    <div className="space-y-6">
      {/* Basic Information */}
      <Card>
        <CardHeader>
          <CardTitle>Basic Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="name" className="mb-2">
              Supplier Name <span className="text-red-500">*</span>
            </Label>
            <Input
              id="name"
              name="name"
              placeholder="Supplier Company Ltd."
              defaultValue={supplier?.name || ''}
              required
            />
          </div>

          <div>
            <Label htmlFor="contactPerson" className="mb-2">
              Contact Person
            </Label>
            <Input
              id="contactPerson"
              name="contactPerson"
              placeholder="John Doe"
              defaultValue={supplier?.contactPerson || ''}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="email" className="mb-2">
                Email Address
              </Label>
              <Input
                id="email"
                name="email"
                type="email"
                placeholder="supplier@example.bt"
                defaultValue={supplier?.email || ''}
              />
            </div>
            <div>
              <Label htmlFor="gstNumber" className="mb-2">
                GST Number
              </Label>
              <Input
                id="gstNumber"
                name="gstNumber"
                placeholder="e.g., GST123456789"
                maxLength={20}
                defaultValue={supplier?.gstNumber || ''}
              />
              <p className="text-xs text-gray-500 mt-1">
                Supplier's GST registration number
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="tpn" className="mb-2">
                TPN (Tax Payer Number)
              </Label>
              <Input
                id="tpn"
                name="tpn"
                placeholder="e.g., 123456789"
                maxLength={20}
                defaultValue={supplier?.tpn || ''}
              />
            </div>
            <div>
              <Label htmlFor="phone" className="mb-2">
                Phone Number
              </Label>
              <Input
                id="phone"
                name="phone"
                placeholder="+975-2-XXXXXX"
                defaultValue={supplier?.phone || ''}
              />
            </div>
          </div>

          <div>
            <Label htmlFor="mobile" className="mb-2">
              Mobile Number
            </Label>
            <Input
              id="mobile"
              name="mobile"
              placeholder="+975-17XXXXXX"
              defaultValue={supplier?.mobile || ''}
            />
          </div>
        </CardContent>
      </Card>

      {/* Address Information */}
      <Card>
        <CardHeader>
          <CardTitle>Address Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="address" className="mb-2">
              Street Address
            </Label>
            <Textarea
              id="address"
              name="address"
              placeholder="Building name, street, etc."
              rows={2}
              defaultValue={supplier?.address || ''}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="city" className="mb-2">
                City/Town
              </Label>
              <Input
                id="city"
                name="city"
                placeholder="Thimphu"
                defaultValue={supplier?.city || ''}
              />
            </div>
            <div>
              <Label htmlFor="dzongkhag" className="mb-2">
                Dzongkhag
              </Label>
              <Input
                id="dzongkhag"
                name="dzongkhag"
                placeholder="Thimphu"
                defaultValue={supplier?.dzongkhag || ''}
              />
            </div>
            <div>
              <Label htmlFor="postalCode" className="mb-2">
                Postal Code
              </Label>
              <Input
                id="postalCode"
                name="postalCode"
                placeholder="11001"
                defaultValue={supplier?.postalCode || ''}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Banking Information */}
      <Card>
        <CardHeader>
          <CardTitle>Banking Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="bankName" className="mb-2">
              Bank Name
            </Label>
            <Input
              id="bankName"
              name="bankName"
              placeholder="e.g., Bank of Bhutan"
              defaultValue={supplier?.bankName || ''}
            />
            <p className="text-xs text-gray-500 mt-1">
              For making payments to this supplier
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="bankAccountNumber" className="mb-2">
                Account Number
              </Label>
              <Input
                id="bankAccountNumber"
                name="bankAccountNumber"
                placeholder="XXXXXXXXXXXX"
                defaultValue={supplier?.bankAccountNumber || ''}
              />
            </div>
            <div>
              <Label htmlFor="bankAccountName" className="mb-2">
                Account Name
              </Label>
              <Input
                id="bankAccountName"
                name="bankAccountName"
                placeholder="Account holder name"
                defaultValue={supplier?.bankAccountName || ''}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Additional Notes */}
      <Card>
        <CardHeader>
          <CardTitle>Additional Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="notes" className="mb-2">
              Notes
            </Label>
            <Textarea
              id="notes"
              name="notes"
              placeholder="Any additional notes about this supplier..."
              rows={3}
              defaultValue={supplier?.notes || ''}
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
