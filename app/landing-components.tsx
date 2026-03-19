'use client';

import { useState } from 'react';
import { ChevronDown, ChevronUp, Menu, X, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

// FAQ Component
export function FAQItem({ question, answer }: { question: string; answer: string }) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="border border-gray-200 rounded-lg">
      <button
        className="w-full px-6 py-4 text-left flex items-center justify-between hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-inset"
        onClick={() => setIsOpen(!isOpen)}
      >
        <span className="font-medium text-gray-900">{question}</span>
        {isOpen ? (
          <ChevronUp className="h-5 w-5 text-gray-500" />
        ) : (
          <ChevronDown className="h-5 w-5 text-gray-500" />
        )}
      </button>
      {isOpen && (
        <div className="px-6 pb-4">
          <p className="text-gray-600 leading-relaxed">{answer}</p>
        </div>
      )}
    </div>
  );
}

// Header with mobile menu
export function SiteHeader() {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 w-full border-b bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/60">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center group">
            <div className="relative">
              <div className="absolute inset-0 bg-amber-500 rounded-lg blur-sm opacity-50 group-hover:opacity-75 transition-opacity"></div>
              <div className="relative bg-gradient-to-br from-amber-500 to-amber-800 p-2 rounded-lg shadow-lg">
                <FileText className="h-6 w-6 text-white" strokeWidth={2.5} />
              </div>
            </div>
            <div className="ml-3">
              <span className="text-xl font-bold bg-gradient-to-r from-amber-800 to-amber-500 bg-clip-text text-transparent">
                EasyGST
              </span>
              <p className="text-xs text-gray-500 -mt-1">Made in Bhutan</p>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center space-x-8">
            <Link href="#features" className="text-gray-700 hover:text-amber-800 font-medium transition-colors">Features</Link>
            <Link href="#pricing" className="text-gray-700 hover:text-amber-800 font-medium transition-colors">Pricing</Link>
            <Link href="#faq" className="text-gray-700 hover:text-amber-800 font-medium transition-colors">FAQ</Link>
          </nav>

          {/* Desktop Auth Buttons */}
          <div className="hidden lg:flex items-center space-x-4">
            <Link href="/sign-in">
              <Button variant="ghost" className="text-gray-700 hover:text-amber-800">Sign In</Button>
            </Link>
            <Link href="/sign-up">
              <Button className="bg-gradient-to-r from-amber-500 to-amber-800 hover:from-amber-800 hover:to-amber-900 shadow-lg shadow-amber-200">Get Started Free</Button>
            </Link>
          </div>

          {/* Mobile Menu Button */}
          <button className="lg:hidden p-2 hover:bg-gray-100 rounded-lg" onClick={() => setMobileOpen(true)}>
            <Menu className="h-5 w-5" />
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="fixed inset-0 bg-black/20 backdrop-blur-sm" onClick={() => setMobileOpen(false)} />
          <div className="fixed top-0 right-0 w-full max-w-sm h-full bg-white shadow-xl">
            <div className="flex items-center justify-between p-6 border-b">
              <span className="text-lg font-semibold">Menu</span>
              <button onClick={() => setMobileOpen(false)} className="p-2 hover:bg-gray-100 rounded-lg">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="p-6 space-y-6">
              <Link href="#features" className="block text-gray-700 hover:text-amber-800 font-medium" onClick={() => setMobileOpen(false)}>Features</Link>
              <Link href="#pricing" className="block text-gray-700 hover:text-amber-800 font-medium" onClick={() => setMobileOpen(false)}>Pricing</Link>
              <Link href="#faq" className="block text-gray-700 hover:text-amber-800 font-medium" onClick={() => setMobileOpen(false)}>FAQ</Link>
              <hr />
              <Link href="/sign-in" className="block">
                <Button variant="ghost" className="w-full justify-start" onClick={() => setMobileOpen(false)}>Sign In</Button>
              </Link>
              <Link href="/sign-up" className="block">
                <Button className="w-full bg-gradient-to-r from-amber-500 to-amber-800 hover:from-amber-800 hover:to-amber-900" onClick={() => setMobileOpen(false)}>Get Started Free</Button>
              </Link>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
