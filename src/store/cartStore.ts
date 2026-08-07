import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export interface CartItem {
  inventory_id: string
  part_id: string
  name: string
  name_ar?: string
  part_number: string
  brand?: string
  image?: string
  price_aed: number
  quantity: number
  vendor_id: string
  vendor_name: string
  max_stock: number
}

interface CartStore {
  items: CartItem[]
  addItem: (item: CartItem) => void
  removeItem: (inventory_id: string) => void
  updateQuantity: (inventory_id: string, qty: number) => void
  clearCart: () => void
  totalItems: () => number
  subtotal: () => number
  vatAmount: () => number
  grandTotal: () => number
}

export const useCartStore = create<CartStore>()(
  persist(
    (set, get) => ({
      items: [],

      addItem: (item) => {
        const existing = get().items.find(i => i.inventory_id === item.inventory_id)
        if (existing) {
          set(state => ({
            items: state.items.map(i =>
              i.inventory_id === item.inventory_id
                ? { ...i, quantity: Math.min(i.max_stock, i.quantity + item.quantity) }
                : i
            )
          }))
        } else {
          set(state => ({ items: [...state.items, item] }))
        }
      },

      removeItem: (inventory_id) => {
        set(state => ({ items: state.items.filter(i => i.inventory_id !== inventory_id) }))
      },

      updateQuantity: (inventory_id, qty) => {
        if (qty <= 0) {
          get().removeItem(inventory_id)
          return
        }
        set(state => ({
          items: state.items.map(i =>
            i.inventory_id === inventory_id
              ? { ...i, quantity: Math.min(i.max_stock, qty) }
              : i
          )
        }))
      },

      clearCart: () => set({ items: [] }),

      totalItems: () => get().items.reduce((sum, i) => sum + i.quantity, 0),

      subtotal: () => get().items.reduce((sum, i) => sum + i.price_aed * i.quantity, 0),

      vatAmount: () => {
        const sub = get().subtotal()
        return Math.round(sub * 0.05 * 100) / 100
      },

      grandTotal: () => {
        const sub = get().subtotal()
        const vat = get().vatAmount()
        return Math.round((sub + vat) * 100) / 100
      },
    }),
    { name: 'sgo-cart' }
  )
)
