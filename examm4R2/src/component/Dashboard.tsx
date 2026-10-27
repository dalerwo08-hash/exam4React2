import { useState } from 'react'
import OrdersPage from './OrdersPage'
import ProductsPage from './ProductsPage'
import OtherPage from './OtherPage'
import './Dashboard.css'

type DashboardProps = {
  email: string
  onLogout: () => void
}

const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
const revenue = [10, 5, 15, 10, 25, 35, 30, 35, 50, 45, 25, 25]
const orders = [215, 168, 392, 301, 864, 723, 912, 1083, 1260, 1054, 741, 859]

const transactions = [
  { name: 'Jagarnath S.', date: '24.05.2023', amount: '$124.97', status: 'Paid' },
  { name: 'Anand G.', date: '23.05.2023', amount: '$55.42', status: 'Pending' },
  { name: 'Kartik S.', date: '23.05.2023', amount: '$89.90', status: 'Paid' },
  { name: 'Rakesh S.', date: '22.05.2023', amount: '$144.94', status: 'Pending' },
  { name: 'Anup S.', date: '22.05.2023', amount: '$70.52', status: 'Paid' },
  { name: 'Jimmy P.', date: '22.05.2023', amount: '$70.52', status: 'Paid' },
]

const products = [
  { name: 'Men Grey Hoodie', price: '$49.90', units: 204, emoji: '🧥', color: 'grey' },
  { name: 'Woman Striped T-Shirt', price: '$34.90', units: 155, emoji: '👕', color: 'stripe' },
  { name: 'Women White T-Shirt', price: '$40.90', units: 120, emoji: '👚', color: 'white' },
  { name: 'Men White T-Shirt', price: '$49.90', units: 204, emoji: '👕', color: 'cream' },
  { name: 'Women Red T-Shirt', price: '$34.90', units: 155, emoji: '👚', color: 'red' },
]

const bestSellers = [
  { name: 'Healthcare Erbology', category: 'in Accessories', sales: '13,153', emoji: '🧴' },
  { name: 'Healthcare Erbology', category: 'in Accessories', sales: '13,153', emoji: '🧴' },
  { name: 'Healthcare Erbology', category: 'in Accessories', sales: '13,153', emoji: '🧴' },
  { name: 'Healthcare Erbology', category: 'in Accessories', sales: '13,153', emoji: '🧴' },
  { name: 'Healthcare Erbology', category: 'in Accessories', sales: '13,153', emoji: '🧴' },
]

function formatUserName(email: string) {
  const name = email.split('@')[0]?.replace(/[._-]+/g, ' ').trim()
  return name
    ? name.replace(/\b\w/g, (letter) => letter.toUpperCase())
    : 'Admin'
}

function Dashboard({ email, onLogout }: DashboardProps) {
  const [selectedMonth, setSelectedMonth] = useState(4)
  const [hoveredMonth, setHoveredMonth] = useState<number | null>(4)
  const [search, setSearch] = useState('')
  const [notificationsOpen, setNotificationsOpen] = useState(false)
  const [profileOpen, setProfileOpen] = useState(false)
  const [activeSection, setActiveSection] = useState('dashboard')
  const [notice, setNotice] = useState('')

  const userName = formatUserName(email)
  const query = search.trim().toLowerCase()
  const visibleTransactions = transactions.filter((item) =>
    `${item.name} ${item.date} ${item.amount} ${item.status}`.toLowerCase().includes(query),
  )
  const visibleProducts = products.filter((item) =>
    `${item.name} ${item.price}`.toLowerCase().includes(query),
  )
  const revenueValue = 152 + Math.round((revenue[selectedMonth] - 25) * 1.3)
  const costValue = 99.7 + Math.round((revenue[selectedMonth] - 25) * 0.8)
  const profitValue = revenueValue - Math.round(costValue)
  const tooltipMonth = hoveredMonth === null ? selectedMonth : hoveredMonth
  const tooltipX = ((44 + tooltipMonth * 40) / 520) * 100
  const tooltipY = ((188 - revenue[tooltipMonth] * 2.8) / 230) * 100

  function goToSection(section: string, id: string) {
    setActiveSection(section)
    if (section !== 'products') {
      document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'center' })
    }
  }

  return (
    <main className="dashboard-shell">
      <header className="dashboard-topbar">
        <a className="dashboard-logo" href="#dashboard" onClick={() => goToSection('dashboard', 'dashboard')}>
          <svg viewBox="0 0 34 27" fill="none" aria-hidden="true">
            <path d="M2 3h6l7 17h16" stroke="#ffb900" strokeWidth="2" strokeLinecap="round" />
            <path d="M13 6h16l3 10H16L13 6Z" fill="#ffb900" />
            <path d="M19 9h6m-7 4h9" stroke="#202a3d" strokeWidth="1.5" strokeLinecap="round" />
            <circle cx="20" cy="24" r="2" stroke="#ffb900" strokeWidth="1.5" />
            <circle cx="29" cy="24" r="2" stroke="#ffb900" strokeWidth="1.5" />
          </svg>
          <span>fastcart</span>
        </a>

        <label className="dashboard-search">
          <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <circle cx="10.8" cy="10.8" r="6.3" stroke="currentColor" strokeWidth="1.8" />
            <path d="m15.5 15.5 4 4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
          </svg>
          <input
            type="search"
            placeholder="Search..."
            aria-label="Search dashboard"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
        </label>

        <div className="dashboard-actions">
          <div className="header-menu-wrap">
            <button
              className="header-icon-button"
              type="button"
              aria-label="Notifications"
              aria-expanded={notificationsOpen}
              onClick={() => {
                setNotificationsOpen((open) => !open)
                setProfileOpen(false)
              }}
            >
              <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <path d="M18 9a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9Zm-8 12h4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              <span className="notification-count">5</span>
            </button>
            {notificationsOpen && (
              <div className="header-popover">
                <strong>Notifications</strong>
                <p>You have 5 new order updates.</p>
                <button type="button" onClick={() => setNotificationsOpen(false)}>Got it</button>
              </div>
            )}
          </div>
          <div className="header-menu-wrap">
            <button
              className="profile-button"
              type="button"
              aria-expanded={profileOpen}
              onClick={() => {
                setProfileOpen((open) => !open)
                setNotificationsOpen(false)
              }}
            >
              <span className="profile-avatar">{userName.charAt(0)}</span>
              <span className="profile-name">{userName}</span>
              <span className="profile-chevron">⌄</span>
            </button>
            {profileOpen && (
              <div className="header-popover profile-popover">
                <strong>{email}</strong>
                <button type="button" onClick={onLogout}>Log out</button>
              </div>
            )}
          </div>
        </div>
      </header>

      <aside className="dashboard-sidebar" aria-label="Main navigation">
        <nav>
          <button
            className={`sidebar-link ${activeSection === 'dashboard' ? 'active' : ''}`}
            type="button"
            onClick={() => goToSection('dashboard', 'dashboard')}
          >
            <span aria-hidden="true">⌂</span> Dashboard
          </button>
          <button
            className={`sidebar-link ${activeSection === 'orders' ? 'active' : ''}`}
            type="button"
            onClick={() => setActiveSection('orders')}
          >
            <span aria-hidden="true">☷</span> Orders <b>16</b>
          </button>
          <button
            className={`sidebar-link ${activeSection === 'products' ? 'active' : ''}`}
            type="button"
            onClick={() => setActiveSection('products')}
          >
            <span aria-hidden="true">◇</span> Products
          </button>
          <button
            className={`sidebar-link ${activeSection === 'other' ? 'active' : ''}`}
            type="button"
            onClick={() => setActiveSection('other')}
          >
            <span aria-hidden="true">▱</span> Other
          </button>
        </nav>
        <div className="sidebar-footer">Fastcart Admin</div>
      </aside>

      {activeSection === 'orders' ? (
        <OrdersPage search={search} />
      ) : activeSection === 'products' ? (
        <ProductsPage search={search} />
      ) : activeSection === 'other' ? (
        <OtherPage search={search} />
      ) : <section className="dashboard-content" id="dashboard">
        <div className="dashboard-heading">
          <div>
            <p className="dashboard-eyebrow">OVERVIEW</p>
            <h1>Dashboard</h1>
          </div>
          {search && <span className="search-hint">Showing matches for “{search}”</span>}
        </div>

        <div className="dashboard-overview">
          <div className="overview-primary">
            <div className="metric-grid">
              <article className="metric-card sales-metric">
                <span className="metric-icon">▥</span>
                <span className="metric-label">Sales</span>
                <strong>${revenueValue}k</strong>
                <span className="metric-change">↑ 12.8%</span>
              </article>
              <article className="metric-card cost-metric">
                <span className="metric-icon">◉</span>
                <span className="metric-label">Cost</span>
                <strong>${costValue.toFixed(1)}k</strong>
                <span className="metric-change">↓ 3.2%</span>
              </article>
              <article className="metric-card profit-metric">
                <span className="metric-icon">✓</span>
                <span className="metric-label">Profit</span>
                <strong>${profitValue.toFixed(1)}k</strong>
                <span className="metric-change">↑ 8.4%</span>
              </article>
            </div>

            <article className="dashboard-card revenue-card">
              <div className="card-heading">
                <div>
                  <h2>Sales Revenue</h2>
                  <p>Monthly orders throughout the year</p>
                </div>
                <span className="chart-legend"><i /> Orders</span>
              </div>
              <div className="chart-wrap">
                {hoveredMonth !== null && (
                  <div
                    className="chart-tooltip"
                    style={{ left: `${tooltipX}%`, top: `${tooltipY}%` }}
                  >
                    <strong>{orders[tooltipMonth].toLocaleString()} Orders</strong>
                    <span>{months[tooltipMonth]}</span>
                  </div>
                )}
                <svg
                  className="revenue-chart"
                  viewBox="0 0 520 230"
                  role="img"
                  aria-label="Interactive monthly orders chart"
                  preserveAspectRatio="none"
                >
                  {[0, 10, 20, 30, 40, 50].map((tick) => {
                    const y = 188 - tick * 2.8
                    return (
                      <g key={tick}>
                        <text x="27" y={y + 4} textAnchor="end" className="chart-axis-label">{tick}</text>
                        <line x1="40" y1={y} x2="510" y2={y} className="chart-grid-line" />
                      </g>
                    )
                  })}
                  <polyline
                    className="chart-line"
                    points={revenue.map((value, index) => `${44 + index * 40},${188 - value * 2.8}`).join(' ')}
                  />
                  {months.map((month, index) => {
                    const x = 44 + index * 40
                    const y = 188 - revenue[index] * 2.8
                    return (
                      <g
                        key={month}
                        className="chart-point"
                        role="button"
                        tabIndex={0}
                        aria-label={`${month}: ${orders[index].toLocaleString()} orders`}
                        onMouseEnter={() => setHoveredMonth(index)}
                        onMouseLeave={() => setHoveredMonth(null)}
                        onFocus={() => setHoveredMonth(index)}
                        onBlur={() => setHoveredMonth(null)}
                        onClick={() => {
                          setSelectedMonth(index)
                          setHoveredMonth(index)
                        }}
                        onKeyDown={(event) => {
                          if (event.key === 'Enter' || event.key === ' ') {
                            event.preventDefault()
                            setSelectedMonth(index)
                            setHoveredMonth(index)
                          }
                        }}
                      >
                        <circle cx={x} cy={y} r="12" className="chart-point-hitbox" />
                        <circle cx={x} cy={y} r={selectedMonth === index ? '5' : '3'} className={selectedMonth === index ? 'chart-dot selected' : 'chart-dot'} />
                        <text x={x} y="216" textAnchor="middle" className="chart-month-label">{month}</text>
                      </g>
                    )
                  })}
                </svg>
              </div>
            </article>
          </div>

          <article className="dashboard-card best-sellers-card" id="top-selling">
            <div className="card-heading">
              <div>
                <h2>Top selling products</h2>
                <p>Best performers this month</p>
              </div>
              <button className="see-all-button" type="button" onClick={() => goToSection('products', 'products')}>
                See All <span aria-hidden="true">→</span>
              </button>
            </div>
            <ul className="best-seller-list">
              {bestSellers.map((product, index) => (
                <li key={`${product.name}-${index}`}>
                  <span className="best-seller-image">{product.emoji}</span>
                  <span className="best-seller-name">
                    <strong>{product.name}</strong>
                    <small>{product.category}</small>
                  </span>
                  <span className="best-seller-sales"><strong>{product.sales}</strong><small>in sales</small></span>
                </li>
              ))}
            </ul>
          </article>
        </div>

        <div className="dashboard-lower-grid">
          <article className="dashboard-card transactions-card" id="transactions">
            <div className="card-heading">
              <div>
                <h2>Recent Transactions</h2>
                <p>Latest customer orders</p>
              </div>
              <button className="small-text-button" type="button" onClick={() => setNotice('All recent transactions are shown below.')}>View all</button>
            </div>
            <div className="table-scroll">
              <table>
                <thead>
                  <tr><th>Name</th><th>Date</th><th>Amount</th><th>Status</th></tr>
                </thead>
                <tbody>
                  {visibleTransactions.map((item) => (
                    <tr key={`${item.name}-${item.date}`}>
                      <td>{item.name}</td><td>{item.date}</td><td>{item.amount}</td>
                      <td><span className={`status-badge ${item.status.toLowerCase()}`}>{item.status}</span></td>
                    </tr>
                  ))}
                  {visibleTransactions.length === 0 && <tr><td colSpan={4} className="empty-state">No matching transactions.</td></tr>}
                </tbody>
              </table>
            </div>
            {notice && <p className="dashboard-notice" role="status">{notice}</p>}
          </article>

          <article className="dashboard-card products-card" id="products">
            <div className="card-heading">
              <div>
                <h2>Top Products by Units Sold</h2>
                <p>Best-selling items in your store</p>
              </div>
              <button className="small-text-button" type="button" onClick={() => setNotice('Product list is up to date.')}>View all</button>
            </div>
            <div className="table-scroll">
              <table>
                <thead>
                  <tr><th>Name</th><th>Price</th><th>Units</th></tr>
                </thead>
                <tbody>
                  {visibleProducts.map((item) => (
                    <tr key={item.name}>
                      <td><span className={`product-thumb ${item.color}`}>{item.emoji}</span>{item.name}</td>
                      <td>{item.price}</td><td>{item.units}</td>
                    </tr>
                  ))}
                  {visibleProducts.length === 0 && <tr><td colSpan={3} className="empty-state">No matching products.</td></tr>}
                </tbody>
              </table>
            </div>
          </article>
        </div>
      </section>}
    </main>
  )
}

export default Dashboard
