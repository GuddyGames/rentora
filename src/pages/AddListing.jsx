import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { createListing, CATEGORIES } from '../services/listings'
import { compressImage } from '../utils/compressImage'
import { useAuth } from '../context/AuthContext'
import BackButton from '../components/BackButton'

export default function AddListing() {
  const { user, profile } = useAuth()
  const navigate = useNavigate()

  const [title, setTitle] = useState('')
  const [category, setCategory] = useState(CATEGORIES[0].name)
  const [description, setDescription] = useState('')
  const [pricePerDay, setPricePerDay] = useState('')
  const [quantity, setQuantity] = useState(1)
  const [location, setLocation] = useState('')
  const [securityDeposit, setSecurityDeposit] = useState('')
  const [deliveryCost, setDeliveryCost] = useState('')
  const [imagePreview, setImagePreview] = useState(null)
  const [imageBase64, setImageBase64] = useState(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  async function handleImageChange(e) {
    const file = e.target.files?.[0]
    if (!file) return
    const compressed = await compressImage(file)
    setImageBase64(compressed)
    setImagePreview(compressed)
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setBusy(true)
    try {
      await createListing({
        ownerId: user.uid,
        ownerName: profile?.name || user.email,
        title,
        category,
        description,
        pricePerDay,
        quantity,
        location,
        imageBase64,
        securityDeposit,
        deliveryCost,
      })
      navigate('/dashboard')
    } catch (err) {
      setError(err.message)
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="mx-auto max-w-lg px-5 py-10">
      <BackButton to="/dashboard" label="Dashboard" />
      <h1 className="font-display text-3xl font-semibold text-midnight">List equipment</h1>

      <form onSubmit={handleSubmit} className="mt-6 space-y-4">
        <input
          type="text"
          required
          placeholder="Title, e.g. White wedding canopy (10x10)"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="w-full rounded-lg border border-black/10 bg-white px-4 py-2.5 text-midnight placeholder:text-midnight/40"
        />

        <select
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className="w-full rounded-lg border border-black/10 bg-white px-4 py-2.5 text-midnight"
        >
          {CATEGORIES.map((c) => (
            <option key={c.name} value={c.name}>{c.icon} {c.name}</option>
          ))}
        </select>

        <textarea
          placeholder="Description — condition, size, what's included"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={4}
          className="w-full rounded-lg border border-black/10 bg-white px-4 py-2.5 text-midnight placeholder:text-midnight/40"
        />

        <div className="grid grid-cols-2 gap-3">
          <input
            type="number"
            required
            min="0"
            placeholder="Price per day (₦)"
            value={pricePerDay}
            onChange={(e) => setPricePerDay(e.target.value)}
            className="w-full rounded-lg border border-black/10 bg-white px-4 py-2.5 text-midnight placeholder:text-midnight/40"
          />
          <input
            type="number"
            min="1"
            placeholder="Quantity available"
            value={quantity}
            onChange={(e) => setQuantity(e.target.value)}
            className="w-full rounded-lg border border-black/10 bg-white px-4 py-2.5 text-midnight placeholder:text-midnight/40"
          />
        </div>

        <input
          type="text"
          required
          placeholder="Pickup / delivery area, e.g. Port Harcourt"
          value={location}
          onChange={(e) => setLocation(e.target.value)}
          className="w-full rounded-lg border border-black/10 bg-white px-4 py-2.5 text-midnight placeholder:text-midnight/40"
        />

        <div className="grid grid-cols-2 gap-3">
          <input
            type="number"
            min="0"
            placeholder="Refundable deposit (₦, optional)"
            value={securityDeposit}
            onChange={(e) => setSecurityDeposit(e.target.value)}
            className="w-full rounded-lg border border-black/10 bg-white px-4 py-2.5 text-midnight placeholder:text-midnight/40"
          />
          <input
            type="number"
            min="0"
            placeholder="Delivery cost (₦, optional)"
            value={deliveryCost}
            onChange={(e) => setDeliveryCost(e.target.value)}
            className="w-full rounded-lg border border-black/10 bg-white px-4 py-2.5 text-midnight placeholder:text-midnight/40"
          />
        </div>

        <label className="block text-sm text-midnight/70">
          Photo
          <input type="file" accept="image/*" onChange={handleImageChange} className="mt-1 block text-sm text-midnight/70" />
        </label>
        {imagePreview && (
          <img src={imagePreview} alt="Preview" className="h-40 w-full rounded-lg object-cover" />
        )}

        {error && <p className="text-sm text-ruby">{error}</p>}

        <button
          type="submit"
          disabled={busy}
          className="w-full rounded-full bg-gold px-5 py-2.5 font-medium text-midnightdeep transition-colors hover:brightness-110 disabled:opacity-60"
        >
          {busy ? 'Publishing…' : 'Publish listing'}
        </button>
      </form>
    </div>
  )
}
