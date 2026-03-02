import { Button } from '@/components/ui/button';
import {
  ArrowRight,
  FileText,
  CreditCard,
  BarChart3,
  Shield,
  Users,
  CheckCircle2,
  Building2,
  Receipt,
  TrendingUp,
  Clock,
  Package,
  Database,
  Smartphone,
  MessageSquare,
  ShoppingCart,
  Coffee,
  Hammer,
  Pill,
  Star,
  Check,
  Mail,
  Phone,
  MapPin,
  Heart
} from 'lucide-react';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getSession } from '@/lib/auth/session';
import { FAQItem, SiteHeader } from './landing-components';
export default async function HomePage() {
  // Check if user is authenticated
  const session = await getSession();

  // If user is logged in, redirect to dashboard
  if (session?.user) {
    redirect('/dashboard');
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Sticky Header */}
      <SiteHeader />

      <main>
        {/* Hero Section */}
        <section className="pt-16 pb-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-white to-orange-50">
          <div className="max-w-7xl mx-auto">
            <div className="lg:grid lg:grid-cols-2 lg:gap-16 items-center">
              {/* Left Column - Content */}
              <div className="text-center lg:text-left">
                <h1 className="text-5xl md:text-6xl font-extrabold text-gray-900 tracking-tight leading-tight">
                  Bhutan's Complete
                  <span className="block mt-2 bg-gradient-to-r from-orange-500 to-orange-600 bg-clip-text text-transparent">
                    GST Solution
                  </span>
                </h1>
                <p className="mt-6 text-xl text-gray-600 leading-relaxed">
                  Simplify GST compliance for your Bhutanese business. Create invoices, track payments, 
                  manage inventory, and file returns—all in one platform built specifically for Bhutan's DRC requirements.
                </p>
                
                {/* CTA Buttons */}
                <div className="mt-10 flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
                  <Link href="/sign-up">
                    <Button
                      size="lg"
                      className="bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-lg px-8 py-6 rounded-xl shadow-xl shadow-orange-200 hover:shadow-2xl hover:shadow-orange-300 transition-all transform hover:scale-105"
                    >
                      Start Free Now
                      <ArrowRight className="ml-2 h-5 w-5" />
                    </Button>
                  </Link>
                  <Link href="#how-it-works">
                    <Button
                      size="lg"
                      variant="outline"
                      className="text-lg px-8 py-6 rounded-xl border-2 border-orange-200 hover:border-orange-300 hover:bg-orange-50 transition-all"
                    >
                      See How It Works
                    </Button>
                  </Link>
                </div>

                {/* Trust Badges */}
                <div className="mt-8 flex flex-wrap items-center gap-6 justify-center lg:justify-start text-sm">
                  <div className="flex items-center bg-green-50 px-3 py-2 rounded-full">
                    <CheckCircle2 className="h-4 w-4 text-green-500 mr-2" />
                    <span className="text-green-700 font-medium">No credit card</span>
                  </div>
                  <div className="flex items-center bg-blue-50 px-3 py-2 rounded-full">
                    <Shield className="h-4 w-4 text-blue-500 mr-2" />
                    <span className="text-blue-700 font-medium">DRC Compliant</span>
                  </div>
                  <div className="flex items-center bg-orange-50 px-3 py-2 rounded-full">
                    <Heart className="h-4 w-4 text-orange-500 mr-2" />
                    <span className="text-orange-700 font-medium">Made in Bhutan</span>
                  </div>
                </div>
              </div>

              {/* Right Column - Invoice Mockup */}
              <div className="mt-16 lg:mt-0">
                <div className="relative">
                  {/* Background decorative elements */}
                  <div className="absolute -top-4 -right-4 w-72 h-72 bg-orange-200 rounded-full mix-blend-multiply filter blur-xl opacity-70"></div>
                  <div className="absolute -bottom-8 -left-4 w-72 h-72 bg-orange-300 rounded-full mix-blend-multiply filter blur-xl opacity-70"></div>
                  
                  {/* Invoice Card */}
                  <div className="relative bg-white rounded-2xl shadow-2xl border border-orange-100 overflow-hidden">
                    {/* Invoice Header */}
                    <div className="bg-gradient-to-r from-orange-500 to-orange-600 px-6 py-4 text-white">
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="font-bold text-lg">DRUK ENTERPRISE</h3>
                          <p className="text-orange-100 text-sm">TPN: 100123456789</p>
                          <p className="text-orange-100 text-sm">Thimphu, Bhutan</p>
                        </div>
                        <div className="text-right">
                          <p className="text-2xl font-bold">INVOICE</p>
                          <p className="text-orange-100">#INV-2026-0042</p>
                        </div>
                      </div>
                    </div>

                    {/* Invoice Body */}
                    <div className="p-6">
                      {/* Customer Info */}
                      <div className="mb-6 p-4 bg-gray-50 rounded-lg">
                        <h4 className="font-semibold text-gray-900 mb-2">Bill To:</h4>
                        <p className="text-gray-700">Tashi General Store</p>
                        <p className="text-gray-600 text-sm">TPN: 200987654321</p>
                        <p className="text-gray-600 text-sm">Paro, Bhutan</p>
                      </div>

                      {/* Invoice Items */}
                      <div className="space-y-3 mb-6">
                        <div className="flex justify-between items-center py-3 border-b border-gray-200">
                          <div className="flex-1">
                            <p className="font-medium text-gray-900">Druk 11000 Beer (24 cans)</p>
                            <p className="text-sm text-gray-600">Qty: 2 cases @ BTN 720.00</p>
                          </div>
                          <div className="text-right">
                            <p className="font-semibold">BTN 1,440.00</p>
                          </div>
                        </div>
                        <div className="flex justify-between items-center py-3 border-b border-gray-200">
                          <div className="flex-1">
                            <p className="font-medium text-gray-900">Red Panda Premium Whisky</p>
                            <p className="text-sm text-gray-600">Qty: 1 bottle @ BTN 1,200.00</p>
                          </div>
                          <div className="text-right">
                            <p className="font-semibold">BTN 1,200.00</p>
                          </div>
                        </div>
                      </div>

                      {/* Totals */}
                      <div className="border-t-2 border-gray-200 pt-4">
                        <div className="space-y-2">
                          <div className="flex justify-between">
                            <span className="text-gray-600">Subtotal:</span>
                            <span className="font-medium">BTN 2,640.00</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">GST (50%):</span>
                            <span className="font-medium">BTN 1,320.00</span>
                          </div>
                          <div className="flex justify-between text-lg font-bold">
                            <span>Total:</span>
                            <span className="text-orange-600">BTN 3,960.00</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Compliance Badge */}
                    <div className="absolute -top-3 -right-3 bg-green-500 text-white px-4 py-2 rounded-full shadow-lg text-sm font-semibold flex items-center">
                      <CheckCircle2 className="h-4 w-4 mr-1" />
                      DRC Ready
                    </div>
                  </div>

                  {/* Floating Elements */}
                  <div className="absolute -bottom-6 -left-6 bg-white p-4 rounded-xl shadow-lg border border-orange-100">
                    <div className="flex items-center space-x-3">
                      <div className="bg-orange-100 p-2 rounded-lg">
                        <Receipt className="h-6 w-6 text-orange-600" />
                      </div>
                      <div>
                        <div className="text-xs text-gray-500 uppercase tracking-wide">Auto Calculate</div>
                        <div className="text-sm font-semibold text-gray-900">GST & Totals</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Social Proof Bar */}
        <section className="py-12 bg-white border-y border-gray-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-8">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Built for every Bhutanese business</h3>
              <p className="text-gray-600">Trusted by businesses across Bhutan</p>
            </div>
            <div className="flex flex-wrap justify-center items-center gap-8 md:gap-12">
              <div className="flex flex-col items-center text-center">
                <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center mb-2">
                  <ShoppingCart className="h-6 w-6 text-orange-600" />
                </div>
                <span className="text-sm font-medium text-gray-700">Grocery</span>
              </div>
              <div className="flex flex-col items-center text-center">
                <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center mb-2">
                  <Coffee className="h-6 w-6 text-blue-600" />
                </div>
                <span className="text-sm font-medium text-gray-700">Restaurant</span>
              </div>
              <div className="flex flex-col items-center text-center">
                <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center mb-2">
                  <Building2 className="h-6 w-6 text-green-600" />
                </div>
                <span className="text-sm font-medium text-gray-700">Retail</span>
              </div>
              <div className="flex flex-col items-center text-center">
                <div className="w-12 h-12 bg-yellow-100 rounded-xl flex items-center justify-center mb-2">
                  <Hammer className="h-6 w-6 text-yellow-600" />
                </div>
                <span className="text-sm font-medium text-gray-700">Hardware</span>
              </div>
              <div className="flex flex-col items-center text-center">
                <div className="w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center mb-2">
                  <Pill className="h-6 w-6 text-red-600" />
                </div>
                <span className="text-sm font-medium text-gray-700">Pharmacy</span>
              </div>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section id="features" className="py-20 px-4 sm:px-6 lg:px-8 bg-gray-50">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-4xl font-bold text-gray-900 mb-4">
                Everything You Need for GST Compliance
              </h2>
              <p className="text-xl text-gray-600 max-w-3xl mx-auto">
                Complete business management features designed specifically for Bhutanese businesses
              </p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
              {/* Feature 1 */}
              <div className="bg-white p-6 rounded-2xl shadow-lg hover:shadow-xl transition-all border border-gray-100 group hover:border-orange-200">
                <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <FileText className="h-6 w-6 text-white" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">GST-Compliant Invoicing</h3>
                <p className="text-gray-600 text-sm leading-relaxed">
                  Auto GST calculation with DRC format. Create tax invoices and cash sales that meet all compliance requirements.
                </p>
              </div>

              {/* Feature 2 */}
              <div className="bg-white p-6 rounded-2xl shadow-lg hover:shadow-xl transition-all border border-gray-100 group hover:border-orange-200">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <Package className="h-6 w-6 text-white" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Product & Inventory</h3>
                <p className="text-gray-600 text-sm leading-relaxed">
                  Track stock levels, manage variants and categories. Get low stock alerts and inventory reports.
                </p>
              </div>

              {/* Feature 3 */}
              <div className="bg-white p-6 rounded-2xl shadow-lg hover:shadow-xl transition-all border border-gray-100 group hover:border-orange-200">
                <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <Database className="h-6 w-6 text-white" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Master Product Catalog</h3>
                <p className="text-gray-600 text-sm leading-relaxed">
                  Pre-loaded products by business type. Quick setup for grocery, retail, restaurant, and more.
                </p>
              </div>

              {/* Feature 4 */}
              <div className="bg-white p-6 rounded-2xl shadow-lg hover:shadow-xl transition-all border border-gray-100 group hover:border-orange-200">
                <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-green-600 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <CreditCard className="h-6 w-6 text-white" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Payment Tracking</h3>
                <p className="text-gray-600 text-sm leading-relaxed">
                  Track advances, receipts, and outstanding amounts. Support for multiple payment methods.
                </p>
              </div>

              {/* Feature 5 */}
              <div className="bg-white p-6 rounded-2xl shadow-lg hover:shadow-xl transition-all border border-gray-100 group hover:border-orange-200">
                <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <Receipt className="h-6 w-6 text-white" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Purchase & Supplier Management</h3>
                <p className="text-gray-600 text-sm leading-relaxed">
                  Manage supplier bills, debit notes, and purchase orders. Track input GST for claims.
                </p>
              </div>

              {/* Feature 6 */}
              <div className="bg-white p-6 rounded-2xl shadow-lg hover:shadow-xl transition-all border border-gray-100 group hover:border-orange-200">
                <div className="w-12 h-12 bg-gradient-to-br from-red-500 to-red-600 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <BarChart3 className="h-6 w-6 text-white" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">GST Returns & Reports</h3>
                <p className="text-gray-600 text-sm leading-relaxed">
                  Filing-ready reports with output/input GST breakdown. Export data for DRC submissions.
                </p>
              </div>

              {/* Feature 7 */}
              <div className="bg-white p-6 rounded-2xl shadow-lg hover:shadow-xl transition-all border border-gray-100 group hover:border-orange-200">
                <div className="w-12 h-12 bg-gradient-to-br from-yellow-500 to-yellow-600 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <Users className="h-6 w-6 text-white" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Multi-User & Team Access</h3>
                <p className="text-gray-600 text-sm leading-relaxed">
                  Role-based access control with activity logs. Collaborate with your team securely.
                </p>
              </div>

              {/* Feature 8 */}
              <div className="bg-white p-6 rounded-2xl shadow-lg hover:shadow-xl transition-all border border-gray-100 group hover:border-orange-200">
                <div className="w-12 h-12 bg-gradient-to-br from-teal-500 to-teal-600 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <Smartphone className="h-6 w-6 text-white" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">POS Ready</h3>
                <p className="text-gray-600 text-sm leading-relaxed">
                  Sunmi POS integration with barcode scanning. Perfect for retail and restaurant operations.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* How It Works Section */}
        <section id="how-it-works" className="py-20 px-4 sm:px-6 lg:px-8 bg-white">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-4xl font-bold text-gray-900 mb-4">
                How It Works
              </h2>
              <p className="text-xl text-gray-600">
                Get started in minutes with our simple 3-step process
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-8 lg:gap-12">
              {/* Step 1 */}
              <div className="text-center group">
                <div className="relative mb-6">
                  <div className="w-20 h-20 bg-gradient-to-br from-orange-500 to-orange-600 rounded-full flex items-center justify-center mx-auto group-hover:scale-110 transition-transform">
                    <span className="text-2xl font-bold text-white">1</span>
                  </div>
                  <div className="absolute -top-2 -right-2 w-6 h-6 bg-orange-200 rounded-full"></div>
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-3">Sign up & Choose Business Type</h3>
                <p className="text-gray-600 leading-relaxed">
                  Create your account and select your business category. We'll customize the platform for your industry.
                </p>
              </div>

              {/* Step 2 */}
              <div className="text-center group">
                <div className="relative mb-6">
                  <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center mx-auto group-hover:scale-110 transition-transform">
                    <span className="text-2xl font-bold text-white">2</span>
                  </div>
                  <div className="absolute -top-2 -right-2 w-6 h-6 bg-blue-200 rounded-full"></div>
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-3">Add Products from Catalog</h3>
                <p className="text-gray-600 leading-relaxed">
                  Import from our pre-loaded product catalog or add your own. Set up pricing, GST rates, and inventory levels.
                </p>
              </div>

              {/* Step 3 */}
              <div className="text-center group">
                <div className="relative mb-6">
                  <div className="w-20 h-20 bg-gradient-to-br from-green-500 to-green-600 rounded-full flex items-center justify-center mx-auto group-hover:scale-110 transition-transform">
                    <span className="text-2xl font-bold text-white">3</span>
                  </div>
                  <div className="absolute -top-2 -right-2 w-6 h-6 bg-green-200 rounded-full"></div>
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-3">Start Invoicing & Track GST</h3>
                <p className="text-gray-600 leading-relaxed">
                  Create your first invoice in seconds. All GST calculations are automatic and DRC-compliant.
                </p>
              </div>
            </div>

            {/* Arrow connectors for desktop */}
            <div className="hidden md:flex justify-center mt-8">
              <div className="flex items-center space-x-8">
                <ArrowRight className="h-6 w-6 text-orange-400" />
                <ArrowRight className="h-6 w-6 text-blue-400" />
              </div>
            </div>
          </div>
        </section>

        {/* Pricing Section */}
        <section id="pricing" className="py-20 px-4 sm:px-6 lg:px-8 bg-gray-50">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-4xl font-bold text-gray-900 mb-4">
                Simple, Transparent Pricing
              </h2>
              <p className="text-xl text-gray-600">
                Choose the plan that's right for your business. All plans include GST compliance and DRC-ready reports.
              </p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-8">
              {/* Free Plan */}
              <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6 hover:shadow-xl transition-all">
                <div className="text-center mb-6">
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">Free</h3>
                  <div className="text-3xl font-bold text-gray-900 mb-1">
                    BTN <span className="text-4xl">0</span>
                  </div>
                  <p className="text-gray-600 text-sm">per month</p>
                </div>
                <div className="space-y-3 mb-6">
                  <div className="flex items-center">
                    <Check className="h-4 w-4 text-green-500 mr-3 flex-shrink-0" />
                    <span className="text-gray-700 text-sm">50 invoices/month</span>
                  </div>
                  <div className="flex items-center">
                    <Check className="h-4 w-4 text-green-500 mr-3 flex-shrink-0" />
                    <span className="text-gray-700 text-sm">100 products</span>
                  </div>
                  <div className="flex items-center">
                    <Check className="h-4 w-4 text-green-500 mr-3 flex-shrink-0" />
                    <span className="text-gray-700 text-sm">50 customers</span>
                  </div>
                  <div className="flex items-center">
                    <Check className="h-4 w-4 text-green-500 mr-3 flex-shrink-0" />
                    <span className="text-gray-700 text-sm">Basic reports</span>
                  </div>
                </div>
                <Link href="/sign-up" className="block">
                  <Button className="w-full" variant="outline">
                    Get Started
                  </Button>
                </Link>
              </div>

              {/* Starter Plan */}
              <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6 hover:shadow-xl transition-all">
                <div className="text-center mb-6">
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">Starter</h3>
                  <div className="text-3xl font-bold text-gray-900 mb-1">
                    BTN <span className="text-4xl">499</span>
                  </div>
                  <p className="text-gray-600 text-sm">per month</p>
                </div>
                <div className="space-y-3 mb-6">
                  <div className="flex items-center">
                    <Check className="h-4 w-4 text-green-500 mr-3 flex-shrink-0" />
                    <span className="text-gray-700 text-sm">200 invoices/month</span>
                  </div>
                  <div className="flex items-center">
                    <Check className="h-4 w-4 text-green-500 mr-3 flex-shrink-0" />
                    <span className="text-gray-700 text-sm">500 products</span>
                  </div>
                  <div className="flex items-center">
                    <Check className="h-4 w-4 text-green-500 mr-3 flex-shrink-0" />
                    <span className="text-gray-700 text-sm">Unlimited customers</span>
                  </div>
                  <div className="flex items-center">
                    <Check className="h-4 w-4 text-green-500 mr-3 flex-shrink-0" />
                    <span className="text-gray-700 text-sm">Email notifications</span>
                  </div>
                </div>
                <Link href="/sign-up" className="block">
                  <Button className="w-full" variant="outline">
                    Choose Plan
                  </Button>
                </Link>
              </div>

              {/* Pro Plan (Most Popular) */}
              <div className="bg-white rounded-2xl shadow-xl border-2 border-orange-400 p-6 hover:shadow-2xl transition-all relative">
                <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                  <span className="bg-gradient-to-r from-orange-500 to-orange-600 text-white px-4 py-2 rounded-full text-sm font-semibold">
                    Most Popular
                  </span>
                </div>
                <div className="text-center mb-6 pt-2">
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">Pro</h3>
                  <div className="text-3xl font-bold text-gray-900 mb-1">
                    BTN <span className="text-4xl text-orange-600">999</span>
                  </div>
                  <p className="text-gray-600 text-sm">per month</p>
                </div>
                <div className="space-y-3 mb-6">
                  <div className="flex items-center">
                    <Check className="h-4 w-4 text-green-500 mr-3 flex-shrink-0" />
                    <span className="text-gray-700 text-sm">Unlimited invoices</span>
                  </div>
                  <div className="flex items-center">
                    <Check className="h-4 w-4 text-green-500 mr-3 flex-shrink-0" />
                    <span className="text-gray-700 text-sm">Unlimited products</span>
                  </div>
                  <div className="flex items-center">
                    <Check className="h-4 w-4 text-green-500 mr-3 flex-shrink-0" />
                    <span className="text-gray-700 text-sm">Unlimited customers</span>
                  </div>
                  <div className="flex items-center">
                    <Check className="h-4 w-4 text-green-500 mr-3 flex-shrink-0" />
                    <span className="text-gray-700 text-sm">SMS/WhatsApp alerts</span>
                  </div>
                  <div className="flex items-center">
                    <Check className="h-4 w-4 text-green-500 mr-3 flex-shrink-0" />
                    <span className="text-gray-700 text-sm">POS integration</span>
                  </div>
                  <div className="flex items-center">
                    <Check className="h-4 w-4 text-green-500 mr-3 flex-shrink-0" />
                    <span className="text-gray-700 text-sm">Multi-user access</span>
                  </div>
                </div>
                <Link href="/sign-up" className="block">
                  <Button className="w-full bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700">
                    Choose Plan
                  </Button>
                </Link>
              </div>

              {/* Enterprise Plan */}
              <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6 hover:shadow-xl transition-all">
                <div className="text-center mb-6">
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">Enterprise</h3>
                  <div className="text-3xl font-bold text-gray-900 mb-1">
                    <span className="text-2xl">Custom</span>
                  </div>
                  <p className="text-gray-600 text-sm">contact sales</p>
                </div>
                <div className="space-y-3 mb-6">
                  <div className="flex items-center">
                    <Check className="h-4 w-4 text-green-500 mr-3 flex-shrink-0" />
                    <span className="text-gray-700 text-sm">Everything in Pro</span>
                  </div>
                  <div className="flex items-center">
                    <Check className="h-4 w-4 text-green-500 mr-3 flex-shrink-0" />
                    <span className="text-gray-700 text-sm">Priority support</span>
                  </div>
                  <div className="flex items-center">
                    <Check className="h-4 w-4 text-green-500 mr-3 flex-shrink-0" />
                    <span className="text-gray-700 text-sm">Custom integrations</span>
                  </div>
                  <div className="flex items-center">
                    <Check className="h-4 w-4 text-green-500 mr-3 flex-shrink-0" />
                    <span className="text-gray-700 text-sm">Dedicated account manager</span>
                  </div>
                </div>
                <Button className="w-full" variant="outline">
                  Contact Sales
                </Button>
              </div>
            </div>

            {/* Plan Features Footer */}
            <div className="mt-12 text-center">
              <p className="text-gray-600 font-medium mb-4">All plans include:</p>
              <div className="flex flex-wrap justify-center gap-6 text-sm text-gray-600">
                <div className="flex items-center">
                  <Shield className="h-4 w-4 text-green-500 mr-2" />
                  GST compliance
                </div>
                <div className="flex items-center">
                  <FileText className="h-4 w-4 text-green-500 mr-2" />
                  DRC-ready reports
                </div>
                <div className="flex items-center">
                  <CheckCircle2 className="h-4 w-4 text-green-500 mr-2" />
                  Secure cloud storage
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* FAQ Section */}
        <section id="faq" className="py-20 px-4 sm:px-6 lg:px-8 bg-white">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-4xl font-bold text-gray-900 mb-4">
                Frequently Asked Questions
              </h2>
              <p className="text-xl text-gray-600">
                Everything you need to know about EasyGST
              </p>
            </div>

            <div className="space-y-4">
              <FAQItem
                question="What is EasyGST?"
                answer="EasyGST is a comprehensive GST management platform designed specifically for Bhutanese businesses. It helps you create invoices, track payments, manage inventory, and file GST returns in compliance with Bhutan's DRC regulations."
              />
              <FAQItem
                question="Is it compliant with Bhutan DRC?"
                answer="Yes, EasyGST is fully compliant with Bhutan's Department of Revenue and Customs (DRC) regulations and the GST Act. All invoices and reports are generated in the required format for seamless filing."
              />
              <FAQItem
                question="Can I use it for my grocery/retail/restaurant?"
                answer="Absolutely! EasyGST is built to work with all types of Bhutanese businesses including grocery stores, retail shops, restaurants, hardware stores, pharmacies, and more. We have pre-loaded product catalogs for different industries."
              />
              <FAQItem
                question="Is my data secure?"
                answer="Yes, we use bank-level security with encrypted data storage and secure cloud infrastructure. Your business data is protected with industry-standard security measures and is never shared with third parties."
              />
              <FAQItem
                question="Can I import my existing products?"
                answer="Yes, you can either import your existing products using our bulk upload feature or quickly add them from our pre-loaded master catalog that includes thousands of products commonly used by Bhutanese businesses."
              />
              <FAQItem
                question="Do you support POS devices?"
                answer="Yes, EasyGST integrates with Sunmi POS devices and supports barcode scanning. This makes it perfect for retail and restaurant operations where you need quick checkout and inventory management."
              />
              <FAQItem
                question="What payment methods do you accept?"
                answer="For subscription payments, we accept all major payment methods including mobile wallets, bank transfers, and online banking. The platform itself supports tracking of any payment method your customers use."
              />
              <FAQItem
                question="Can I try it for free?"
                answer="Yes, you can start with our Free plan which includes 50 invoices per month, 100 products, and basic features. No credit card required to get started. You can upgrade anytime as your business grows."
              />
            </div>
          </div>
        </section>

        {/* Final CTA Section */}
        <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-r from-orange-500 to-orange-600 text-white">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-4xl font-bold mb-6">
              Ready to Simplify Your GST?
            </h2>
            <p className="text-xl text-orange-100 mb-10 leading-relaxed">
              Join hundreds of Bhutanese businesses who trust EasyGST for their GST compliance.
              Start creating professional invoices, tracking payments, and filing returns with confidence.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/sign-up">
                <Button
                  size="lg"
                  className="bg-white text-orange-600 hover:bg-orange-50 text-lg px-10 py-6 rounded-xl shadow-xl hover:shadow-2xl transition-all transform hover:scale-105"
                >
                  Start Your Free Trial
                  <ArrowRight className="ml-3 h-6 w-6" />
                </Button>
              </Link>
              <Link href="#features">
                <Button
                  size="lg"
                  variant="outline"
                  className="text-lg px-10 py-6 rounded-xl border-2 border-white/30 text-white hover:bg-white/10 transition-all"
                >
                  Learn More
                </Button>
              </Link>
            </div>
            <div className="mt-8 flex flex-wrap justify-center gap-6 text-sm text-orange-100">
              <div className="flex items-center">
                <CheckCircle2 className="h-4 w-4 mr-2" />
                Free forever plan available
              </div>
              <div className="flex items-center">
                <CheckCircle2 className="h-4 w-4 mr-2" />
                No setup fees
              </div>
              <div className="flex items-center">
                <CheckCircle2 className="h-4 w-4 mr-2" />
                Cancel anytime
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-400 py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-5 gap-8 mb-12">
            {/* Company Info */}
            <div className="lg:col-span-2">
              <div className="flex items-center mb-6">
                <div className="bg-gradient-to-br from-orange-500 to-orange-600 p-2 rounded-lg">
                  <FileText className="h-6 w-6 text-white" />
                </div>
                <span className="ml-3 text-2xl font-bold text-white">EasyGST</span>
              </div>
              <p className="text-gray-400 leading-relaxed max-w-md mb-6">
                Complete GST management solution for Bhutanese businesses. 
                Simplify your invoicing, payments, inventory, and tax compliance with our DRC-compliant platform.
              </p>
              <div className="flex items-center text-sm text-gray-500 mb-2">
                <MapPin className="h-4 w-4 mr-2" />
                Thimphu, Bhutan
              </div>
              <div className="flex items-center text-sm text-gray-500 mb-2">
                <Mail className="h-4 w-4 mr-2" />
                support@easygst.bt
              </div>
              <div className="flex items-center text-sm text-gray-500">
                <Phone className="h-4 w-4 mr-2" />
                +975 17-123-456
              </div>
            </div>

            {/* Product Links */}
            <div>
              <h3 className="text-white font-semibold mb-6">Product</h3>
              <ul className="space-y-3 text-sm">
                <li><Link href="#features" className="hover:text-orange-400 transition-colors">Features</Link></li>
                <li><Link href="#pricing" className="hover:text-orange-400 transition-colors">Pricing</Link></li>
                <li><Link href="#how-it-works" className="hover:text-orange-400 transition-colors">How It Works</Link></li>
                <li><span className="hover:text-orange-400 transition-colors cursor-pointer">Integrations</span></li>
                <li><span className="hover:text-orange-400 transition-colors cursor-pointer">API</span></li>
              </ul>
            </div>

            {/* Solutions */}
            <div>
              <h3 className="text-white font-semibold mb-6">Solutions</h3>
              <ul className="space-y-3 text-sm">
                <li><span className="hover:text-orange-400 transition-colors cursor-pointer">Grocery Stores</span></li>
                <li><span className="hover:text-orange-400 transition-colors cursor-pointer">Restaurants</span></li>
                <li><span className="hover:text-orange-400 transition-colors cursor-pointer">Retail Shops</span></li>
                <li><span className="hover:text-orange-400 transition-colors cursor-pointer">Hardware Stores</span></li>
                <li><span className="hover:text-orange-400 transition-colors cursor-pointer">Pharmacies</span></li>
              </ul>
            </div>

            {/* Company */}
            <div>
              <h3 className="text-white font-semibold mb-6">Company</h3>
              <ul className="space-y-3 text-sm">
                <li><span className="hover:text-orange-400 transition-colors cursor-pointer">About Us</span></li>
                <li><span className="hover:text-orange-400 transition-colors cursor-pointer">Contact</span></li>
                <li><span className="hover:text-orange-400 transition-colors cursor-pointer">Support Center</span></li>
                <li><span className="hover:text-orange-400 transition-colors cursor-pointer">Privacy Policy</span></li>
                <li><span className="hover:text-orange-400 transition-colors cursor-pointer">Terms of Service</span></li>
              </ul>
            </div>
          </div>

          {/* Footer Bottom */}
          <div className="border-t border-gray-800 pt-8">
            <div className="flex flex-col md:flex-row justify-between items-center">
              <div className="text-sm text-gray-500 mb-4 md:mb-0">
                <p>&copy; 2026 EasyGST. All rights reserved.</p>
              </div>
              <div className="flex items-center text-sm text-gray-500">
                <span>Made with</span>
                <Heart className="h-4 w-4 text-red-500 mx-2" />
                <span>in Bhutan</span>
              </div>
            </div>
            <div className="text-center mt-4">
              <p className="text-xs text-gray-600">
                EasyGST is designed to be fully compliant with Bhutan's Department of Revenue and Customs (DRC) regulations.
              </p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}