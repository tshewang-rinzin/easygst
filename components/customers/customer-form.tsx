'use client';

import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Customer } from '@/lib/db/schema';

interface CustomerFormProps {
  customer?: Customer | null;
}

export function CustomerForm({ customer }: CustomerFormProps) {
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
              Customer Name <span className="text-red-500">*</span>
            </Label>
            <Input
              id="name"
              name="name"
              placeholder="ABC Company Ltd."
              defaultValue={customer?.name || ''}
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
              defaultValue={customer?.contactPerson || ''}
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
                placeholder="customer@example.bt"
                defaultValue={customer?.email || ''}
              />
            </div>
            <div>
              <Label htmlFor="tpn" className="mb-2">
                TPN (Tax Payer Number)
              </Label>
              <Input
                id="tpn"
                name="tpn"
                placeholder="e.g., 123456789"
                maxLength={20}
                defaultValue={customer?.tpn || ''}
              />
              <p className="text-xs text-gray-500 mt-1">
                Optional (if registered with DRC)
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="phone" className="mb-2">
                Phone Number
              </Label>
              <Input
                id="phone"
                name="phone"
                placeholder="+975-2-XXXXXX"
                defaultValue={customer?.phone || ''}
              />
            </div>
            <div>
              <Label htmlFor="mobile" className="mb-2">
                Mobile Number (for SMS/WhatsApp)
              </Label>
              <Input
                id="mobile"
                name="mobile"
                placeholder="+975-17XXXXXX"
                defaultValue={customer?.mobile || ''}
              />
            </div>
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
              placeholder="Building name, street, area..."
              defaultValue={customer?.address || ''}
              rows={2}
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
                defaultValue={customer?.city || ''}
              />
            </div>
            <div>
              <Label htmlFor="dzongkhag" className="mb-2">
                Dzongkhag (District)
              </Label>
              <Input
                id="dzongkhag"
                name="dzongkhag"
                placeholder="Thimphu"
                defaultValue={customer?.dzongkhag || ''}
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
                defaultValue={customer?.postalCode || ''}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Additional Notes */}
      <Card>
        <CardHeader>
          <CardTitle>Additional Notes</CardTitle>
        </CardHeader>
        <CardContent>
          <div>
            <Label htmlFor="notes" className="mb-2">
              Internal Notes
            </Label>
            <Textarea
              id="notes"
              name="notes"
              placeholder="Any special requirements, payment terms, or notes about this customer..."
              defaultValue={customer?.notes || ''}
              rows={4}
            />
            <p className="text-xs text-gray-500 mt-1">
              These notes are internal and won't be visible to the customer
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Hidden field for isActive */}
      <input type="hidden" name="isActive" value="true" />
    </div>
  );
}
