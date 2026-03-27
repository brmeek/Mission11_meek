import { useEffect, useMemo, useState } from 'react'
import './App.css'

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

<<<<<<< HEAD
type CartItem = {
  book: Book
  quantity: number
}

const CART_STORAGE_KEY = 'bookstore_cart'
const BROWSE_STATE_KEY = 'bookstore_browse_state'

function App() {
  const [books, setBooks] = useState<Book[]>([])
  const [categories, setCategories] = useState<string[]>([])
  const [selectedCategory, setSelectedCategory] = useState('All')
=======
function App() {
  const [books, setBooks] = useState<Book[]>([])
>>>>>>> main
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(5)
  const [sort, setSort] = useState<'asc' | 'desc'>('asc')
  const [totalBooks, setTotalBooks] = useState(0)
  const [totalPages, setTotalPages] = useState(0)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
<<<<<<< HEAD
  const [cartItems, setCartItems] = useState<CartItem[]>([])
  const [view, setView] = useState<'shop' | 'cart'>('shop')

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
        const response = await fetch('/api/categories', { signal: controller.signal })
        if (!response.ok) {
          throw new Error('Unable to load categories')
        }

        const data: string[] = await response.json()
        setCategories(data)
      } catch (err) {
        if (err instanceof Error && err.name !== 'AbortError') {
          setError(err.message)
        }
      }
    }

    fetchCategories()
    return () => controller.abort()
  }, [])

  useEffect(() => {
    const controller = new AbortController()

=======

  useEffect(() => {
    const controller = new AbortController()
>>>>>>> main
    const fetchBooks = async () => {
      try {
        setLoading(true)
        setError('')
<<<<<<< HEAD

        const categoryQuery =
          selectedCategory === 'All'
            ? ''
            : `&category=${encodeURIComponent(selectedCategory)}`

        const response = await fetch(
          `/api/books?page=${page}&pageSize=${pageSize}&sort=${sort}${categoryQuery}`,
=======
        const response = await fetch(
          `/api/books?page=${page}&pageSize=${pageSize}&sort=${sort}`,
>>>>>>> main
          { signal: controller.signal },
        )

        if (!response.ok) {
          throw new Error('Unable to load books from API')
        }

        const data: BooksResponse = await response.json()
        setBooks(data.books)
        setTotalBooks(data.totalBooks)
        setTotalPages(data.totalPages)
<<<<<<< HEAD

        if (data.totalPages > 0 && page > data.totalPages) {
          setPage(data.totalPages)
        }
=======
>>>>>>> main
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
<<<<<<< HEAD
  }, [page, pageSize, sort, selectedCategory])

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
                <option value="asc">A → Z</option>
                <option value="desc">Z → A</option>
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
            <span className="badge text-bg-primary rounded-pill">{totalBooks} books</span>
          </div>

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
=======
  }, [page, pageSize, sort])

  const pageNumbers = useMemo(() => {
    return Array.from({ length: totalPages }, (_, i) => i + 1)
  }, [totalPages])

  return (
    <div className="container py-4">
      <h1 className="mb-3">Online Bookstore Catalog</h1>
      <p className="text-muted">
        Showing {books.length} of {totalBooks} books
      </p>

      <div className="row g-3 mb-4 align-items-end">
        <div className="col-sm-6 col-md-3">
          <label htmlFor="pageSize" className="form-label">
            Results per page
          </label>
          <select
            id="pageSize"
            className="form-select"
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
        </div>

        <div className="col-sm-6 col-md-3">
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
            <option value="asc">A → Z</option>
            <option value="desc">Z → A</option>
          </select>
        </div>
      </div>

      {loading && <div className="alert alert-info">Loading books...</div>}
      {error && <div className="alert alert-danger">{error}</div>}

      {!loading && !error && (
        <>
          <div className="table-responsive">
            <table className="table table-striped table-bordered align-middle">
              <thead className="table-dark">
                <tr>
                  <th>Title</th>
                  <th>Author</th>
                  <th>Publisher</th>
                  <th>ISBN</th>
                  <th>Classification</th>
                  <th>Category</th>
                  <th>Pages</th>
                  <th>Price</th>
                </tr>
              </thead>
              <tbody>
                {books.map((book) => (
                  <tr key={book.bookID}>
                    <td>{book.title}</td>
                    <td>{book.author}</td>
                    <td>{book.publisher}</td>
                    <td>{book.isbn}</td>
                    <td>{book.classification}</td>
                    <td>{book.category}</td>
                    <td>{book.pageCount}</td>
                    <td>${book.price.toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <nav aria-label="Books pagination">
            <ul className="pagination flex-wrap">
              <li className={`page-item ${page === 1 ? 'disabled' : ''}`}>
                <button
                  className="page-link"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                >
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

              <li className={`page-item ${page === totalPages ? 'disabled' : ''}`}>
                <button
                  className="page-link"
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                >
                  Next
                </button>
              </li>
            </ul>
          </nav>
        </>
      )}
>>>>>>> main
    </div>
  )
}

export default App
