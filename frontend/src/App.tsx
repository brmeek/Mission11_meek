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

function App() {
  const [books, setBooks] = useState<Book[]>([])
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(5)
  const [sort, setSort] = useState<'asc' | 'desc'>('asc')
  const [totalBooks, setTotalBooks] = useState(0)
  const [totalPages, setTotalPages] = useState(0)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    const controller = new AbortController()
    const fetchBooks = async () => {
      try {
        setLoading(true)
        setError('')
        const response = await fetch(
          `/api/books?page=${page}&pageSize=${pageSize}&sort=${sort}`,
          { signal: controller.signal },
        )

        if (!response.ok) {
          throw new Error('Unable to load books from API')
        }

        const data: BooksResponse = await response.json()
        setBooks(data.books)
        setTotalBooks(data.totalBooks)
        setTotalPages(data.totalPages)
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
    </div>
  )
}

export default App
