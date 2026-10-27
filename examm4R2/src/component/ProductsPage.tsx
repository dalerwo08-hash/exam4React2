import { useMemo, useRef, useState, type ChangeEvent, type FormEvent, type KeyboardEvent } from 'react'
import './ProductsPage.css'

type ProductOption = { name: string; values: string[] }
type ProductImage = { id: string; name: string; data: string }
type Product = {
  id: string
  name: string
  code: string
  description: string
  category: string
  brand: string
  price: number
  discount: number
  inventory: number
  addTax: boolean
  colors: string[]
  tags: string[]
  images: ProductImage[]
  hasOptions: boolean
  options: ProductOption[]
}
type Color = { name: string; value: string }

const productStorageKey = 'fastcart-products'
const colorStorageKey = 'fastcart-product-colors'
const initialColors: Color[] = [
  { name: 'Blue', value: '#3977ff' },
  { name: 'Coral', value: '#e76b70' },
  { name: 'Purple', value: '#6159e8' },
  { name: 'Yellow', value: '#ffb400' },
  { name: 'Green', value: '#08a96d' },
  { name: 'Charcoal', value: '#41434b' },
]

const emptyProduct = (): Omit<Product, 'id'> => ({
  name: '',
  code: '',
  description: '',
  category: '',
  brand: '',
  price: 0,
  discount: 0,
  inventory: 0,
  addTax: false,
  colors: [],
  tags: [],
  images: [],
  hasOptions: false,
  options: [
    { name: 'Size', values: ['S', 'M', 'L', 'XL'] },
    { name: 'Weight', values: ['10', '20', '30', '40'] },
  ],
})

function readStorage<T>(key: string, validate: (value: unknown) => value is T, fallback: T): T {
  try {
    const value: unknown = JSON.parse(localStorage.getItem(key) ?? 'null')
    return validate(value) ? value : fallback
  } catch (error) {
    console.error(`Could not read ${key} from browser storage.`, error)
    return fallback
  }
}

function isProductList(value: unknown): value is Product[] {
  return Array.isArray(value) && value.every((item) =>
    typeof item.id === 'string' &&
    typeof item.name === 'string' &&
    typeof item.price === 'number' &&
    Array.isArray(item.images) &&
    Array.isArray(item.colors) &&
    Array.isArray(item.tags) &&
    Array.isArray(item.options),
  )
}

function isColorList(value: unknown): value is Color[] {
  return Array.isArray(value) && value.every((item) =>
    typeof item.name === 'string' && typeof item.value === 'string',
  )
}

function ProductsPage({ search }: { search: string }) {
  const [products, setProducts] = useState<Product[]>(() =>
    readStorage(productStorageKey, isProductList, []),
  )
  const [colors, setColors] = useState<Color[]>(() =>
    readStorage(colorStorageKey, isColorList, initialColors),
  )
  const [form, setForm] = useState<Omit<Product, 'id'>>(emptyProduct)
  const [view, setView] = useState<'list' | 'form'>('list')
  const [editingProductId, setEditingProductId] = useState<string | null>(null)
  const [deleteProductId, setDeleteProductId] = useState<string | null>(null)
  const [previewImage, setPreviewImage] = useState<ProductImage | null>(null)
  const [successOpen, setSuccessOpen] = useState(false)
  const [colorModalOpen, setColorModalOpen] = useState(false)
  const [newColorName, setNewColorName] = useState('')
  const [newColorValue, setNewColorValue] = useState('#00599c')
  const [tagInput, setTagInput] = useState('')
  const [notice, setNotice] = useState('')
  const descriptionRef = useRef<HTMLTextAreaElement>(null)
  const imageInputRef = useRef<HTMLInputElement>(null)

  const visibleProducts = useMemo(() => {
    const query = search.trim().toLowerCase()
    return products.filter((product) =>
      `${product.name} ${product.code} ${product.category} ${product.brand} ${product.tags.join(' ')}`
        .toLowerCase()
        .includes(query),
    )
  }, [products, search])

  function storeProducts(next: Product[]) {
    try {
      localStorage.setItem(productStorageKey, JSON.stringify(next))
      setProducts(next)
      return true
    } catch (error) {
      console.error('Could not save products to browser storage.', error)
      setNotice('Could not save the product. Remove some large images and try again.')
      return false
    }
  }

  function storeColors(next: Color[]) {
    try {
      localStorage.setItem(colorStorageKey, JSON.stringify(next))
      setColors(next)
      return true
    } catch (error) {
      console.error('Could not save product colors to browser storage.', error)
      setNotice('Could not save the new color in this browser.')
      return false
    }
  }

  function update<K extends keyof Omit<Product, 'id'>>(key: K, value: Omit<Product, 'id'>[K]) {
    setForm((current) => ({ ...current, [key]: value }))
  }

  function startNewProduct() {
    setNotice('')
    setEditingProductId(null)
    setForm(emptyProduct())
    setView('form')
  }

  function startEditProduct(product: Product) {
    setNotice('')
    setEditingProductId(product.id)
    setForm({
      name: product.name,
      code: product.code,
      description: product.description,
      category: product.category,
      brand: product.brand,
      price: product.price,
      discount: product.discount,
      inventory: product.inventory,
      addTax: product.addTax,
      colors: [...product.colors],
      tags: [...product.tags],
      images: [...product.images],
      hasOptions: product.hasOptions,
      options: product.options.map((option) => ({ ...option, values: [...option.values] })),
    })
    setView('form')
  }

  function cancelProduct() {
    setView('list')
    setNotice('')
    setEditingProductId(null)
  }

  function addTag(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key !== 'Enter' && event.key !== ',') return
    event.preventDefault()
    const value = tagInput.trim().replace(/,$/, '')
    if (value && !form.tags.includes(value)) update('tags', [...form.tags, value])
    setTagInput('')
  }

  function addImageFiles(files: File[]) {
    const remaining = Math.max(0, 5 - form.images.length)
    if (files.length > remaining) {
      setNotice('You can add up to 5 images per product.')
    }
    const selected = files.slice(0, remaining)
    selected.forEach((file) => {
      if (!file.type.startsWith('image/')) {
        setNotice(`${file.name} is not an image file.`)
        return
      }
      if (file.size > 1024 * 1024) {
        setNotice(`${file.name} is larger than 1 MB. Choose a smaller image.`)
        return
      }
      const reader = new FileReader()
      reader.onerror = () => {
        console.error(`Could not read image ${file.name}.`, reader.error)
        setNotice(`Could not read ${file.name}. Please try another image.`)
      }
      reader.onload = () => {
        if (typeof reader.result !== 'string') {
          setNotice(`Could not read ${file.name}. Please try another image.`)
          return
        }
        setForm((current) => {
          if (current.images.length >= 5) return current
          return {
            ...current,
            images: [...current.images, {
              id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
              name: file.name,
              data: reader.result as string,
            }],
          }
        })
        setNotice('')
      }
      reader.readAsDataURL(file)
    })
  }

  function uploadImages(event: ChangeEvent<HTMLInputElement>) {
    addImageFiles(Array.from(event.target.files ?? []))
    event.target.value = ''
  }

  function addOption() {
    update('options', [...form.options, { name: '', values: [] }])
  }

  function addOptionValue(index: number, value: string) {
    const trimmed = value.trim()
    if (!trimmed) return
    update('options', form.options.map((option, optionIndex) =>
      optionIndex === index && !option.values.includes(trimmed)
        ? { ...option, values: [...option.values, trimmed] }
        : option,
    ))
  }

  function formatDescription(format: 'bold' | 'italic' | 'underline' | 'list') {
    const textarea = descriptionRef.current
    if (!textarea) return
    const start = textarea.selectionStart
    const end = textarea.selectionEnd
    const selected = form.description.slice(start, end) || 'text'
    const wrappers = {
      bold: [`**${selected}**`, 2, 2],
      italic: [`_${selected}_`, 1, 1],
      underline: [`<u>${selected}</u>`, 3, 4],
      list: [`\n- ${selected}`, 3, 3],
    } as const
    const [replacement, selectionStart, selectionEnd] = wrappers[format]
    const description = `${form.description.slice(0, start)}${replacement}${form.description.slice(end)}`
    update('description', description)
    requestAnimationFrame(() => {
      textarea.focus()
      textarea.setSelectionRange(start + selectionStart, start + replacement.length - selectionEnd)
    })
  }

  function saveProduct(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!form.name.trim()) {
      setNotice('Product name is required.')
      return
    }
    if (!Number.isFinite(form.price) || form.price <= 0) {
      setNotice('Enter a price greater than zero.')
      return
    }
    if (!Number.isFinite(form.inventory) || form.inventory < 0) {
      setNotice('Inventory cannot be negative.')
      return
    }
    if (form.discount < 0 || form.discount > 100) {
      setNotice('Discount must be between 0% and 100%.')
      return
    }
    if (form.hasOptions && form.options.some((option) => !option.name.trim() || option.values.length === 0)) {
      setNotice('Each product option needs a name and at least one value.')
      return
    }
    const product: Product = {
      ...form,
      id: editingProductId ?? `PRD-${Date.now().toString().slice(-7)}`,
      name: form.name.trim(),
      code: form.code.trim(),
      description: form.description.trim(),
      category: form.category.trim(),
      brand: form.brand.trim(),
      options: form.options.map((option) => ({ ...option, name: option.name.trim() })),
    }
    const nextProducts = editingProductId
      ? products.map((existing) => existing.id === editingProductId ? product : existing)
      : [product, ...products]
    if (storeProducts(nextProducts)) {
      setView('list')
      setSuccessOpen(!editingProductId)
      if (editingProductId) setNotice('Product updated successfully.')
      setEditingProductId(null)
    }
  }

  function createColor(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const name = newColorName.trim()
    if (!name) return
    const next = [...colors, { name, value: newColorValue }]
    if (storeColors(next)) {
      update('colors', [...form.colors, newColorValue])
      setColorModalOpen(false)
      setNewColorName('')
      setNewColorValue('#00599c')
    }
  }

  function removeProduct() {
    if (!deleteProductId) return
    const nextProducts = products.filter((product) => product.id !== deleteProductId)
    if (storeProducts(nextProducts)) {
      setDeleteProductId(null)
      setNotice('Product deleted.')
    }
  }

  function removeImage(id: string) {
    update('images', form.images.filter((image) => image.id !== id))
  }

  return (
    <section className="products-content">
      {view === 'list' ? (
        <>
          <div className="products-page-heading">
            <div>
              <p className="products-eyebrow">MANAGE YOUR STORE</p>
              <h1>Products</h1>
            </div>
            <button className="product-primary-button" type="button" onClick={startNewProduct}>
              <span aria-hidden="true">＋</span> Add new
            </button>
          </div>
          {notice && <p className="product-notice" role="status">{notice}</p>}
          <div className="product-list-toolbar">
            <span>{visibleProducts.length} {visibleProducts.length === 1 ? 'product' : 'products'}</span>
          </div>
          <div className="product-list-wrap">
            <table className="product-list-table">
              <thead>
                <tr><th>Image</th><th>Product</th><th>Code</th><th>Inventory</th><th>Category</th><th>Price</th><th>Action</th></tr>
              </thead>
              <tbody>
                {visibleProducts.map((product) => (
                  <tr key={product.id}>
                    <td>
                      {product.images[0]
                        ? <button className="product-image-preview-button" type="button" aria-label={`View image of ${product.name}`} onClick={() => setPreviewImage(product.images[0])}><img className="product-list-image" src={product.images[0].data} alt={product.name} /></button>
                        : <span className="product-list-image product-image-placeholder" aria-hidden="true">◇</span>}
                    </td>
                    <td>{product.name}</td>
                    <td>{product.code || '—'}</td>
                    <td>{product.inventory} in stock</td>
                    <td>{product.category || '—'}</td>
                    <td>${product.price.toFixed(2)}</td>
                    <td className="product-list-actions">
                      <button className="product-edit-button" type="button" aria-label={`Edit ${product.name}`} onClick={() => startEditProduct(product)}>✎</button>
                      <button className="product-delete-button" type="button" aria-label={`Delete ${product.name}`} onClick={() => setDeleteProductId(product.id)}>▢</button>
                    </td>
                  </tr>
                ))}
                {visibleProducts.length === 0 && (
                  <tr><td className="product-list-empty" colSpan={7}>{search ? 'No products match your search.' : 'No products yet. Add your first product to get started.'}</td></tr>
                )}

              </tbody>
            </table>
          </div>
        </>
      ) : (
        <form className="product-form" onSubmit={saveProduct}>
          <div className="product-form-topbar">
            <button className="product-back-button" type="button" onClick={cancelProduct}>← <span>Products</span> / {editingProductId ? 'Edit' : 'Add new'}</button>
            <div>
              <button className="product-cancel-button" type="button" onClick={cancelProduct}>Cancel</button>
              <button className="product-primary-button" type="submit">{editingProductId ? 'Update' : 'Save'}</button>
            </div>
          </div>

          <div className="product-form-columns">
            <div className="product-form-main">
              <h2>Information</h2>
              {notice && <p className="product-notice" role="alert">{notice}</p>}
              <div className="product-name-row">
                <input required aria-label="Product name" placeholder="Product name" value={form.name} onChange={(event) => update('name', event.target.value)} />
                <input aria-label="Product code" placeholder="Code" value={form.code} onChange={(event) => update('code', event.target.value)} />
              </div>

              <div className="product-description-editor">
                <div className="product-editor-toolbar" aria-label="Description formatting">
                  <select aria-label="Text style" defaultValue="Normal"><option>Normal</option><option>Heading</option><option>Subtitle</option></select>
                  <button type="button" aria-label="Bold" onClick={() => formatDescription('bold')}><strong>B</strong></button>
                  <button type="button" aria-label="Italic" onClick={() => formatDescription('italic')}><em>I</em></button>
                  <button type="button" aria-label="Underline" onClick={() => formatDescription('underline')}><u>U</u></button>
                  <button type="button" aria-label="Bulleted list" onClick={() => formatDescription('list')}>☷</button>
                  <span aria-hidden="true">↔</span>
                </div>
                <textarea
                  ref={descriptionRef}
                  aria-label="Product description"
                  placeholder="Description"
                  value={form.description}
                  onChange={(event) => update('description', event.target.value)}
                />
              </div>

              <div className="product-select-row">
                <label>
                  <span className="sr-only">Category</span>
                  <select value={form.category} onChange={(event) => update('category', event.target.value)}>
                    <option value="">Categories</option><option>Clothing</option><option>Accessories</option><option>Home</option><option>Electronics</option><option>Beauty</option>
                  </select>
                </label>
                <label>
                  <span className="sr-only">Brand</span>
                  <select value={form.brand} onChange={(event) => update('brand', event.target.value)}>
                    <option value="">Brands</option><option>Fastcart</option><option>Erbology</option><option>Urban Style</option><option>Other</option>
                  </select>
                </label>
              </div>

              <h3 className="product-section-title">Price</h3>
              <div className="product-price-row">
                <label><span className="sr-only">Product price</span><input required type="number" min="0.01" step="0.01" placeholder="Product price" value={form.price || ''} onChange={(event) => update('price', Number(event.target.value))} /></label>
                <label><span className="sr-only">Discount percent</span><input type="number" min="0" max="100" step="1" placeholder="Discount %" value={form.discount || ''} onChange={(event) => update('discount', Number(event.target.value))} /></label>
                <label><span className="sr-only">Inventory count</span><input required type="number" min="0" step="1" placeholder="Count" value={form.inventory || ''} onChange={(event) => update('inventory', Number(event.target.value))} /></label>
              </div>
              {form.discount > 0 && form.price > 0 && (
                <p className="product-discount-preview">Price after discount: ${(form.price * (1 - form.discount / 100)).toFixed(2)}</p>
              )}
              <label className="product-tax-toggle">
                <input type="checkbox" checked={form.addTax} onChange={(event) => update('addTax', event.target.checked)} />
                <span className="toggle-track" />
                Add tax for this product
              </label>

              <div className="product-options-heading">
                <div><strong>Different Options</strong><small>This product has multiple options</small></div>
                <label className="product-switch">
                  <input type="checkbox" checked={form.hasOptions} onChange={(event) => update('hasOptions', event.target.checked)} />
                  <span />
                </label>
              </div>

              {form.hasOptions && (
                <div className="product-options-list">
                  <div className="product-options-labels"><span>Options</span><span>Values</span></div>
                  {form.options.map((option, index) => (
                    <div className="product-option-row" key={`option-${index}`}>
                      <label>
                        <span>Option {index + 1}</span>
                        <input
                          required
                          placeholder="Option name"
                          value={option.name}
                          onChange={(event) => update('options', form.options.map((item, itemIndex) => itemIndex === index ? { ...item, name: event.target.value } : item))}
                        />
                      </label>
                      <div className="product-option-values">
                        <div className="product-value-chips">
                          {option.values.map((value) => (
                            <button type="button" key={value} aria-label={`Remove ${value}`} onClick={() => update('options', form.options.map((item, itemIndex) => itemIndex === index ? { ...item, values: item.values.filter((entry) => entry !== value) } : item))}>
                              {value} <span>×</span>
                            </button>
                          ))}
                        </div>
                        <input
                          placeholder="Add value and press Enter"
                          onKeyDown={(event) => {
                            if (event.key === 'Enter') {
                              event.preventDefault()
                              addOptionValue(index, event.currentTarget.value)
                              event.currentTarget.value = ''
                            }
                          }}
                        />
                      </div>
                      <button className="remove-option-button" type="button" aria-label={`Remove option ${index + 1}`} onClick={() => update('options', form.options.filter((_, itemIndex) => itemIndex !== index))}>×</button>
                    </div>
                  ))}
                  <button className="product-add-more" type="button" onClick={addOption}>＋ Add more</button>
                </div>
              )}
            </div>

            <aside className="product-form-side">
              <section className="product-side-card color-card">
                <div className="product-side-title"><h3>Colour:</h3><button type="button" onClick={() => setColorModalOpen(true)}>＋ Create new</button></div>
                <div className="product-color-list">
                  {colors.map((color) => (
                    <button
                      type="button"
                      key={`${color.name}-${color.value}`}
                      title={color.name}
                      aria-label={`${form.colors.includes(color.value) ? 'Remove' : 'Select'} ${color.name}`}
                      aria-pressed={form.colors.includes(color.value)}
                      className={form.colors.includes(color.value) ? 'product-color selected' : 'product-color'}
                      style={{ backgroundColor: color.value }}
                      onClick={() => update('colors', form.colors.includes(color.value) ? form.colors.filter((value) => value !== color.value) : [...form.colors, color.value])}
                    />
                  ))}
                </div>
              </section>

              <section className="product-side-card tags-card">
                <h3>Tags</h3>
                <div className="product-tag-entry">
                  <input
                    placeholder="Tags name"
                    value={tagInput}
                    onChange={(event) => setTagInput(event.target.value)}
                    onKeyDown={addTag}
                    aria-label="Add product tag"
                  />
                  <button type="button" aria-label="Add tag" onClick={() => {
                    const value = tagInput.trim()
                    if (value && !form.tags.includes(value)) update('tags', [...form.tags, value])
                    setTagInput('')
                  }}>✓</button>
                </div>
                <div className="product-tags-list">
                  {form.tags.map((tag) => (
                    <button type="button" key={tag} onClick={() => update('tags', form.tags.filter((item) => item !== tag))}>{tag} <span>×</span></button>
                  ))}
                </div>
              </section>

              <section className="product-images-section">
                <h3>Images <small>{form.images.length}/5</small></h3>
                <input ref={imageInputRef} className="sr-only" type="file" accept="image/*" multiple onChange={uploadImages} />
                <button className="image-upload-area" type="button" onClick={() => imageInputRef.current?.click()} onDragOver={(event) => {
                  event.preventDefault()
                  event.currentTarget.classList.add('dragging')
                }} onDragLeave={(event) => {
                  event.currentTarget.classList.remove('dragging')
                }} onDrop={(event) => {
                  event.preventDefault()
                  event.currentTarget.classList.remove('dragging')
                  addImageFiles(Array.from(event.dataTransfer.files))
                }}>
                  <span className="upload-icon">⇧</span>
                  <strong>Click to upload or drag and drop</strong>
                  <small>JPG, PNG, GIF or WEBP, max 1 MB each</small>
                </button>
                {form.images.length > 0 && (
                  <div className="product-images-table">
                    <div><span>Image</span><span>File name</span><span>Action</span></div>
                    {form.images.map((image) => (
                      <div key={image.id}>
                        <img src={image.data} alt={image.name} />
                        <span title={image.name}>{image.name}</span>
                        <button type="button" aria-label={`Remove ${image.name}`} onClick={() => removeImage(image.id)}>×</button>
                      </div>
                    ))}
                  </div>
                )}
              </section>
            </aside>
          </div>

          <div className="product-form-bottom-actions">
            <button className="product-cancel-button" type="button" onClick={cancelProduct}>Cancel</button>
            <button className="product-primary-button" type="submit">{editingProductId ? 'Update product' : 'Save product'}</button>
          </div>
        </form>
      )}

      {colorModalOpen && (
        <div className="product-modal-backdrop" role="presentation" onMouseDown={(event) => {
          if (event.target === event.currentTarget) setColorModalOpen(false)
        }}>
          <section className="product-dialog" role="dialog" aria-modal="true" aria-labelledby="new-color-title">
            <div className="product-dialog-heading">
              <h2 id="new-color-title">New color</h2>
              <button type="button" aria-label="Close" onClick={() => setColorModalOpen(false)}>×</button>
            </div>
            <form onSubmit={createColor}>
              <label className="new-color-controls">
                <span className="sr-only">Color name</span>
                <input required placeholder="Color name" value={newColorName} onChange={(event) => setNewColorName(event.target.value)} />
                <span className="color-picker-wrap">
                  <input type="color" aria-label="Choose color" value={newColorValue} onChange={(event) => setNewColorValue(event.target.value)} />
                  <code>{newColorValue.toUpperCase()}</code>
                </span>
              </label>
              <div className="product-dialog-actions">
                <button className="product-cancel-button" type="button" onClick={() => setColorModalOpen(false)}>Cancel</button>
                <button className="product-primary-button" type="submit">Create</button>
              </div>
            </form>
          </section>
        </div>
      )}

      {successOpen && (
        <div className="product-modal-backdrop" role="presentation" onMouseDown={(event) => {
          if (event.target === event.currentTarget) setSuccessOpen(false)
        }}>
          <section className="product-success-dialog" role="dialog" aria-modal="true" aria-labelledby="product-success-title">
            <button className="product-success-close" type="button" aria-label="Close" onClick={() => setSuccessOpen(false)}>×</button>
            <span className="product-success-icon">✓</span>
            <h2 id="product-success-title">Successfully added</h2>
            <p>Do you want to add a new product to your store?</p>
            <div>
              <button className="product-cancel-button" type="button" onClick={() => setSuccessOpen(false)}>Go to products</button>
              <button className="product-primary-button" type="button" onClick={() => {
                setSuccessOpen(false)
                startNewProduct()
              }}>＋ Add new</button>
            </div>
          </section>
        </div>
      )}

      {previewImage && (
        <div className="product-modal-backdrop product-image-viewer-backdrop" role="presentation" onMouseDown={(event) => {
          if (event.target === event.currentTarget) setPreviewImage(null)
        }}>
          <section className="product-image-viewer" role="dialog" aria-modal="true" aria-label={previewImage.name}>
            <button type="button" aria-label="Close image preview" onClick={() => setPreviewImage(null)}>×</button>
            <img src={previewImage.data} alt={previewImage.name} />
            <p>{previewImage.name}</p>
          </section>
        </div>
      )}

      {deleteProductId && (
        <div className="product-modal-backdrop" role="presentation" onMouseDown={(event) => {
          if (event.target === event.currentTarget) setDeleteProductId(null)
        }}>
          <section className="product-dialog product-delete-dialog" role="dialog" aria-modal="true" aria-labelledby="delete-product-title">
            <div className="product-dialog-heading">
              <h2 id="delete-product-title">Delete product</h2>
              <button type="button" aria-label="Close" onClick={() => setDeleteProductId(null)}>×</button>
            </div>
            <p>Are you sure you want to delete this product?</p>
            <div className="product-dialog-actions">
              <button className="product-cancel-button" type="button" onClick={() => setDeleteProductId(null)}>Cancel</button>
              <button className="product-confirm-delete" type="button" onClick={removeProduct}>Delete</button>
            </div>
          </section>
        </div>
      )}
    </section>
  )
}

export default ProductsPage
