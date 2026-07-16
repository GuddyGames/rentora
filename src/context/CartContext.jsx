import { createContext, useContext, useEffect, useState } from 'react'

const CartContext = createContext(null)
const STORAGE_KEY = 'rentora_cart'

export function useCart() {
  return useContext(CartContext)
}

function daysBetween(start, end) {
  const ms = new Date(end) - new Date(start)
  return Math.max(1, Math.round(ms / (1000 * 60 * 60 * 24)) + 1)
}

export function CartProvider({ children }) {
  const [items, setItems] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEY)) || []
    } catch {
      return []
    }
  })

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items))
  }, [items])

  function addToCart(listing, startDate, endDate) {
    const days = daysBetween(startDate, endDate)
    const item = {
      listingId: listing.id,
      title: listing.title,
      category: listing.category,
      imageBase64: listing.imageBase64,
      ownerId: listing.ownerId,
      ownerName: listing.ownerName,
      location: listing.location,
      pricePerDay: listing.pricePerDay,
      deliveryCost: listing.deliveryCost || 0,
      securityDeposit: listing.securityDeposit || 0,
      maxQty: listing.quantity || 1,
      qty: 1,
      startDate,
      endDate,
      days,
    }
    setItems((prev) => [...prev.filter((i) => i.listingId !== listing.id), item])
  }

  function setQty(listingId, qty) {
    setItems((prev) =>
      prev.map((i) => (i.listingId === listingId ? { ...i, qty: Math.max(1, Math.min(qty, i.maxQty || 1)) } : i))
    )
  }

  function removeFromCart(listingId) {
    setItems((prev) => prev.filter((i) => i.listingId !== listingId))
  }

  function clearCart() {
    setItems([])
  }

  const subtotal = items.reduce((sum, i) => sum + i.pricePerDay * i.days * (i.qty || 1), 0)
  const deliveryTotal = items.reduce((sum, i) => sum + (i.deliveryCost || 0), 0)
  const depositTotal = items.reduce((sum, i) => sum + (i.securityDeposit || 0) * (i.qty || 1), 0)
  const total = subtotal + deliveryTotal + depositTotal

  const value = { items, addToCart, removeFromCart, setQty, clearCart, subtotal, deliveryTotal, depositTotal, total }

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>
}
