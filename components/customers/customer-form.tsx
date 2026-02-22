'use client';

import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Customer } from '@/lib/db/schema';
import { Building2, User, Landmark } from 'lucide-react';
import { cn } from '@/lib/utils';

interface CustomerFormProps {
  customer?: Customer | null;
}

const customerTypes = [
  { value: 'individual', label: 'Individual', icon: User, description: 'Person with CID' },
  { value: 'business', label: 'Business', icon: Building2, description: 'Company or firm' },
  { value: 'government', label: 'Government', icon: Landmark, description: 'Government agency' },
] as const;

type CustomerType = (typeof customerTypes)[number]['value'];

export function CustomerForm({ customer }: CustomerFormProps) {
  const [customerType, setCustomerType] = useState<CustomerType>(
    (customer?.customerType as CustomerType) || 'business'
  );

  return (
    <div className="space-y-6">
      {/* Customer Type */}
      <Card>
        <CardHeader>
          <CardTitle>Customer Type</CardTitle>
        </CardHeader>
        <CardContent>
          <input type="hidden" name="customerType" value={customerType} />
          <div className="grid grid-cols-3 gap-3">
            {customerTypes.map((type) => {
              const Icon = type.icon;
              const isSelected = customerType === type.value;
              return (
                <button
                  key={type.value}
                  type="button"
                  onClick={() => setCustomerType(type.value)}
                  className={cn(
                    'flex flex-col items-center gap-2 p-4 rounded-lg border-2 transition-colors',
                    isSelected
                      ? 'border-orange-500 bg-orange-50 text-orange-700'
                      : 'border-gray-200 hover:border-gray-300 text-gray-600'
                  )}
                >
                  <Icon className="h-6 w-6" />
                  <span className="font-medium text-sm">{type.label}</span>
                  <span className="text-xs text-gray-500">{type.description}</span>
                </button>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Basic Information */}
      <Card>
        <CardHeader>
          <CardTitle>Basic Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="name" className="mb-2">
              {customerType === 'individual' ? 'Full Name' : customerType === 'government' ? 'Agency / Organization Name' : 'Business Name'}{' '}
              <span className="text-red-500">*</span>
            </Label>
            <Input
              id="name"
              name="name"
              placeholder={
                customerType === 'individual'
                  ? 'Dorji Wangchuk'
                  : customerType === 'government'
                  ? 'Department of Revenue & Customs'
                  : 'ABC Company Ltd.'
              }
              defaultValue={customer?.name || ''}
              required
            />
          </div>

          {customerType === 'government' && (
            <div>
              <Label htmlFor="department" className="mb-2">
                Department / Division
              </Label>
              <Input
                id="department"
                name="department"
                placeholder="e.g., IT Division, Finance Section"
                defaultValue={customer?.department || ''}
              />
            </div>
          )}

          <div>
            <Label htmlFor="contactPerson" className="mb-2">
              {customerType === 'individual' ? 'Alternate Contact' : 'Contact Person'}
            </Label>
            <Input
              id="contactPerson"
              name="contactPerson"
              placeholder={customerType === 'government' ? 'Focal person name' : 'Contact name'}
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
                placeholder={customerType === 'government' ? 'department@gov.bt' : 'customer@example.bt'}
                defaultValue={customer?.email || ''}
              />
            </div>
            <div>
              {customerType === 'individual' ? (
                <>
                  <Label htmlFor="cidNumber" className="mb-2">
                    CID Number
                  </Label>
                  <Input
                    id="cidNumber"
                    name="cidNumber"
                    placeholder="e.g., 11205001234"
                    maxLength={20}
                    defaultValue={customer?.cidNumber || ''}
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Citizen Identity Card number
                  </p>
                </>
              ) : (
                <>
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
                    {customerType === 'government'
                      ? 'Government agency TPN'
                      : 'Optional (if registered with DRC)'}
                  </p>
                </>
              )}
            </div>
          </div>

          {/* Show TPN for individuals too, just less prominent */}
          {customerType === 'individual' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="tpn" className="mb-2">
                  TPN (Tax Payer Number)
                </Label>
                <Input
                  id="tpn"
                  name="tpn"
                  placeholder="If registered"
                  maxLength={20}
                  defaultValue={customer?.tpn || ''}
                />
                <p className="text-xs text-gray-500 mt-1">
                  Optional — only if registered with DRC
                </p>
              </div>
            </div>
          )}

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
                Mobile Number
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
              placeholder={customerType === 'government' ? 'Office address...' : 'Building name, street, area...'}
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
                Dzongkhag
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
              placeholder={
                customerType === 'government'
                  ? 'Payment terms, PO requirements, billing contact...'
                  : 'Any special requirements, payment terms, or notes...'
              }
              defaultValue={customer?.notes || ''}
              rows={4}
            />
            <p className="text-xs text-gray-500 mt-1">
              These notes are internal and won&apos;t be visible to the customer
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Hidden field for isActive */}
      <input type="hidden" name="isActive" value="true" />
    </div>
  );
}
