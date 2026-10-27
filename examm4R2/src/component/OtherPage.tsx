import { useMemo, useRef, useState, type ChangeEvent, type DragEvent, type FormEvent } from 'react'
import phoneCategoryImage from '../assets/category-phone.jpg'
import computerCategoryImage from '../assets/category-computer.jpg'
import watchCategoryImage from '../assets/category-watch.jpg'
import headphonesCategoryImage from '../assets/category-headphones.jpg'
import cameraCategoryImage from '../assets/category-camera.jpg'
import gamingCategoryImage from '../assets/category-gaming.jpg'
import './OtherPage.css'

type OtherTab = 'Categories' | 'Brands' | 'Banners'
type StoreItem = {
  id: string
  name: string
  image: string
  fileName: string
  link: string
}

const storageKeys: Record<OtherTab, string> = {
  Categories: 'fastcart-categories',
  Brands: 'fastcart-brands',
  Banners: 'fastcart-banners',
}

const categoryExamples = ['Phones', 'Computers', 'SmartWatch', 'HeadPhones', 'Camera', 'Gaming']
const brandExamples = ['Samsung', 'Xiaomi', 'LG', 'Nokia', 'Panasonic']
const emptyForm = { name: '', image: '', fileName: '', link: '' }
const categoryPhotos = [
  { match: 'head', image: headphonesCategoryImage },
  { match: 'phone', image: phoneCategoryImage },
  { match: 'computer', image: computerCategoryImage },
  { match: 'watch', image: watchCategoryImage },
  { match: 'camera', image: cameraCategoryImage },
  { match: 'gaming', image: gamingCategoryImage },
]

function loadItems(tab: OtherTab): StoreItem[] {
  try {
    const saved = localStorage.getItem(storageKeys[tab])
    if (saved === null) {
      if (tab === 'Categories') {
        return categoryExamples.map((name, index) => ({ ...emptyForm, id: `category-${index}`, name }))
      }
      if (tab === 'Brands') {
        return brandExamples.map((name, index) => ({ ...emptyForm, id: `brand-${index}`, name }))
      }
      return []
    }
    const parsed: unknown = JSON.parse(saved)
    if (
      Array.isArray(parsed) &&
      parsed.every((item) =>
        typeof item.id === 'string' &&
        typeof item.name === 'string' &&
        typeof item.image === 'string' &&
        typeof item.fileName === 'string' &&
        typeof item.link === 'string',
      )
    ) {
      return parsed.filter((item) => item.name.trim().length > 0)
    }
    console.error(`Saved ${tab.toLowerCase()} have an invalid format.`)
  } catch (error) {
    console.error(`Could not load ${tab.toLowerCase()}.`, error)
  }
  return []
}

function CollectionIcon({ tab, name }: { tab: OtherTab; name: string }) {
  if (tab === 'Banners') return <span className="other-banner-icon" aria-hidden="true">▰</span>
  if (tab === 'Brands') return <span className="other-brand-icon" aria-hidden="true">{name.slice(0, 1).toUpperCase()}</span>
  const normalized = name.toLowerCase()
  const icon = normalized.includes('phone') ? '▯'
    : normalized.includes('computer') ? '▣'
      : normalized.includes('watch') ? '◷'
        : normalized.includes('head') ? '♧'
          : normalized.includes('camera') ? '◎'
            : normalized.includes('gaming') ? '⌘'
              : '◇'
  return <span className="other-category-icon" aria-hidden="true">{icon}</span>
}

function TrashIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 6h18" />
      <path d="M8 6V4h8v2" />
      <path d="m19 6-1 14H6L5 6" />
      <path d="M10 11v5M14 11v5" />
    </svg>
  )
}

function getCategoryPhoto(name: string) {
  const normalized = name.toLowerCase()
  return categoryPhotos.find(({ match }) => normalized.includes(match))?.image
}

function OtherPage({ search }: { search: string }) {
  const [tab, setTab] = useState<OtherTab>('Categories')
  const [itemsByTab, setItemsByTab] = useState<Record<OtherTab, StoreItem[]>>(() => ({
    Categories: loadItems('Categories'),
    Brands: loadItems('Brands'),
    Banners: loadItems('Banners'),
  }))
  const [localSearch, setLocalSearch] = useState('')
  const [page, setPage] = useState(1)
  const [modalOpen, setModalOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [form, setForm] = useState(emptyForm)
  const [notice, setNotice] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)
  const pageSize = 12
  const items = itemsByTab[tab]

  const visibleItems = useMemo(() => {
    const query = `${localSearch} ${search}`.trim().toLowerCase()
    return items.filter((item) => `${item.name} ${item.link}`.toLowerCase().includes(query))
  }, [items, localSearch, search])

  const pageCount = Math.max(1, Math.ceil(visibleItems.length / pageSize))
  const currentPage = Math.min(page, pageCount)
  const pagedItems = visibleItems.slice((currentPage - 1) * pageSize, currentPage * pageSize)

  function persistItems(nextItems: StoreItem[]) {
    try {
      localStorage.setItem(storageKeys[tab], JSON.stringify(nextItems))
      setItemsByTab((current) => ({ ...current, [tab]: nextItems }))
      return true
    } catch (error) {
      console.error(`Could not save ${tab.toLowerCase()}.`, error)
      setNotice('Could not save. Try a smaller image or free browser storage.')
      return false
    }
  }

  function switchTab(nextTab: OtherTab) {
    setTab(nextTab)
    setPage(1)
    setLocalSearch('')
    setNotice('')
  }

  function openCreate() {
    setEditingId(null)
    setForm(emptyForm)
    setNotice('')
    setModalOpen(true)
  }

  function openEdit(item: StoreItem) {
    setEditingId(item.id)
    setForm({ name: item.name, image: item.image, fileName: item.fileName, link: item.link })
    setNotice('')
    setModalOpen(true)
  }

  function readFormImage(file: File | undefined) {
    if (!file) return
    if (!file.type.startsWith('image/')) {
      setNotice('Choose an image file.')
      return
    }
    if (file.size > 1024 * 1024) {
      setNotice('Image must be 1 MB or smaller.')
      return
    }
    const reader = new FileReader()
    reader.onerror = () => {
      console.error(`Could not read ${file.name}.`, reader.error)
      setNotice('Could not read the image. Please try again.')
    }
    reader.onload = () => {
      if (typeof reader.result !== 'string') {
        setNotice('Could not read the image. Please try again.')
        return
      }
      setForm((current) => ({ ...current, image: reader.result as string, fileName: file.name }))
      setNotice('')
    }
    reader.readAsDataURL(file)
  }

  function uploadImage(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    event.target.value = ''
    readFormImage(file)
  }

  function saveItem(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const name = form.name.trim()
    if (!name) {
      setNotice(`${singular[0].toUpperCase()}${singular.slice(1)} name is required.`)
      return
    }
    const duplicate = items.some((item) =>
      item.id !== editingId && item.name.trim().toLowerCase() === name.toLowerCase(),
    )
    if (duplicate) {
      setNotice(`A ${singular} with this name already exists.`)
      return
    }
    const nextItem: StoreItem = {
      ...form,
      name,
      link: form.link.trim(),
      id: editingId ?? `${singular}-${encodeURIComponent(name.toLowerCase())}`,
    }
    const nextItems = editingId
      ? items.map((item) => item.id === editingId ? nextItem : item)
      : [nextItem, ...items]
    if (persistItems(nextItems)) {
      setModalOpen(false)
      setNotice(editingId ? `${singular[0].toUpperCase()}${singular.slice(1)} updated.` : `${singular[0].toUpperCase()}${singular.slice(1)} added.`)
      setEditingId(null)
      setPage(1)
    }
  }

  function deleteItem() {
    if (!deleteId) return
    if (persistItems(items.filter((item) => item.id !== deleteId))) {
      setDeleteId(null)
      setNotice(`${singular[0].toUpperCase()}${singular.slice(1)} deleted.`)
    }
  }

  const singular = tab === 'Categories' ? 'category' : tab === 'Brands' ? 'brand' : 'banner'
  const title = tab === 'Categories' ? 'Add category' : tab === 'Brands' ? 'Add brand' : 'Add banner'

  return (
    <section className="other-content">
      <div className="other-page-heading">
        <div>
          <p className="other-eyebrow">STORE CONFIGURATION</p>
          <h1>Other</h1>
        </div>
        {tab === 'Categories' && (
          <button className="other-add-button" type="button" onClick={openCreate}>
            <span aria-hidden="true">＋</span> Add new
          </button>
        )}
      </div>

      <div className="other-toolbar">
        <div className="other-tabs" role="tablist" aria-label="Store settings">
          {(['Categories', 'Brands', 'Banners'] as const).map((itemTab) => (
            <button
              key={itemTab}
              type="button"
              role="tab"
              aria-selected={tab === itemTab}
              className={tab === itemTab ? 'other-tab active' : 'other-tab'}
              onClick={() => switchTab(itemTab)}
            >
              {itemTab}
            </button>
          ))}
        </div>
        {tab === 'Categories' && (
          <label className="other-search">
            <input
              type="search"
              placeholder="Search..."
              aria-label={`Search ${tab.toLowerCase()}`}
              value={localSearch}
              onChange={(event) => {
                setLocalSearch(event.target.value)
                setPage(1)
              }}
            />
            <span aria-hidden="true">⌕</span>
          </label>
        )}
      </div>

      {notice && <p className="other-notice" role="status">{notice}</p>}

      {tab === 'Brands' ? (
        <BrandsPanel
          items={items}
          search={search}
          onSave={persistItems}
          onNotice={setNotice}
        />
      ) : tab === 'Banners' ? (
        <BannersPanel
          items={items}
          categories={itemsByTab.Categories.map((item) => item.name)}
          onSave={persistItems}
          onNotice={setNotice}
        />
      ) : <>
      <div className={`other-card-grid${tab === 'Categories' ? ' category-card-grid' : ''}`}>
        {pagedItems.map((item) => (
          <article className="other-item-card" key={item.id}>
            {item.image
              ? <img className="other-item-image" src={item.image} alt={item.name} />
              : tab === 'Categories' && getCategoryPhoto(item.name)
                ? <img className="other-item-image category-photo" src={getCategoryPhoto(item.name)} alt={`${item.name} category`} />
              : <CollectionIcon tab={tab} name={item.name} />}
            <span className="other-item-name" title={item.name}>{item.name}</span>
            <div className="other-card-actions">
              <button className="other-edit-button" type="button" aria-label={`Edit ${item.name}`} onClick={() => openEdit(item)}>✎</button>
              <button className="other-delete-button" type="button" aria-label={`Delete ${item.name}`} onClick={() => setDeleteId(item.id)}><TrashIcon /></button>
            </div>
          </article>
        ))}
        {pagedItems.length === 0 && (
          <div className="other-empty-state">
            <span aria-hidden="true">◇</span>
            <strong>{localSearch || search ? `No ${tab.toLowerCase()} found` : `No ${tab.toLowerCase()} yet`}</strong>
            <p>{localSearch || search ? 'Try another search.' : `Add your first ${singular} to get started.`}</p>
            {!localSearch && !search && <button type="button" onClick={openCreate}>＋ Add {singular}</button>}
          </div>
        )}
      </div>

      <footer className="other-pagination">
        <div>
          <button type="button" aria-label="Previous page" disabled={currentPage <= 1} onClick={() => setPage((value) => Math.max(1, value - 1))}>←</button>
          <span>Page {currentPage} of {pageCount}</span>
          <button type="button" aria-label="Next page" disabled={currentPage >= pageCount} onClick={() => setPage((value) => Math.min(pageCount, value + 1))}>→</button>
        </div>
        <span>{visibleItems.length} {visibleItems.length === 1 ? 'result' : 'results'}</span>
      </footer>
      </>}

      {modalOpen && (
        <div className="other-modal-backdrop" role="presentation" onMouseDown={(event) => {
          if (event.target === event.currentTarget) setModalOpen(false)
        }}>
          <section className="other-modal" role="dialog" aria-modal="true" aria-labelledby="other-modal-title">
            <div className="other-modal-heading">
              <h2 id="other-modal-title">{editingId ? `Edit ${singular}` : title}</h2>
              <button type="button" aria-label="Close" onClick={() => setModalOpen(false)}>×</button>
            </div>
            <form onSubmit={saveItem}>
              <label className="other-field-label">
                {`${singular[0].toUpperCase()}${singular.slice(1)} name`}
                <input
                  autoFocus
                  required
                  value={form.name}
                  placeholder={`${singular[0].toUpperCase()}${singular.slice(1)} name`}
                  onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))}
                />
              </label>
              <input ref={fileInputRef} className="sr-only" type="file" accept="image/*" onChange={uploadImage} />
              {form.image ? (
                <div className="other-upload-preview">
                  <img src={form.image} alt={form.fileName || form.name} />
                  <span title={form.fileName}>{form.fileName}</span>
                  <button type="button" aria-label="Remove image" onClick={() => setForm((current) => ({ ...current, image: '', fileName: '' }))}>×</button>
                </div>
              ) : (
                <button
                  className="other-upload-area"
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  onDragOver={(event) => {
                    event.preventDefault()
                    event.currentTarget.classList.add('dragging')
                  }}
                  onDragLeave={(event) => event.currentTarget.classList.remove('dragging')}
                  onDrop={(event) => {
                    event.preventDefault()
                    event.currentTarget.classList.remove('dragging')
                    readFormImage(event.dataTransfer.files[0])
                  }}
                >
                  <span className="other-upload-icon">⇧</span>
                  <strong>Click to upload or drag and drop</strong>
                  <small>SVG, JPG, PNG, or GIF, max 1 MB</small>
                </button>
              )}
              {notice && <p className="other-modal-notice" role="alert">{notice}</p>}
              <div className="other-modal-actions">
                <button className="other-cancel-button" type="button" onClick={() => setModalOpen(false)}>Cancel</button>
                <button className="other-add-button" type="submit">{editingId ? 'Save changes' : 'Create'}</button>
              </div>
            </form>
          </section>
        </div>
      )}

      {deleteId && (
        <div className="other-modal-backdrop" role="presentation" onMouseDown={(event) => {
          if (event.target === event.currentTarget) setDeleteId(null)
        }}>
          <section className="other-modal other-delete-modal" role="dialog" aria-modal="true" aria-labelledby="other-delete-title">
            <div className="other-modal-heading">
              <h2 id="other-delete-title">Delete {singular}</h2>
              <button type="button" aria-label="Close" onClick={() => setDeleteId(null)}>×</button>
            </div>
            <p>Are you sure you want to delete this {singular}?</p>
            <div className="other-modal-actions">
              <button className="other-cancel-button" type="button" onClick={() => setDeleteId(null)}>Cancel</button>
              <button className="other-confirm-delete" type="button" onClick={deleteItem}>Delete</button>
            </div>
          </section>
        </div>
      )}
    </section>
  )
}

type CollectionPanelProps = {
  items: StoreItem[]
  search?: string
  onSave: (items: StoreItem[]) => boolean
  onNotice: (message: string) => void
}

function BrandsPanel({ items, search, onSave, onNotice }: CollectionPanelProps) {
  const [name, setName] = useState('')
  const [image, setImage] = useState('')
  const [fileName, setFileName] = useState('')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const imageInputRef = useRef<HTMLInputElement>(null)
  const query = (search ?? '').toLowerCase()
  const visibleItems = items.filter((item) => item.name.toLowerCase().includes(query))

  function resetForm() {
    setName('')
    setImage('')
    setFileName('')
    setEditingId(null)
    onNotice('')
  }

  function uploadBrandLogo(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file) return
    if (!file.type.startsWith('image/')) {
      onNotice('Choose an image file.')
      return
    }
    if (file.size > 1024 * 1024) {
      onNotice('Brand logo must be 1 MB or smaller.')
      return
    }
    const reader = new FileReader()
    reader.onerror = () => {
      console.error(`Could not read brand logo ${file.name}.`, reader.error)
      onNotice('Could not read the logo image. Please try again.')
    }
    reader.onload = () => {
      if (typeof reader.result !== 'string') {
        onNotice('Could not read the logo image. Please try again.')
        return
      }
      setImage(reader.result)
      setFileName(file.name)
      onNotice('')
    }
    reader.readAsDataURL(file)
  }

  function saveBrand(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const value = name.trim()
    if (!value) {
      onNotice('Brand name is required.')
      return
    }
    if (items.some((item) => item.id !== editingId && item.name.toLowerCase() === value.toLowerCase())) {
      onNotice('A brand with this name already exists.')
      return
    }
    const brand: StoreItem = {
      id: editingId ?? `brand-${Date.now()}`,
      name: value,
      image,
      fileName,
      link: '',
    }
    const next = editingId
      ? items.map((item) => item.id === editingId ? { ...item, name: value, image, fileName } : item)
      : [...items, brand]
    if (onSave(next)) {
      const message = editingId ? 'Brand updated.' : 'Brand created.'
      resetForm()
      onNotice(message)
    }
  }

  function deleteBrand() {
    if (!deleteId) return
    if (onSave(items.filter((item) => item.id !== deleteId))) {
      setDeleteId(null)
      if (editingId === deleteId) resetForm()
      onNotice('Brand deleted.')
    }
  }

  return (
    <>
      <div className="brand-management-layout">
        <section className="brand-list-panel">
          <div className="brand-list-heading"><span>Brands</span><span>Action</span></div>
          {visibleItems.map((brand) => (
            <div className="brand-list-row" key={brand.id}>
              <span className="brand-row-identity">
                {brand.image
                  ? <img src={brand.image} alt="" />
                  : <span className="brand-row-initial" aria-hidden="true">{brand.name.slice(0, 1).toUpperCase()}</span>}
                <span>{brand.name}</span>
              </span>
              <div>
                <button className="brand-edit-button" type="button" aria-label={`Edit ${brand.name}`} onClick={() => {
                  setName(brand.name)
                  setImage(brand.image)
                  setFileName(brand.fileName)
                  setEditingId(brand.id)
                  onNotice('')
                }}>✎</button>
                <button className="brand-delete-button" type="button" aria-label={`Delete ${brand.name}`} onClick={() => setDeleteId(brand.id)}><TrashIcon /></button>
              </div>
            </div>
          ))}
          {visibleItems.length === 0 && <p className="brand-empty">{query ? 'No brands match your search.' : 'No brands yet. Add your first brand.'}</p>}
        </section>

        <section className="brand-create-panel">
          <h2>{editingId ? 'Edit brand' : 'Add new brand'}</h2>
          <form onSubmit={saveBrand}>
            <label>
              <span className="sr-only">Brand name</span>
              <input autoFocus={Boolean(editingId)} required placeholder="Brand name" value={name} onChange={(event) => setName(event.target.value)} />
            </label>
            <input ref={imageInputRef} className="sr-only" type="file" accept="image/*" onChange={uploadBrandLogo} />
            {image ? (
              <div className="brand-logo-preview">
                <img src={image} alt={fileName || `${name} logo`} />
                <span title={fileName}>{fileName || 'Brand logo'}</span>
                <button type="button" aria-label="Remove brand logo" onClick={() => {
                  setImage('')
                  setFileName('')
                }}>×</button>
              </div>
            ) : (
              <button className="brand-logo-upload" type="button" onClick={() => imageInputRef.current?.click()}>
                <span aria-hidden="true">＋</span> Add logo <small>(optional, max 1 MB)</small>
              </button>
            )}
            <div>
              {editingId && <button className="other-cancel-button" type="button" onClick={resetForm}>Cancel</button>}
              <button className="other-add-button" type="submit">{editingId ? 'Save changes' : 'Create'}</button>
            </div>
          </form>
        </section>
      </div>

      {deleteId && (
        <div className="other-modal-backdrop" role="presentation" onMouseDown={(event) => {
          if (event.target === event.currentTarget) setDeleteId(null)
        }}>
          <section className="other-modal other-delete-modal" role="dialog" aria-modal="true" aria-labelledby="delete-brand-title">
            <div className="other-modal-heading">
              <h2 id="delete-brand-title">Delete brand</h2>
              <button type="button" aria-label="Close" onClick={() => setDeleteId(null)}>×</button>
            </div>
            <p>Are you sure you want to delete this brand?</p>
            <div className="other-modal-actions">
              <button className="other-cancel-button" type="button" onClick={() => setDeleteId(null)}>Cancel</button>
              <button className="other-confirm-delete" type="button" onClick={deleteBrand}>Delete</button>
            </div>
          </section>
        </div>
      )}
    </>
  )
}

type BannerSettings = {
  sliderSubtitle: string
  sliderTitle: string
  bannerCategory: string
  bannerEndDate: string
  bannerTitle: string
}

const bannerSettingsKey = 'fastcart-banner-settings'
const emptyBannerSettings: BannerSettings = {
  sliderSubtitle: '',
  sliderTitle: '',
  bannerCategory: '',
  bannerEndDate: '',
  bannerTitle: '',
}

function loadBannerSettings(): BannerSettings {
  try {
    const parsed: unknown = JSON.parse(localStorage.getItem(bannerSettingsKey) ?? 'null')
    if (
      parsed &&
      typeof parsed === 'object' &&
      'sliderSubtitle' in parsed &&
      'sliderTitle' in parsed &&
      'bannerCategory' in parsed &&
      'bannerEndDate' in parsed &&
      'bannerTitle' in parsed &&
      typeof parsed.sliderSubtitle === 'string' &&
      typeof parsed.sliderTitle === 'string' &&
      typeof parsed.bannerCategory === 'string' &&
      typeof parsed.bannerEndDate === 'string' &&
      typeof parsed.bannerTitle === 'string'
    ) {
      return {
        sliderSubtitle: parsed.sliderSubtitle,
        sliderTitle: parsed.sliderTitle,
        bannerCategory: parsed.bannerCategory,
        bannerEndDate: parsed.bannerEndDate,
        bannerTitle: parsed.bannerTitle,
      }
    }
  } catch (error) {
    console.error('Could not load banner settings.', error)
  }
  return emptyBannerSettings
}

function BannersPanel({ items, categories, onSave, onNotice }: CollectionPanelProps & { categories: string[] }) {
  const [settings, setSettings] = useState<BannerSettings>(loadBannerSettings)
  const sliderInputRef = useRef<HTMLInputElement>(null)
  const bannerInputRef = useRef<HTMLInputElement>(null)
  const sliders = items.filter((item) => item.link === 'slider')
  const banner = items.find((item) => item.link === 'banner')

  function saveSettings(kind: 'slider' | 'banner') {
    try {
      localStorage.setItem(bannerSettingsKey, JSON.stringify(settings))
    } catch (error) {
      console.error('Could not save banner settings.', error)
      onNotice('Could not save banner settings in this browser.')
      return
    }
    onNotice(kind === 'slider' ? 'Main slider settings saved.' : 'Banner settings saved.')
  }

  function readFiles(files: File[], onLoad: (images: StoreItem[]) => void, prefix: string) {
    const images: StoreItem[] = []
    let pending = 0
    let finished = false
    const complete = () => {
      if (pending === 0 && !finished) {
        finished = true
        onLoad(images)
      }
    }
    for (const file of files) {
      if (!file.type.startsWith('image/')) {
        onNotice(`${file.name} is not an image file.`)
        continue
      }
      if (file.size > 1024 * 1024) {
        onNotice(`${file.name} is larger than 1 MB.`)
        continue
      }
      pending += 1
      const reader = new FileReader()
      reader.onerror = () => {
        console.error(`Could not read banner image ${file.name}.`, reader.error)
        onNotice(`Could not read ${file.name}.`)
        pending -= 1
        complete()
      }
      reader.onload = () => {
        if (typeof reader.result === 'string') {
          images.push({
            id: `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2)}`,
            name: file.name,
            fileName: file.name,
            image: reader.result,
            link: prefix,
          })
        }
        pending -= 1
        complete()
      }
      reader.readAsDataURL(file)
    }
    complete()
  }

  function addSliders(files: File[]) {
    const remaining = Math.max(0, 5 - sliders.length)
    if (files.length > remaining) onNotice('Up to 5 main slider images are allowed.')
    readFiles(files.slice(0, remaining), (newItems) => {
      if (newItems.length > 0 && onSave([...items, ...newItems])) onNotice('Slider images uploaded.')
    }, 'slider')
  }

  function addBanner(file: File | null) {
    if (!file) return
    readFiles([file], (newItems) => {
      if (newItems.length > 0) {
        const next = [...items.filter((item) => item.link !== 'banner'), newItems[0]]
        if (onSave(next)) onNotice('Banner image uploaded.')
      }
    }, 'banner')
  }

  function removeBannerImage(id: string) {
    if (onSave(items.filter((item) => item.id !== id))) onNotice('Image removed.')
  }

  function saveSettingsSafely(kind: 'slider' | 'banner', event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    saveSettings(kind)
  }

  function handleDrop(event: DragEvent<HTMLButtonElement>, kind: 'slider' | 'banner') {
    event.preventDefault()
    event.currentTarget.classList.remove('dragging')
    const dropped = Array.from(event.dataTransfer.files)
    if (kind === 'slider') addSliders(dropped)
    else addBanner(dropped[0] ?? null)
  }

  function uploadInput(event: ChangeEvent<HTMLInputElement>, kind: 'slider' | 'banner') {
    const files = Array.from(event.target.files ?? [])
    event.target.value = ''
    if (kind === 'slider') addSliders(files)
    else addBanner(files[0] ?? null)
  }

  return (
    <div className="banners-layout">
      <section className="banner-column">
        <h2>Main sliders</h2>
        <input ref={sliderInputRef} className="sr-only" type="file" accept="image/*" multiple onChange={(event) => uploadInput(event, 'slider')} />
        <button className="other-upload-area" type="button" onClick={() => sliderInputRef.current?.click()} onDragOver={(event) => {
          event.preventDefault()
          event.currentTarget.classList.add('dragging')
        }} onDragLeave={(event) => event.currentTarget.classList.remove('dragging')} onDrop={(event) => handleDrop(event, 'slider')}>
          <span className="other-upload-icon">⇧</span>
          <strong>Click to upload or drag and drop</strong>
          <small>SVG, JPG, PNG, GIF, or WEBP, max 1 MB each (up to 5)</small>
        </button>
        <div className="banner-image-list">
          <div className="banner-image-head"><span>Image</span><span>File name</span><span>Action</span></div>
          {sliders.map((image) => (
            <div className="banner-image-row" key={image.id}>
              <img src={image.image} alt={image.name} />
              <span title={image.fileName}>{image.fileName}</span>
              <button type="button" aria-label={`Delete ${image.fileName}`} onClick={() => removeBannerImage(image.id)}><TrashIcon /></button>
            </div>
          ))}
          {sliders.length === 0 && <p className="banner-image-empty">Upload images for the home page slider.</p>}
        </div>
        <form className="banner-settings-card" onSubmit={(event) => saveSettingsSafely('slider', event)}>
          <label>Subtitle<input value={settings.sliderSubtitle} onChange={(event) => setSettings((current) => ({ ...current, sliderSubtitle: event.target.value }))} placeholder="Enhance Your Music Experience" /></label>
          <label>Title<input value={settings.sliderTitle} onChange={(event) => setSettings((current) => ({ ...current, sliderTitle: event.target.value }))} placeholder="Enter slider title" /></label>
          <button className="other-add-button" type="submit">Save</button>
        </form>
      </section>

      <section className="banner-column">
        <h2>Banner</h2>
        <input ref={bannerInputRef} className="sr-only" type="file" accept="image/*" onChange={(event) => uploadInput(event, 'banner')} />
        <button className="other-upload-area" type="button" onClick={() => bannerInputRef.current?.click()} onDragOver={(event) => {
          event.preventDefault()
          event.currentTarget.classList.add('dragging')
        }} onDragLeave={(event) => event.currentTarget.classList.remove('dragging')} onDrop={(event) => handleDrop(event, 'banner')}>
          <span className="other-upload-icon">⇧</span>
          <strong>Click to upload or drag and drop</strong>
          <small>SVG, JPG, PNG, or GIF, max 1 MB</small>
        </button>
        <div className="banner-image-list">
          <div className="banner-image-head"><span>Image</span><span>File name</span><span>Action</span></div>
          {banner ? (
            <div className="banner-image-row" key={banner.id}>
              <img src={banner.image} alt={banner.name} />
              <span title={banner.fileName}>{banner.fileName}</span>
              <button type="button" aria-label={`Delete ${banner.fileName}`} onClick={() => removeBannerImage(banner.id)}><TrashIcon /></button>
            </div>
          ) : <p className="banner-image-empty">Upload a promotional banner image.</p>}
        </div>
        <form className="banner-settings-card banner-single-settings" onSubmit={(event) => saveSettingsSafely('banner', event)}>
          <label>Category
            <select value={settings.bannerCategory} onChange={(event) => setSettings((current) => ({ ...current, bannerCategory: event.target.value }))}>
              <option value="">Select category</option>
              {categories.map((category) => <option key={category}>{category}</option>)}
            </select>
          </label>
          <label>End date
            <input type="datetime-local" value={settings.bannerEndDate} onChange={(event) => setSettings((current) => ({ ...current, bannerEndDate: event.target.value }))} />
          </label>
          <label>Title<input value={settings.bannerTitle} onChange={(event) => setSettings((current) => ({ ...current, bannerTitle: event.target.value }))} placeholder="Banner title" /></label>
          <button className="other-add-button" type="submit">Save</button>
        </form>
      </section>
    </div>
  )
}

export default OtherPage
