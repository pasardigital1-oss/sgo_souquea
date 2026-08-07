import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// VAT Calculator - UAE standard 5%
export const VAT_RATE = 0.05

export function calculateVAT(priceIncludingVAT: number) {
  const priceBeforeVAT = priceIncludingVAT / (1 + VAT_RATE)
  const vatAmount = priceIncludingVAT - priceBeforeVAT
  return {
    priceBeforeVAT: Math.round(priceBeforeVAT * 100) / 100,
    vatAmount: Math.round(vatAmount * 100) / 100,
    total: priceIncludingVAT
  }
}

export function addVAT(priceBeforeVAT: number) {
  const vatAmount = priceBeforeVAT * VAT_RATE
  return {
    priceBeforeVAT,
    vatAmount: Math.round(vatAmount * 100) / 100,
    total: Math.round((priceBeforeVAT + vatAmount) * 100) / 100
  }
}

// Format currency AED
export function formatAED(amount: number): string {
  return new Intl.NumberFormat('en-AE', {
    style: 'currency',
    currency: 'AED',
    minimumFractionDigits: 2
  }).format(amount)
}

// Format date
export function formatDate(date: string | Date, locale = 'en-AE'): string {
  return new Intl.DateTimeFormat(locale, {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  }).format(new Date(date))
}

// Generate order number
export function generateOrderNumber(): string {
  const date = new Date()
  const year = date.getFullYear()
  const random = Math.floor(Math.random() * 900000) + 100000
  return `AS-UAE-${year}-${random}`
}

// Truncate text
export function truncate(text: string, length: number): string {
  if (text.length <= length) return text
  return text.slice(0, length) + '...'
}

// Get initials from name
export function getInitials(name: string): string {
  return name
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)
}
