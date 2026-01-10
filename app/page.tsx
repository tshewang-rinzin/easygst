import { Button } from '@/components/ui/button';
import {
  ArrowRight,
  FileText,
  CreditCard,
  BarChart3,
  Shield,
  Zap,
  Users,
  CheckCircle2,
  Building2,
  Receipt,
  TrendingUp,
  Clock
} from 'lucide-react';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getSession } from '@/lib/auth/session';

export default async function HomePage() {
  // Check if user is authenticated
  const session = await getSession();

  // If user is logged in, redirect to dashboard
  if (session?.user) {
    redirect('/dashboard');
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-orange-50">
      {/* Header */}
      <header className="border-b border-orange-100 bg-white/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <Link href="/" className="flex items-center group">
            <div className="relative">
              <div className="absolute inset-0 bg-orange-500 rounded-lg blur-sm opacity-50 group-hover:opacity-75 transition-opacity"></div>
              <div className="relative bg-gradient-to-br from-orange-500 to-orange-600 p-2 rounded-lg shadow-lg">
                <FileText className="h-6 w-6 text-white" strokeWidth={2.5} />
              </div>
            </div>
            <div className="ml-3">
              <span className="text-xl font-bold bg-gradient-to-r from-orange-600 to-orange-500 bg-clip-text text-transparent">
                EasyGST
              </span>
              <p className="text-xs text-gray-500 -mt-1">Made in Bhutan</p>
            </div>
          </Link>
          <div className="flex items-center space-x-4">
            <Link href="/sign-in">
              <Button variant="ghost" className="text-gray-700 hover:text-orange-600">
                Sign In
              </Button>
            </Link>
            <Link href="/sign-up">
              <Button className="bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 shadow-lg shadow-orange-200">
                Get Started Free
              </Button>
            </Link>
          </div>
        </div>
      </header>

      <main>
        {/* Hero Section */}
        <section className="py-20 px-4 sm:px-6 lg:px-8">
          <div className="max-w-7xl mx-auto">
            <div className="lg:grid lg:grid-cols-2 lg:gap-12 items-center">
              {/* Left Column - Text Content */}
              <div className="text-center lg:text-left">
                <div className="inline-flex items-center px-3 py-1 mb-6 rounded-full bg-orange-100 text-orange-700 text-sm font-medium">
                  <Zap className="h-4 w-4 mr-2" />
                  Bhutan GST Compliant
                </div>
                <h1 className="text-5xl md:text-6xl font-extrabold text-gray-900 tracking-tight">
                  Simplify Your
                  <span className="block mt-2 bg-gradient-to-r from-orange-500 to-orange-600 bg-clip-text text-transparent">
                    GST Compliance
                  </span>
                </h1>
                <p className="mt-6 text-xl text-gray-600 max-w-2xl mx-auto lg:mx-0">
                  Complete invoicing and GST management solution designed specifically for Bhutanese businesses.
                  Create invoices, track payments, and file GST returns with confidence.
                </p>
                <div className="mt-10 flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
                  <Link href="/sign-up">
                    <Button
                      size="lg"
                      className="bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-lg px-8 py-6 rounded-xl shadow-xl shadow-orange-200 hover:shadow-2xl hover:shadow-orange-300 transition-all"
                    >
                      Start Free Now
                      <ArrowRight className="ml-2 h-5 w-5" />
                    </Button>
                  </Link>
                  <Link href="#features">
                    <Button
                      size="lg"
                      variant="outline"
                      className="text-lg px-8 py-6 rounded-xl border-2 border-orange-200 hover:border-orange-300 hover:bg-orange-50"
                    >
                      Learn More
                    </Button>
                  </Link>
                </div>
                <div className="mt-8 flex items-center gap-6 justify-center lg:justify-start text-sm text-gray-600">
                  <div className="flex items-center">
                    <CheckCircle2 className="h-5 w-5 text-green-500 mr-2" />
                    100% Free to use
                  </div>
                  <div className="flex items-center">
                    <CheckCircle2 className="h-5 w-5 text-green-500 mr-2" />
                    No credit card required
                  </div>
                </div>
              </div>

              {/* Right Column - Visual */}
              <div className="mt-16 lg:mt-0">
                <div className="relative">
                  {/* Decorative background */}
                  <div className="absolute inset-0 bg-gradient-to-br from-orange-400 to-orange-600 rounded-3xl rotate-3 scale-105 opacity-10"></div>

                  {/* Main card */}
                  <div className="relative bg-white rounded-2xl shadow-2xl p-8 border border-orange-100">
                    {/* Invoice preview mockup */}
                    <div className="space-y-4">
                      <div className="flex items-center justify-between pb-4 border-b border-gray-200">
                        <div className="flex items-center space-x-3">
                          <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-orange-600 rounded-lg flex items-center justify-center">
                            <Building2 className="h-6 w-6 text-white" />
                          </div>
                          <div>
                            <div className="h-4 w-32 bg-gray-200 rounded animate-pulse"></div>
                            <div className="h-3 w-24 bg-gray-100 rounded mt-2 animate-pulse"></div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="h-4 w-24 bg-orange-100 rounded ml-auto"></div>
                          <div className="h-3 w-20 bg-gray-100 rounded mt-2 ml-auto"></div>
                        </div>
                      </div>

                      <div className="space-y-3">
                        <div className="flex justify-between items-center py-3 border-b border-gray-100">
                          <div className="flex-1">
                            <div className="h-3 w-40 bg-gray-200 rounded"></div>
                            <div className="h-2 w-24 bg-gray-100 rounded mt-2"></div>
                          </div>
                          <div className="h-4 w-20 bg-gray-200 rounded"></div>
                        </div>
                        <div className="flex justify-between items-center py-3 border-b border-gray-100">
                          <div className="flex-1">
                            <div className="h-3 w-48 bg-gray-200 rounded"></div>
                            <div className="h-2 w-32 bg-gray-100 rounded mt-2"></div>
                          </div>
                          <div className="h-4 w-20 bg-gray-200 rounded"></div>
                        </div>
                      </div>

                      <div className="pt-4 border-t-2 border-gray-200">
                        <div className="flex justify-between items-center">
                          <span className="text-sm font-medium text-gray-600">Total Amount</span>
                          <div className="text-right">
                            <div className="h-6 w-32 bg-gradient-to-r from-orange-500 to-orange-600 rounded"></div>
                            <div className="h-2 w-24 bg-green-100 rounded mt-2 ml-auto"></div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Floating badge */}
                    <div className="absolute -top-4 -right-4 bg-green-500 text-white px-4 py-2 rounded-full shadow-lg text-sm font-semibold flex items-center">
                      <CheckCircle2 className="h-4 w-4 mr-1" />
                      GST Compliant
                    </div>
                  </div>

                  {/* Floating elements */}
                  <div className="absolute -bottom-6 -left-6 bg-white p-4 rounded-xl shadow-lg border border-orange-100 animate-pulse">
                    <div className="flex items-center space-x-3">
                      <Receipt className="h-8 w-8 text-orange-500" />
                      <div>
                        <div className="text-xs text-gray-500">Auto GST</div>
                        <div className="text-sm font-semibold text-gray-900">Calculation</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Stats Section */}
        <section className="py-12 bg-white border-y border-orange-100">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
              <div className="text-center">
                <div className="text-3xl md:text-4xl font-bold text-orange-600">100%</div>
                <div className="text-sm text-gray-600 mt-2">DRC Compliant</div>
              </div>
              <div className="text-center">
                <div className="text-3xl md:text-4xl font-bold text-orange-600">24/7</div>
                <div className="text-sm text-gray-600 mt-2">Access Anywhere</div>
              </div>
              <div className="text-center">
                <div className="text-3xl md:text-4xl font-bold text-orange-600">Auto</div>
                <div className="text-sm text-gray-600 mt-2">GST Calculate</div>
              </div>
              <div className="text-center">
                <div className="text-3xl md:text-4xl font-bold text-orange-600">Fast</div>
                <div className="text-sm text-gray-600 mt-2">Filing Ready</div>
              </div>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section id="features" className="py-20 px-4 sm:px-6 lg:px-8">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-4xl font-bold text-gray-900 mb-4">
                Everything You Need for GST Compliance
              </h2>
              <p className="text-xl text-gray-600 max-w-3xl mx-auto">
                Powerful features designed specifically for Bhutanese businesses
              </p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              {/* Feature 1 */}
              <div className="bg-white p-8 rounded-2xl shadow-lg hover:shadow-xl transition-shadow border border-orange-100 group hover:border-orange-200">
                <div className="w-14 h-14 bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                  <FileText className="h-7 w-7 text-white" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-3">Smart Invoicing</h3>
                <p className="text-gray-600 leading-relaxed">
                  Create professional tax invoices and cash sales with automatic GST calculations.
                  Sequential numbering ensures DRC compliance.
                </p>
              </div>

              {/* Feature 2 */}
              <div className="bg-white p-8 rounded-2xl shadow-lg hover:shadow-xl transition-shadow border border-orange-100 group hover:border-orange-200">
                <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                  <BarChart3 className="h-7 w-7 text-white" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-3">GST Classification</h3>
                <p className="text-gray-600 leading-relaxed">
                  Automatically classify items as Standard (50%), Zero-Rated, or Exempt.
                  Track output and input GST effortlessly.
                </p>
              </div>

              {/* Feature 3 */}
              <div className="bg-white p-8 rounded-2xl shadow-lg hover:shadow-xl transition-shadow border border-orange-100 group hover:border-orange-200">
                <div className="w-14 h-14 bg-gradient-to-br from-green-500 to-green-600 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                  <CreditCard className="h-7 w-7 text-white" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-3">Payment Tracking</h3>
                <p className="text-gray-600 leading-relaxed">
                  Record customer payments, manage advances, and track outstanding invoices.
                  Support for multiple payment methods.
                </p>
              </div>

              {/* Feature 4 */}
              <div className="bg-white p-8 rounded-2xl shadow-lg hover:shadow-xl transition-shadow border border-orange-100 group hover:border-orange-200">
                <div className="w-14 h-14 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                  <TrendingUp className="h-7 w-7 text-white" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-3">GST Returns</h3>
                <p className="text-gray-600 leading-relaxed">
                  Generate comprehensive GST summary reports ready for DRC filing.
                  Track sales, purchases, and tax obligations.
                </p>
              </div>

              {/* Feature 5 */}
              <div className="bg-white p-8 rounded-2xl shadow-lg hover:shadow-xl transition-shadow border border-orange-100 group hover:border-orange-200">
                <div className="w-14 h-14 bg-gradient-to-br from-red-500 to-red-600 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                  <Shield className="h-7 w-7 text-white" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-3">Secure & Compliant</h3>
                <p className="text-gray-600 leading-relaxed">
                  Bank-level security with encrypted data storage.
                  Fully compliant with Bhutan DRC regulations and GST Act.
                </p>
              </div>

              {/* Feature 6 */}
              <div className="bg-white p-8 rounded-2xl shadow-lg hover:shadow-xl transition-shadow border border-orange-100 group hover:border-orange-200">
                <div className="w-14 h-14 bg-gradient-to-br from-yellow-500 to-yellow-600 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                  <Users className="h-7 w-7 text-white" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-3">Multi-User Access</h3>
                <p className="text-gray-600 leading-relaxed">
                  Collaborate with your team. Manage customers, suppliers, and products together.
                  Activity logs for accountability.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Benefits Section */}
        <section className="py-20 bg-gradient-to-br from-orange-500 to-orange-600 text-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="lg:grid lg:grid-cols-2 lg:gap-16 items-center">
              <div>
                <h2 className="text-4xl font-bold mb-6">
                  Why Bhutanese Businesses Choose EasyGST
                </h2>
                <div className="space-y-6">
                  <div className="flex items-start">
                    <div className="flex-shrink-0">
                      <CheckCircle2 className="h-6 w-6 text-orange-200" />
                    </div>
                    <div className="ml-4">
                      <h3 className="text-lg font-semibold mb-1">Built for Bhutan</h3>
                      <p className="text-orange-100">
                        Designed specifically for Bhutanese GST regulations, TPN numbers, and DRC compliance requirements.
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start">
                    <div className="flex-shrink-0">
                      <CheckCircle2 className="h-6 w-6 text-orange-200" />
                    </div>
                    <div className="ml-4">
                      <h3 className="text-lg font-semibold mb-1">Save Time</h3>
                      <p className="text-orange-100">
                        Reduce manual data entry and calculation errors. Generate reports in minutes, not hours.
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start">
                    <div className="flex-shrink-0">
                      <CheckCircle2 className="h-6 w-6 text-orange-200" />
                    </div>
                    <div className="ml-4">
                      <h3 className="text-lg font-semibold mb-1">Stay Compliant</h3>
                      <p className="text-orange-100">
                        Never worry about GST filing deadlines. Automatic reminders and ready-to-file reports.
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start">
                    <div className="flex-shrink-0">
                      <CheckCircle2 className="h-6 w-6 text-orange-200" />
                    </div>
                    <div className="ml-4">
                      <h3 className="text-lg font-semibold mb-1">Professional PDFs</h3>
                      <p className="text-orange-100">
                        Generate beautiful, professional invoices and receipts with your business branding and logo.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-12 lg:mt-0">
                <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-8 border border-white/20">
                  <div className="grid grid-cols-2 gap-6">
                    <div className="text-center p-6 bg-white/10 rounded-xl">
                      <Clock className="h-8 w-8 mx-auto mb-3 text-orange-200" />
                      <div className="text-3xl font-bold mb-1">5 min</div>
                      <div className="text-sm text-orange-100">Setup Time</div>
                    </div>
                    <div className="text-center p-6 bg-white/10 rounded-xl">
                      <TrendingUp className="h-8 w-8 mx-auto mb-3 text-orange-200" />
                      <div className="text-3xl font-bold mb-1">50%</div>
                      <div className="text-sm text-orange-100">Time Saved</div>
                    </div>
                    <div className="text-center p-6 bg-white/10 rounded-xl">
                      <Users className="h-8 w-8 mx-auto mb-3 text-orange-200" />
                      <div className="text-3xl font-bold mb-1">100+</div>
                      <div className="text-sm text-orange-100">Happy Users</div>
                    </div>
                    <div className="text-center p-6 bg-white/10 rounded-xl">
                      <Shield className="h-8 w-8 mx-auto mb-3 text-orange-200" />
                      <div className="text-3xl font-bold mb-1">100%</div>
                      <div className="text-sm text-orange-100">Secure</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-20 px-4 sm:px-6 lg:px-8 bg-white">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-4xl font-bold text-gray-900 mb-6">
              Ready to Simplify Your GST Compliance?
            </h2>
            <p className="text-xl text-gray-600 mb-10">
              Join Bhutanese businesses managing their GST obligations with confidence.
              Start creating invoices, tracking payments, and preparing tax returns today.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/sign-up">
                <Button
                  size="lg"
                  className="bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-lg px-10 py-6 rounded-xl shadow-xl shadow-orange-200 hover:shadow-2xl hover:shadow-orange-300 transition-all"
                >
                  Get Started - It's Free
                  <ArrowRight className="ml-3 h-6 w-6" />
                </Button>
              </Link>
            </div>
            <p className="mt-6 text-sm text-gray-500">
              100% Free to use • No credit card required
            </p>
            <p className="mt-2 text-xs text-gray-400">
              Premium features coming soon
            </p>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-400 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            <div className="md:col-span-2">
              <div className="flex items-center mb-4">
                <div className="bg-gradient-to-br from-orange-500 to-orange-600 p-2 rounded-lg">
                  <FileText className="h-5 w-5 text-white" />
                </div>
                <span className="ml-2 text-xl font-bold text-white">EasyGST</span>
              </div>
              <p className="text-sm max-w-md">
                Complete GST management solution for Bhutanese businesses.
                Simplify your invoicing, payments, and tax compliance.
              </p>
            </div>
            <div>
              <h3 className="text-white font-semibold mb-4">Product</h3>
              <ul className="space-y-2 text-sm">
                <li><Link href="#features" className="hover:text-orange-400 transition-colors">Features</Link></li>
                <li><Link href="/sign-up" className="hover:text-orange-400 transition-colors">Get Started</Link></li>
                <li><Link href="/sign-in" className="hover:text-orange-400 transition-colors">Sign In</Link></li>
              </ul>
            </div>
            <div>
              <h3 className="text-white font-semibold mb-4">Company</h3>
              <ul className="space-y-2 text-sm">
                <li><span className="hover:text-orange-400 transition-colors cursor-pointer">About</span></li>
                <li><span className="hover:text-orange-400 transition-colors cursor-pointer">Contact</span></li>
                <li><span className="hover:text-orange-400 transition-colors cursor-pointer">Support</span></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 pt-8 text-sm text-center">
            <p>&copy; 2026 EasyGST. Made with ❤️ in Bhutan. All rights reserved.</p>
            <p className="mt-2 text-xs text-gray-500">
              Currently free to use. Premium features with advanced capabilities coming soon.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
