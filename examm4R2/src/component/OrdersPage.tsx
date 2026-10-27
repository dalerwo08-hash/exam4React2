import { useMemo, useState, type FormEvent } from 'react'
import './OrdersPage.css'

type OrderStatus = 'Paid' | 'Pending' | 'Cancelled'
type Order = {
  id: string
  customer: string
  product: string
  date: string
  amount: number
  status: OrderStatus
}
type OrderForm = Omit<Order, 'id' | 'date'>
type SortOrder = 'newest' | 'oldest' | 'amount'

const storageKey = 'fastcart-orders'
const starterOrders: Order[] = [
  { id: 'order-1008', customer: 'Jagarnath S.', product: 'Men Grey Hoodie', date: '24.05.2023', amount: 124.97, status: 'Paid' },
  { id: 'order-1007', customer: 'Anand G.', product: 'Women Striped T-Shirt', date: '23.05.2023', amount: 55.42, status: 'Pending' },
  { id: 'order-1006', customer: 'Kartik S.', product: 'Women White T-Shirt', date: '23.05.2023', amount: 89.90, status: 'Paid' },
  { id: 'order-1005', customer: 'Rakesh S.', product: 'Men White T-Shirt', date: '22.05.2023', amount: 144.94, status: 'Pending' },
  { id: 'order-1004', customer: 'Anup S.', product: 'Women Red T-Shirt', date: '22.05.2023', amount: 70.52, status: 'Paid' },
  { id: 'order-1003', customer: 'Jimmy P.', product: 'Men Grey Hoodie', date: '21.05.2023', amount: 70.52, status: 'Paid' },
  { id: 'order-1002', customer: 'Maya K.', product: 'Women White T-Shirt', date: '20.05.2023', amount: 40.90, status: 'Cancelled' },
  { id: 'order-1001', customer: 'David R.', product: 'Men White T-Shirt', date: '19.05.2023', amount: 99.80, status: 'Paid' },
]

const emptyForm: OrderForm = {
  customer: '',
  product: '',
  amount: 0,
  status: 'Pending',
}

function loadOrders(): Order[] {
  try {
    const saved = localStorage.getItem(storageKey)
    if (!saved) return starterOrders
    const parsed: unknown = JSON.parse(saved)
    if (
      Array.isArray(parsed) &&
      parsed.every((order) =>
        typeof order.id === 'string' &&
        typeof order.customer === 'string' &&
        typeof order.product === 'string' &&
        typeof order.date === 'string' &&
        typeof order.amount === 'number' &&
        ['Paid', 'Pending', 'Cancelled'].includes(order.status),
      )
    ) {
      return parsed as Order[]
    }
    console.error('Saved orders have an invalid format; displaying the sample orders.')
  } catch (error) {
    console.error('Could not load saved orders.', error)
  }
  return starterOrders
}

function today() {
  return new Intl.DateTimeFormat('en-GB').format(new Date()).replaceAll('/', '.')
}

function OrdersPage({ search }: { search: string }) {
  const [orders, setOrders] = useState<Order[]>(loadOrders)
  const [query, setQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('All statuses')
  const [sortOrder, setSortOrder] = useState<SortOrder>('newest')
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [editingOrder, setEditingOrder] = useState<Order | null>(null)
  const [form, setForm] = useState<OrderForm>(emptyForm)
  const [modal, setModal] = useState<'add' | 'edit' | null>(null)
  const [deleteIds, setDeleteIds] = useState<string[]>([])
  const [notice, setNotice] = useState('')
  const [page, setPage] = useState(1)
  const pageSize = 8

  function saveOrders(nextOrders: Order[]) {
    setOrders(nextOrders)
    try {
      localStorage.setItem(storageKey, JSON.stringify(nextOrders))
      return true
    } catch (error) {
      console.error('Could not save orders to browser storage.', error)
      setNotice('Changes are active for this session, but could not be saved in this browser.')
      return false
    }
  }

  const filteredOrders = useMemo(() => {
    const combinedQuery = `${query} ${search}`.trim().toLowerCase()
    return orders
      .filter((order) => statusFilter === 'All statuses' || order.status === statusFilter)
      .filter((order) =>
        `${order.id} ${order.customer} ${order.product} ${order.date} ${order.status} ${order.amount}`
          .toLowerCase()
          .includes(combinedQuery),
      )
      .sort((first, second) => {
        if (sortOrder === 'amount') return second.amount - first.amount
        const firstDate = first.date.split('.').reverse().join('')
        const secondDate = second.date.split('.').reverse().join('')
        return sortOrder === 'newest'
          ? secondDate.localeCompare(firstDate) || second.id.localeCompare(first.id)
          : firstDate.localeCompare(secondDate) || first.id.localeCompare(second.id)
      })
  }, [orders, query, search, sortOrder, statusFilter])

  const filteredPageCount = Math.max(1, Math.ceil(filteredOrders.length / pageSize))
  const currentPage = Math.min(page, filteredPageCount)
  const visibleOrders = filteredOrders.slice((currentPage - 1) * pageSize, currentPage * pageSize)
  const allVisibleSelected = visibleOrders.length > 0 && visibleOrders.every((order) => selectedIds.includes(order.id))

  function openAddModal() {
    setEditingOrder(null)
    setForm(emptyForm)
    setModal('add')
  }

  function openEditModal(order: Order) {
    setEditingOrder(order)
    setForm({
      customer: order.customer,
      product: order.product,
      amount: order.amount,
      status: order.status,
    })
    setModal('edit')
  }

  function saveOrder(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const customer = form.customer.trim()
    const product = form.product.trim()
    if (!customer || !product || !Number.isFinite(form.amount) || form.amount <= 0) {
      setNotice('Enter a customer, product, and amount greater than zero.')
      return
    }
    if (modal === 'edit' && editingOrder) {
      const saved = saveOrders(orders.map((order) =>
        order.id === editingOrder.id ? { ...order, ...form, customer, product } : order,
      ))
      if (saved) setNotice(`Order ${editingOrder.id} updated.`)
    } else {
      const order: Order = {
        ...form,
        customer,
        product,
        id: `ORD-${Date.now().toString().slice(-7)}`,
        date: today(),
      }
      if (saveOrders([order, ...orders])) setNotice(`Order ${order.id} added.`)
    }
    setModal(null)
  }

  function confirmDelete() {
    const count = deleteIds.length
    const saved = saveOrders(orders.filter((order) => !deleteIds.includes(order.id)))
    setSelectedIds((current) => current.filter((id) => !deleteIds.includes(id)))
    if (saved) setNotice(count === 1 ? 'Order deleted.' : `${count} orders deleted.`)
    setDeleteIds([])
  }

  function toggleSelected(id: string) {
    setSelectedIds((current) =>
      current.includes(id) ? current.filter((selected) => selected !== id) : [...current, id],
    )
  }

  function toggleAllVisible() {
    setSelectedIds((current) => allVisibleSelected
      ? current.filter((id) => !visibleOrders.some((order) => order.id === id))
      : [...new Set([...current, ...visibleOrders.map((order) => order.id)])],
    )
  }

  return (
    <section className="orders-content">
      <div className="orders-heading">
        <div>
          <p className="orders-eyebrow">MANAGE YOUR STORE</p>
          <h1>Orders</h1>
        </div>
        <button className="add-order-button" type="button" onClick={openAddModal}>
          <span aria-hidden="true">＋</span> Add order
        </button>
      </div>

      <div className="orders-toolbar">
        <label className="orders-search">
          <input
            type="search"
            placeholder="Search orders..."
            aria-label="Search orders"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
          />
          <span aria-hidden="true">⌕</span>
        </label>
        <label className="orders-filter">
          <span>Filter</span>
          <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}>
            <option>All statuses</option>
            <option>Paid</option>
            <option>Pending</option>
            <option>Cancelled</option>
          </select>
        </label>
        <label className="orders-filter sort-filter">
          <span>Sort by</span>
          <select value={sortOrder} onChange={(event) => setSortOrder(event.target.value as SortOrder)}>
            <option value="newest">Newest</option>
            <option value="oldest">Oldest</option>
            <option value="amount">Highest amount</option>
          </select>
        </label>
        <div className="orders-bulk-actions">
          {selectedIds.length > 0 && (
            <>
              <span>{selectedIds.length} selected</span>
              <button
                className="icon-action delete-action"
                type="button"
                aria-label="Delete selected orders"
                title="Delete selected orders"
                onClick={() => setDeleteIds(selectedIds)}
              >⌫</button>
            </>
          )}
        </div>
      </div>

      {notice && <p className="orders-notice" role="status">{notice}</p>}

      <div className="orders-table-wrap">
        <table className="orders-table">
          <thead>
            <tr>
              <th className="orders-check-cell">
                <input
                  type="checkbox"
                  aria-label="Select all visible orders"
                  checked={allVisibleSelected}
                  onChange={toggleAllVisible}
                />
              </th>
              <th>Order</th>
              <th>Customer</th>
              <th>Product</th>
              <th>Date</th>
              <th>Amount</th>
              <th>Status</th>
              <th className="orders-action-heading">Action</th>
            </tr>
          </thead>
          <tbody>
            {visibleOrders.map((order) => (
              <tr key={order.id}>
                <td className="orders-check-cell">
                  <input
                    type="checkbox"
                    aria-label={`Select order ${order.id}`}
                    checked={selectedIds.includes(order.id)}
                    onChange={() => toggleSelected(order.id)}
                  />
                </td>
                <td className="order-id">{order.id}</td>
                <td>{order.customer}</td>
                <td>{order.product}</td>
                <td>{order.date}</td>
                <td>${order.amount.toFixed(2)}</td>
                <td><span className={`order-status ${order.status.toLowerCase()}`}>{order.status}</span></td>
                <td className="order-actions">
                  <button
                    className="icon-action edit-action"
                    type="button"
                    aria-label={`Edit order ${order.id}`}
                    title="Edit order"
                    onClick={() => openEditModal(order)}
                  >✎</button>
                  <button
                    className="icon-action delete-action"
                    type="button"
                    aria-label={`Delete order ${order.id}`}
                    title="Delete order"
                    onClick={() => setDeleteIds([order.id])}
                  >▢</button>
                </td>
              </tr>
            ))}
            {visibleOrders.length === 0 && (
              <tr><td className="orders-empty" colSpan={8}>No orders match your search or filter.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      <footer className="orders-pagination">
        <span className="orders-result-count">{filteredOrders.length} {filteredOrders.length === 1 ? 'result' : 'results'}</span>
        <div>
          <button type="button" aria-label="Previous page" disabled={currentPage <= 1} onClick={() => setPage(Math.max(1, currentPage - 1))}>←</button>
          <span>Page {currentPage} of {filteredPageCount}</span>
          <button type="button" aria-label="Next page" disabled={currentPage >= filteredPageCount} onClick={() => setPage(Math.min(filteredPageCount, currentPage + 1))}>→</button>
        </div>
      </footer>

      {modal && (
        <div className="orders-modal-backdrop" role="presentation" onMouseDown={(event) => {
          if (event.target === event.currentTarget) setModal(null)
        }}>
          <section className="orders-modal" role="dialog" aria-modal="true" aria-labelledby="order-modal-title">
            <div className="orders-modal-heading">
              <h2 id="order-modal-title">{modal === 'add' ? 'Add order' : 'Edit order'}</h2>
              <button type="button" aria-label="Close" onClick={() => setModal(null)}>×</button>
            </div>
            <form onSubmit={saveOrder}>
              <label>
                Customer name
                <input required autoFocus value={form.customer} onChange={(event) => setForm({ ...form, customer: event.target.value })} placeholder="Customer name" />
              </label>
              <label>
                Product
                <input required value={form.product} onChange={(event) => setForm({ ...form, product: event.target.value })} placeholder="Product name" />
              </label>
              <div className="orders-form-row">
                <label>
                  Amount ($)
                  <input required type="number" min="0.01" step="0.01" value={form.amount || ''} onChange={(event) => setForm({ ...form, amount: Number(event.target.value) })} placeholder="0.00" />
                </label>
                <label>
                  Status
                  <select value={form.status} onChange={(event) => setForm({ ...form, status: event.target.value as OrderStatus })}>
                    <option>Pending</option>
                    <option>Paid</option>
                    <option>Cancelled</option>
                  </select>
                </label>
              </div>
              <div className="orders-modal-actions">
                <button type="button" className="orders-cancel-button" onClick={() => setModal(null)}>Cancel</button>
                <button type="submit" className="add-order-button">{modal === 'add' ? 'Add order' : 'Save changes'}</button>
              </div>
            </form>
          </section>
        </div>
      )}

      {deleteIds.length > 0 && (
        <div className="orders-modal-backdrop" role="presentation" onMouseDown={(event) => {
          if (event.target === event.currentTarget) setDeleteIds([])
        }}>
          <section className="orders-modal delete-order-modal" role="dialog" aria-modal="true" aria-labelledby="delete-order-title">
            <div className="orders-modal-heading">
              <h2 id="delete-order-title">Delete {deleteIds.length === 1 ? 'order' : 'orders'}</h2>
              <button type="button" aria-label="Close" onClick={() => setDeleteIds([])}>×</button>
            </div>
            <p>Are you sure you want to delete {deleteIds.length === 1 ? 'this order' : `these ${deleteIds.length} orders`}? This action cannot be undone.</p>
            <div className="orders-modal-actions">
              <button type="button" className="orders-cancel-button" onClick={() => setDeleteIds([])}>Cancel</button>
              <button type="button" className="orders-confirm-delete" onClick={confirmDelete}>Delete</button>
            </div>
          </section>
        </div>
      )}
    </section>
  )
}

export default OrdersPage
