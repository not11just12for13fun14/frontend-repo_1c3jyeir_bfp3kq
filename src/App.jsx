import { useEffect, useMemo, useState } from 'react'

const API_BASE = import.meta.env.VITE_BACKEND_URL || ''

const categories = [
  'Makanan & Minuman',
  'Transportasi',
  'Belanja',
  'Tagihan',
  'Kesehatan',
  'Hiburan',
  'Pendidikan',
  'Lainnya',
]

function formatCurrency(n) {
  if (isNaN(n)) return 'Rp0'
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(n)
}

function monthYearFromISO(iso) {
  if (!iso) return ''
  const d = new Date(iso)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
}

export default function App() {
  const todayISO = new Date().toISOString().slice(0, 10)
  const [form, setForm] = useState({
    amount: '',
    category: categories[0],
    date: todayISO,
    notes: '',
    payment_method: '',
    merchant: '',
  })

  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const [filter, setFilter] = useState({
    category: '',
    month: new Date().getMonth() + 1,
    year: new Date().getFullYear(),
  })

  const [summary, setSummary] = useState({ total: 0, per_category: {} })

  const fetchExpenses = async () => {
    setLoading(true)
    setError('')
    try {
      const params = new URLSearchParams()
      if (filter.category) params.set('category', filter.category)
      const res = await fetch(`${API_BASE}/api/expenses?${params.toString()}`)
      const data = await res.json()
      setItems(data.items || [])
    } catch (e) {
      setError('Gagal memuat data')
    } finally {
      setLoading(false)
    }
  }

  const fetchSummary = async () => {
    try {
      const url = `${API_BASE}/api/summary?month=${filter.month}&year=${filter.year}`
      const res = await fetch(url)
      const data = await res.json()
      setSummary(data)
    } catch (e) {
      // ignore
    }
  }

  useEffect(() => {
    fetchExpenses()
  }, [filter.category])

  useEffect(() => {
    fetchSummary()
  }, [filter.month, filter.year])

  const monthlyItems = useMemo(() => {
    const key = `${filter.year}-${String(filter.month).padStart(2, '0')}`
    return items.filter((it) => monthYearFromISO(it.date) === key)
  }, [items, filter.month, filter.year])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    try {
      const body = {
        amount: parseFloat(String(form.amount).replace(/[^\d.]/g, '')),
        category: form.category,
        date: form.date,
        notes: form.notes || undefined,
        payment_method: form.payment_method || undefined,
        merchant: form.merchant || undefined,
      }
      const res = await fetch(`${API_BASE}/api/expenses`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      if (!res.ok) {
        const t = await res.text()
        throw new Error(t)
      }
      setForm((f) => ({ ...f, amount: '', notes: '', merchant: '' }))
      await Promise.all([fetchExpenses(), fetchSummary()])
    } catch (e) {
      setError('Gagal menambahkan pengeluaran')
    }
  }

  const totalMonth = useMemo(() => {
    return monthlyItems.reduce((acc, it) => acc + (parseFloat(it.amount) || 0), 0)
  }, [monthlyItems])

  return (
    <div className="min-h-screen bg-gradient-to-br from-sky-50 via-white to-indigo-50">
      <header className="p-6">
        <h1 className="text-2xl font-bold text-gray-800">Pelacak Pengeluaran Harian</h1>
        <p className="text-gray-500">Catat pengeluaran, lihat ringkasan bulanan, dan kelola kategori.</p>
      </header>

      <main className="max-w-5xl mx-auto p-6 grid gap-6 md:grid-cols-3">
        {/* Form */}
        <section className="md:col-span-1 bg-white rounded-xl shadow-sm p-5 border border-gray-100">
          <h2 className="font-semibold text-gray-800 mb-4">Tambah Pengeluaran</h2>
          <form onSubmit={handleSubmit} className="space-y-3">
            <div>
              <label className="text-sm text-gray-600">Nominal</label>
              <input
                type="number"
                step="0.01"
                value={form.amount}
                onChange={(e) => setForm({ ...form, amount: e.target.value })}
                required
                className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-200"
                placeholder="0"
              />
            </div>
            <div>
              <label className="text-sm text-gray-600">Kategori</label>
              <select
                value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value })}
                className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-200"
              >
                {categories.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-sm text-gray-600">Tanggal</label>
              <input
                type="date"
                value={form.date}
                onChange={(e) => setForm({ ...form, date: e.target.value })}
                className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-200"
              />
            </div>
            <div>
              <label className="text-sm text-gray-600">Metode Pembayaran</label>
              <input
                type="text"
                value={form.payment_method}
                onChange={(e) => setForm({ ...form, payment_method: e.target.value })}
                className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-200"
                placeholder="Cash / E-Wallet / Bank"
              />
            </div>
            <div>
              <label className="text-sm text-gray-600">Merchant/Tempat</label>
              <input
                type="text"
                value={form.merchant}
                onChange={(e) => setForm({ ...form, merchant: e.target.value })}
                className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-200"
                placeholder="Contoh: Warung Bu Sari"
              />
            </div>
            <div>
              <label className="text-sm text-gray-600">Catatan</label>
              <textarea
                value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
                className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-200"
                rows={2}
                placeholder="Opsional"
              />
            </div>
            {error && <p className="text-sm text-red-600">{error}</p>}
            <button
              type="submit"
              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-2.5 rounded-lg transition"
            >
              Simpan
            </button>
          </form>
        </section>

        {/* List & Filters */}
        <section className="md:col-span-2 space-y-6">
          <div className="bg-white rounded-xl shadow-sm p-5 border border-gray-100">
            <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-3">
              <div>
                <h2 className="font-semibold text-gray-800">Daftar Pengeluaran</h2>
                <p className="text-sm text-gray-500">Filter sesuai kebutuhanmu</p>
              </div>
              <div className="flex gap-2">
                <select
                  value={filter.category}
                  onChange={(e) => setFilter({ ...filter, category: e.target.value })}
                  className="rounded-lg border border-gray-200 px-3 py-2 text-sm"
                >
                  <option value="">Semua Kategori</option>
                  {categories.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
                <select
                  value={filter.month}
                  onChange={(e) => setFilter({ ...filter, month: Number(e.target.value) })}
                  className="rounded-lg border border-gray-200 px-3 py-2 text-sm"
                >
                  {Array.from({ length: 12 }).map((_, i) => (
                    <option key={i + 1} value={i + 1}>{i + 1}</option>
                  ))}
                </select>
                <input
                  type="number"
                  value={filter.year}
                  onChange={(e) => setFilter({ ...filter, year: Number(e.target.value) })}
                  className="w-24 rounded-lg border border-gray-200 px-3 py-2 text-sm"
                />
              </div>
            </div>

            <div className="mt-4 overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="text-left text-gray-500">
                    <th className="py-2">Tanggal</th>
                    <th className="py-2">Kategori</th>
                    <th className="py-2">Merchant</th>
                    <th className="py-2">Catatan</th>
                    <th className="py-2 text-right">Nominal</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr>
                      <td colSpan="5" className="py-6 text-center text-gray-500">Memuat...</td>
                    </tr>
                  ) : monthlyItems.length === 0 ? (
                    <tr>
                      <td colSpan="5" className="py-6 text-center text-gray-500">Belum ada data</td>
                    </tr>
                  ) : (
                    monthlyItems.map((it) => (
                      <tr key={it.id} className="border-t border-gray-100">
                        <td className="py-2 text-gray-700">{new Date(it.date).toLocaleDateString('id-ID')}</td>
                        <td className="py-2 text-gray-700">{it.category}</td>
                        <td className="py-2 text-gray-700">{it.merchant || '-'}</td>
                        <td className="py-2 text-gray-700">{it.notes || '-'}</td>
                        <td className="py-2 text-right font-medium text-gray-800">{formatCurrency(it.amount)}</td>
                      </tr>
                    ))
                  )}
                </tbody>
                <tfoot>
                  <tr className="border-t border-gray-200">
                    <td colSpan="4" className="py-3 text-right font-semibold text-gray-700">Total Bulan Ini</td>
                    <td className="py-3 text-right font-bold text-indigo-700">{formatCurrency(totalMonth)}</td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-5 border border-gray-100">
            <h2 className="font-semibold text-gray-800 mb-3">Ringkasan Bulanan</h2>
            <div className="flex flex-wrap gap-3">
              <div className="rounded-lg border border-gray-200 px-4 py-3">
                <div className="text-xs text-gray-500">Total</div>
                <div className="text-lg font-bold text-gray-800">{formatCurrency(summary.total)}</div>
              </div>
              {Object.entries(summary.per_category || {}).map(([cat, val]) => (
                <div key={cat} className="rounded-lg border border-gray-200 px-4 py-3">
                  <div className="text-xs text-gray-500">{cat}</div>
                  <div className="font-semibold text-gray-800">{formatCurrency(val)}</div>
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>

      <footer className="p-6 text-center text-xs text-gray-500">Terhubung ke API: {API_BASE || 'default origin'}</footer>
    </div>
  )
}
