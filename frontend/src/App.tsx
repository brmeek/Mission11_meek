import { useEffect, useMemo, useState } from 'react'
import './App.css'
import { buildApiUrl } from './api'

type Book = {
  bookID: number
  title: string
  author: string
  publisher: string
  isbn: string
  classification: string
  category: string
  pageCount: number
  price: number
}

type BooksResponse = {
  books: Book[]
  totalBooks: number
  page: number
  pageSize: number
  totalPages: number
}

type CartItem = {
  book: Book
  quantity: number
}

type View = 'shop' | 'cart' | 'add' | 'edit'

type BookFormState = {
  title: string
  author: string
  publisher: string
  isbn: string
  classification: string
  category: string
  pageCount: string
  price: string
}

type BookUpsertPayload = {
  title: string
  author: string
  publisher: string
  isbn: string
  classification: string
  category: string
  pageCount: number
  price: number
}

const CART_STORAGE_KEY = 'bookstore_cart'
const BROWSE_STATE_KEY = 'bookstore_browse_state'

const EMPTY_BOOK_FORM: BookFormState = {
  title: '',
  author: '',
  publisher: '',
  isbn: '',
  classification: '',
  category: '',
  pageCount: '',
  price: '',
}

function toBookFormState(book: Book): BookFormState {
  return {
    title: book.title,
    author: book.author,
    publisher: book.publisher,
    isbn: book.isbn,
    classification: book.classification,
    category: book.category,
    pageCount: String(book.pageCount),
    price: book.price.toString(),
  }
}

async function readErrorMessage(response: Response, fallback: string) {
  try {
    const payload = (await response.json()) as { message?: string }
    if (typeof payload.message === 'string' && payload.message.trim().length > 0) {
      return payload.message
    }
  } catch {
    // Best effort. If payload is not JSON we still return fallback.
  }

  return fallback
}

function App() {
  const [books, setBooks] = useState<Book[]>([])
  const [categories, setCategories] = useState<string[]>([])
  const [selectedCategory, setSelectedCategory] = useState('All')
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(5)
  const [sort, setSort] = useState<'asc' | 'desc'>('asc')
  const [totalPages, setTotalPages] = useState(0)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [cartItems, setCartItems] = useState<CartItem[]>([])
  const [view, setView] = useState<View>('shop')

  const [reloadToken, setReloadToken] = useState(0)
  const [actionMessage, setActionMessage] = useState('')
  const [activeBookId, setActiveBookId] = useState<number | null>(null)
  const [bookForm, setBookForm] = useState<BookFormState>(EMPTY_BOOK_FORM)
  const [formError, setFormError] = useState('')
  const [formSaving, setFormSaving] = useState(false)
  const [deletingBook, setDeletingBook] = useState(false)

  useEffect(() => {
    const savedCart = sessionStorage.getItem(CART_STORAGE_KEY)
    const savedBrowseState = sessionStorage.getItem(BROWSE_STATE_KEY)

    if (savedCart) {
      setCartItems(JSON.parse(savedCart) as CartItem[])
    }

    if (savedBrowseState) {
      const state = JSON.parse(savedBrowseState) as {
        page: number
        pageSize: number
        sort: 'asc' | 'desc'
        selectedCategory: string
      }

      setPage(state.page)
      setPageSize(state.pageSize)
      setSort(state.sort)
      setSelectedCategory(state.selectedCategory)
    }
  }, [])

  useEffect(() => {
    sessionStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cartItems))
  }, [cartItems])

  useEffect(() => {
    sessionStorage.setItem(
      BROWSE_STATE_KEY,
      JSON.stringify({ page, pageSize, sort, selectedCategory }),
    )
  }, [page, pageSize, sort, selectedCategory])

  useEffect(() => {
    const controller = new AbortController()

    const fetchCategories = async () => {
      try {
        const response = await fetch(buildApiUrl('/api/categories'), { signal: controller.signal })
        if (!response.ok) {
          throw new Error('Unable to load categories')
        }

        const data: string[] = await response.json()
        setCategories(data)
      } catch (err) {
        if (err instanceof Error && err.name !== 'AbortError') {
          setCategories([])
        }
      }
    }

    fetchCategories()
    return () => controller.abort()
  }, [reloadToken])

  useEffect(() => {
    const controller = new AbortController()

    const fetchBooks = async () => {
      try {
        setLoading(true)
        setError('')

        const categoryQuery =
          selectedCategory === 'All'
            ? ''
            : `&category=${encodeURIComponent(selectedCategory)}`

        const response = await fetch(
          buildApiUrl(`/api/books?page=${page}&pageSize=${pageSize}&sort=${sort}${categoryQuery}`),
          { signal: controller.signal },
        )

        if (!response.ok) {
          throw new Error('Unable to load books from API')
        }

        const data: BooksResponse = await response.json()
        setBooks(data.books)
        setTotalPages(data.totalPages)

        if (data.totalPages > 0 && page > data.totalPages) {
          setPage(data.totalPages)
        }
      } catch (err) {
        if (err instanceof Error && err.name !== 'AbortError') {
          setError(err.message)
        }
      } finally {
        setLoading(false)
      }
    }

    fetchBooks()
    return () => controller.abort()
  }, [page, pageSize, sort, selectedCategory, reloadToken])

  const pageNumbers = useMemo(
    () => Array.from({ length: totalPages }, (_, i) => i + 1),
    [totalPages],
  )

  const cartSummary = useMemo(() => {
    return cartItems.reduce(
      (summary, item) => {
        summary.totalItems += item.quantity
        summary.totalPrice += item.quantity * item.book.price
        return summary
      },
      { totalItems: 0, totalPrice: 0 },
    )
  }, [cartItems])

  const addToCart = (book: Book) => {
    setCartItems((prev) => {
      const existing = prev.find((i) => i.book.bookID === book.bookID)

      if (existing) {
        return prev.map((item) =>
          item.book.bookID === book.bookID
            ? { ...item, quantity: item.quantity + 1 }
            : item,
        )
      }

      return [...prev, { book, quantity: 1 }]
    })
  }

  const updateQuantity = (bookID: number, quantity: number) => {
    if (quantity <= 0) {
      setCartItems((prev) => prev.filter((item) => item.book.bookID !== bookID))
      return
    }

    setCartItems((prev) =>
      prev.map((item) =>
        item.book.bookID === bookID ? { ...item, quantity } : item,
      ),
    )
  }

  const openAddBookPage = () => {
    setActionMessage('')
    setFormError('')
    setActiveBookId(null)
    setBookForm(EMPTY_BOOK_FORM)
    setView('add')
  }

  const openEditBookPage = (book: Book) => {
    setActionMessage('')
    setFormError('')
    setActiveBookId(book.bookID)
    setBookForm(toBookFormState(book))
    setView('edit')
  }

  const setFieldValue = (field: keyof BookFormState, value: string) => {
    setBookForm((current) => ({ ...current, [field]: value }))
  }

  const validateBookForm = () => {
    if (!bookForm.title.trim()) {
      return 'Title is required.'
    }

    if (!bookForm.author.trim()) {
      return 'Author is required.'
    }

    if (!bookForm.publisher.trim()) {
      return 'Publisher is required.'
    }

    if (!bookForm.isbn.trim()) {
      return 'ISBN is required.'
    }

    if (!bookForm.classification.trim()) {
      return 'Classification is required.'
    }

    if (!bookForm.category.trim()) {
      return 'Category is required.'
    }

    const pageCount = Number(bookForm.pageCount)
    if (!Number.isInteger(pageCount) || pageCount < 1) {
      return 'Page count must be at least 1.'
    }

    const price = Number(bookForm.price)
    if (!Number.isFinite(price) || price < 0) {
      return 'Price must be a valid number that is zero or greater.'
    }

    return ''
  }

  const buildBookPayload = (): BookUpsertPayload => ({
    title: bookForm.title.trim(),
    author: bookForm.author.trim(),
    publisher: bookForm.publisher.trim(),
    isbn: bookForm.isbn.trim(),
    classification: bookForm.classification.trim(),
    category: bookForm.category.trim(),
    pageCount: Number(bookForm.pageCount),
    price: Number(bookForm.price),
  })

  const refreshAfterDataChange = () => {
    setPage(1)
    setSelectedCategory('All')
    setReloadToken((value) => value + 1)
  }

  const createBook = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    const validationError = validateBookForm()
    if (validationError) {
      setFormError(validationError)
      return
    }

    try {
      setFormSaving(true)
      setFormError('')

      const response = await fetch(buildApiUrl('/api/books'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(buildBookPayload()),
      })

      if (!response.ok) {
        const message = await readErrorMessage(response, 'Unable to add book.')
        throw new Error(message)
      }

      setActionMessage('Book added successfully.')
      setView('shop')
      setBookForm(EMPTY_BOOK_FORM)
      refreshAfterDataChange()
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Unable to add book.')
    } finally {
      setFormSaving(false)
    }
  }

  const updateBook = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    if (activeBookId === null) {
      setFormError('No book selected for editing.')
      return
    }

    const validationError = validateBookForm()
    if (validationError) {
      setFormError(validationError)
      return
    }

    try {
      setFormSaving(true)
      setFormError('')

      const response = await fetch(buildApiUrl(`/api/books/${activeBookId}`), {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(buildBookPayload()),
      })

      if (!response.ok) {
        const message = await readErrorMessage(response, 'Unable to update book.')
        throw new Error(message)
      }

      setActionMessage('Book updated successfully.')
      setView('shop')
      refreshAfterDataChange()
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Unable to update book.')
    } finally {
      setFormSaving(false)
    }
  }

  const deleteBook = async () => {
    if (activeBookId === null) {
      setFormError('No book selected for deletion.')
      return
    }

    const confirmed = window.confirm('Delete this book from the catalog?')
    if (!confirmed) {
      return
    }

    try {
      setDeletingBook(true)
      setFormError('')

      const response = await fetch(buildApiUrl(`/api/books/${activeBookId}`), {
        method: 'DELETE',
      })

      if (!response.ok) {
        const message = await readErrorMessage(response, 'Unable to delete book.')
        throw new Error(message)
      }

      setCartItems((prev) => prev.filter((item) => item.book.bookID !== activeBookId))
      setActionMessage('Book deleted successfully.')
      setView('shop')
      refreshAfterDataChange()
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Unable to delete book.')
    } finally {
      setDeletingBook(false)
    }
  }

  const renderBookForm = (mode: 'add' | 'edit') => {
    const isEditMode = mode === 'edit'

    return (
      <div className="container py-4">
        <div className="d-flex justify-content-between align-items-center mb-3">
          <h1 className="mb-0">{isEditMode ? 'Edit Book' : 'Add New Book'}</h1>
          <button className="btn btn-outline-secondary" onClick={() => setView('shop')}>
            Back to Catalog
          </button>
        </div>

        <div className="card shadow-sm">
          <div className="card-body">
            {formError && <div className="alert alert-danger">{formError}</div>}

            <form onSubmit={isEditMode ? updateBook : createBook}>
              <div className="row g-3">
                <div className="col-md-6">
                  <label htmlFor="title" className="form-label">Title</label>
                  <input
                    id="title"
                    className="form-control"
                    value={bookForm.title}
                    onChange={(e) => setFieldValue('title', e.target.value)}
                    required
                  />
                </div>

                <div className="col-md-6">
                  <label htmlFor="author" className="form-label">Author</label>
                  <input
                    id="author"
                    className="form-control"
                    value={bookForm.author}
                    onChange={(e) => setFieldValue('author', e.target.value)}
                    required
                  />
                </div>

                <div className="col-md-6">
                  <label htmlFor="publisher" className="form-label">Publisher</label>
                  <input
                    id="publisher"
                    className="form-control"
                    value={bookForm.publisher}
                    onChange={(e) => setFieldValue('publisher', e.target.value)}
                    required
                  />
                </div>

                <div className="col-md-6">
                  <label htmlFor="isbn" className="form-label">ISBN</label>
                  <input
                    id="isbn"
                    className="form-control"
                    value={bookForm.isbn}
                    onChange={(e) => setFieldValue('isbn', e.target.value)}
                    required
                  />
                </div>

                <div className="col-md-6">
                  <label htmlFor="classification" className="form-label">Classification</label>
                  <input
                    id="classification"
                    className="form-control"
                    value={bookForm.classification}
                    onChange={(e) => setFieldValue('classification', e.target.value)}
                    required
                  />
                </div>

                <div className="col-md-6">
                  <label htmlFor="category" className="form-label">Category</label>
                  <input
                    id="category"
                    className="form-control"
                    value={bookForm.category}
                    onChange={(e) => setFieldValue('category', e.target.value)}
                    required
                  />
                </div>

                <div className="col-md-6">
                  <label htmlFor="pageCount" className="form-label">Page Count</label>
                  <input
                    id="pageCount"
                    type="number"
                    min={1}
                    className="form-control"
                    value={bookForm.pageCount}
                    onChange={(e) => setFieldValue('pageCount', e.target.value)}
                    required
                  />
                </div>

                <div className="col-md-6">
                  <label htmlFor="price" className="form-label">Price</label>
                  <input
                    id="price"
                    type="number"
                    min={0}
                    step="0.01"
                    className="form-control"
                    value={bookForm.price}
                    onChange={(e) => setFieldValue('price', e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="d-flex justify-content-between mt-4">
                <div>
                  {isEditMode && (
                    <button
                      type="button"
                      className="btn btn-outline-danger"
                      onClick={deleteBook}
                      disabled={deletingBook || formSaving}
                    >
                      {deletingBook ? 'Deleting...' : 'Delete Book'}
                    </button>
                  )}
                </div>

                <div className="d-flex gap-2">
                  <button
                    type="button"
                    className="btn btn-outline-secondary"
                    onClick={() => setView('shop')}
                    disabled={formSaving || deletingBook}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="btn btn-primary"
                    disabled={formSaving || deletingBook}
                  >
                    {formSaving
                      ? isEditMode
                        ? 'Saving...'
                        : 'Adding...'
                      : isEditMode
                        ? 'Save Changes'
                        : 'Add Book'}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      </div>
    )
  }

  if (view === 'cart') {
    return (
      <div className="container py-4">
        <div className="d-flex justify-content-between align-items-center mb-3">
          <h1 className="mb-0">Shopping Cart</h1>
          <button className="btn btn-outline-primary" onClick={() => setView('shop')}>
            Continue Shopping
          </button>
        </div>

        {cartItems.length === 0 ? (
          <div className="alert alert-info">Your cart is empty.</div>
        ) : (
          <div className="table-responsive">
            <table className="table table-bordered align-middle">
              <thead className="table-light">
                <tr>
                  <th>Title</th>
                  <th>Price</th>
                  <th style={{ width: '180px' }}>Quantity</th>
                  <th>Subtotal</th>
                </tr>
              </thead>
              <tbody>
                {cartItems.map((item) => (
                  <tr key={item.book.bookID}>
                    <td>{item.book.title}</td>
                    <td>${item.book.price.toFixed(2)}</td>
                    <td>
                      <input
                        type="number"
                        min={0}
                        className="form-control"
                        value={item.quantity}
                        onChange={(e) =>
                          updateQuantity(item.book.bookID, Number(e.target.value))
                        }
                      />
                    </td>
                    <td>${(item.book.price * item.quantity).toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr>
                  <th colSpan={3} className="text-end">
                    Total:
                  </th>
                  <th>${cartSummary.totalPrice.toFixed(2)}</th>
                </tr>
              </tfoot>
            </table>
          </div>
        )}
      </div>
    )
  }

  if (view === 'add') {
    return renderBookForm('add')
  }

  if (view === 'edit') {
    return renderBookForm('edit')
  }

  return (
    <div className="container py-4">
      <div className="row g-4">
        <aside className="col-lg-3">
          <div className="card shadow-sm sticky-panel">
            <div className="card-body">
              <h5 className="card-title">Filters</h5>

              <label htmlFor="category" className="form-label mt-2">
                Category
              </label>
              <select
                id="category"
                className="form-select mb-3"
                value={selectedCategory}
                onChange={(e) => {
                  setSelectedCategory(e.target.value)
                  setPage(1)
                }}
              >
                <option value="All">All</option>
                {categories.map((category) => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </select>

              <label htmlFor="pageSize" className="form-label">
                Results per page
              </label>
              <select
                id="pageSize"
                className="form-select mb-3"
                value={pageSize}
                onChange={(e) => {
                  setPageSize(Number(e.target.value))
                  setPage(1)
                }}
              >
                <option value={5}>5</option>
                <option value={10}>10</option>
                <option value={20}>20</option>
              </select>

              <label htmlFor="sortOrder" className="form-label">
                Sort by title
              </label>
              <select
                id="sortOrder"
                className="form-select"
                value={sort}
                onChange={(e) => {
                  setSort(e.target.value as 'asc' | 'desc')
                  setPage(1)
                }}
              >
                <option value="asc">A -&gt; Z</option>
                <option value="desc">Z -&gt; A</option>
              </select>
            </div>
          </div>

          <div className="card mt-3 border-success-subtle">
            <div className="card-body">
              <h5 className="card-title">Cart Summary</h5>
              <p className="mb-1">Items: {cartSummary.totalItems}</p>
              <p className="mb-3">Total: ${cartSummary.totalPrice.toFixed(2)}</p>

              <div className="d-grid gap-2">
                <button className="btn btn-success" onClick={() => setView('cart')}>
                  Go to Cart
                </button>
                <button
                  className="btn btn-outline-secondary"
                  type="button"
                  data-bs-toggle="offcanvas"
                  data-bs-target="#cartPreview"
                  aria-controls="cartPreview"
                >
                  Quick Cart Preview
                </button>
              </div>
            </div>
          </div>
        </aside>

        <main className="col-lg-9">
          <div className="d-flex justify-content-between align-items-center mb-2">
            <h1 className="mb-0">Online Bookstore Catalog</h1>
            <button className="btn btn-primary" onClick={openAddBookPage}>
              Add New Book
            </button>
          </div>

          {actionMessage && <div className="alert alert-success">{actionMessage}</div>}
          {loading && <div className="alert alert-info">Loading books...</div>}
          {error && <div className="alert alert-danger">{error}</div>}

          {!loading && !error && (
            <>
              <div className="table-responsive">
                <table className="table table-striped table-hover table-bordered align-middle">
                  <thead className="table-dark" data-bs-theme="dark">
                    <tr>
                      <th>Title</th>
                      <th>Author</th>
                      <th>Category</th>
                      <th>Pages</th>
                      <th>Price</th>
                      <th>Cart</th>
                      <th>Edit</th>
                    </tr>
                  </thead>
                  <tbody>
                    {books.map((book) => (
                      <tr key={book.bookID}>
                        <td>
                          <div className="fw-semibold">{book.title}</div>
                          <small className="text-muted">ISBN: {book.isbn}</small>
                        </td>
                        <td>
                          {book.author}
                          <br />
                          <small className="text-muted">{book.publisher}</small>
                        </td>
                        <td>
                          <span className="badge text-bg-light">{book.category}</span>
                          <div className="small text-muted">{book.classification}</div>
                        </td>
                        <td>{book.pageCount}</td>
                        <td>${book.price.toFixed(2)}</td>
                        <td>
                          <button className="btn btn-sm btn-outline-success" onClick={() => addToCart(book)}>
                            Add to Cart
                          </button>
                        </td>
                        <td>
                          <button className="btn btn-sm btn-outline-primary" onClick={() => openEditBookPage(book)}>
                            Edit
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <nav aria-label="Books pagination">
                <ul className="pagination flex-wrap">
                  <li className={`page-item ${page === 1 ? 'disabled' : ''}`}>
                    <button className="page-link" onClick={() => setPage((p) => Math.max(1, p - 1))}>
                      Previous
                    </button>
                  </li>

                  {pageNumbers.map((pageNumber) => (
                    <li
                      key={pageNumber}
                      className={`page-item ${pageNumber === page ? 'active' : ''}`}
                    >
                      <button className="page-link" onClick={() => setPage(pageNumber)}>
                        {pageNumber}
                      </button>
                    </li>
                  ))}

                  <li className={`page-item ${page === totalPages || totalPages === 0 ? 'disabled' : ''}`}>
                    <button
                      className="page-link"
                      onClick={() => setPage((p) => Math.min(totalPages || 1, p + 1))}
                    >
                      Next
                    </button>
                  </li>
                </ul>
              </nav>
            </>
          )}
        </main>
      </div>

      <div
        className="offcanvas offcanvas-end"
        tabIndex={-1}
        id="cartPreview"
        aria-labelledby="cartPreviewLabel"
      >
        <div className="offcanvas-header">
          <h5 id="cartPreviewLabel" className="offcanvas-title">
            Quick Cart Preview
          </h5>
          <button type="button" className="btn-close" data-bs-dismiss="offcanvas" aria-label="Close" />
        </div>
        <div className="offcanvas-body">
          {cartItems.length === 0 ? (
            <p>Your cart is empty.</p>
          ) : (
            <ul className="list-group mb-3">
              {cartItems.map((item) => (
                <li key={item.book.bookID} className="list-group-item d-flex justify-content-between">
                  <span>
                    {item.book.title} <strong>x{item.quantity}</strong>
                  </span>
                  <span>${(item.book.price * item.quantity).toFixed(2)}</span>
                </li>
              ))}
            </ul>
          )}
          <button className="btn btn-success w-100" onClick={() => setView('cart')} data-bs-dismiss="offcanvas">
            Go to Cart
          </button>
        </div>
      </div>
    </div>
  )
}

export default App
