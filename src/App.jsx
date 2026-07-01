import { useState, useMemo, useEffect, useCallback, useRef } from 'react'
import './App.css'

const CATEGORIES = [
  'Food & Drinks',
  'Transport',
  'Entertainment',
  'Learning',
  'Daily Supplies',
  'Others',
]

const CATEGORY_EMOJI = {
  'Food & Drinks': '\u{1F354}',
  'Transport': '\u{1F698}',
  'Entertainment': '\u{1F3AE}',
  'Learning': '\u{1F4DA}',
  'Daily Supplies': '\u{1F6CD}',
  'Others': '\u{1F4E6}',
}

const CATEGORY_CSS_CLASS = {
  'Food & Drinks': 'cat-food',
  'Transport': 'cat-transport',
  'Entertainment': 'cat-entertainment',
  'Learning': 'cat-learning',
  'Daily Supplies': 'cat-supplies',
  'Others': 'cat-others',
}

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

function LeafIcon() {
  return (
    <svg viewBox="0 0 48 48" aria-hidden="true" focusable="false">
      <path d="M12 36c9.5-6.5 16.5-14.8 21-25" />
      <path d="M22.5 24.5c-6.8.4-10.7-3.2-11-9.7 6.6-.4 10.5 3 11 9.7Z" />
      <path d="M27.8 19.2c-1.1-6.4 1.8-10.5 8-12.2 1.2 6.3-1.5 10.4-8 12.2Z" />
      <path d="M18.3 31.8c-5.4 1.8-9.4-.1-11.9-5.5 5.3-1.9 9.3-.1 11.9 5.5Z" />
      <path d="M27.8 30.5c-5.4-1.2-8.1-4.8-7.9-10.7 5.5 1.1 8.1 4.7 7.9 10.7Z" />
    </svg>
  )
}

function StatIcon({ type }) {
  if (type === 'wallet') {
    return (
      <svg viewBox="0 0 48 48" aria-hidden="true" focusable="false">
        <path d="M10 16.5h24.5A5.5 5.5 0 0 1 40 22v13.5H10A4 4 0 0 1 6 31.5v-11A4 4 0 0 1 10 16.5Z" />
        <path d="M13 16.5 28.5 9l4 7.5" />
        <path d="M31.5 25.5H42v8H31.5a4 4 0 0 1 0-8Z" />
        <path d="M35 29.5h.1" />
      </svg>
    )
  }

  if (type === 'spent') {
    return (
      <svg viewBox="0 0 48 48" aria-hidden="true" focusable="false">
        <circle cx="24" cy="24" r="16" />
        <path d="M24 14v18" />
        <path d="m16.5 25 7.5 7.5 7.5-7.5" />
      </svg>
    )
  }

  if (type === 'calendar') {
    return (
      <svg viewBox="0 0 48 48" aria-hidden="true" focusable="false">
        <rect x="9" y="12" width="30" height="28" rx="4" />
        <path d="M16 8v8" />
        <path d="M32 8v8" />
        <path d="M9 20h30" />
        <path d="M17 27h.1M24 27h.1M31 27h.1M17 34h.1M24 34h.1" />
      </svg>
    )
  }

  return (
    <svg viewBox="0 0 48 48" aria-hidden="true" focusable="false">
      <path d="M24 8v16h16A16 16 0 1 1 24 8Z" />
      <path d="M29 8.8A16 16 0 0 1 39.2 19H29Z" />
    </svg>
  )
}

function todayStr() {
  const date = new Date()
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function currentMonthStr() {
  return todayStr().slice(0, 7)
}

function lastDayOfMonthStr(monthStr) {
  const [year, month] = monthStr.split('-').map(Number)
  const lastDay = new Date(year, month, 0).getDate()
  return `${monthStr}-${String(lastDay).padStart(2, '0')}`
}

function defaultDateForMonth(monthStr) {
  return monthStr === currentMonthStr() ? todayStr() : lastDayOfMonthStr(monthStr)
}

function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 6)
}

function formatDate(dateStr) {
  const [y, m, d] = dateStr.split('-')
  const date = new Date(y, parseInt(m) - 1, d)
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    weekday: 'short',
  })
}

function formatMonthTitle(monthStr) {
  const [y, m] = monthStr.split('-')
  const date = new Date(Number(y), Number(m) - 1, 1)
  return date.toLocaleDateString('en-US', {
    month: 'long',
    year: 'numeric',
  })
}

function formatMonthButton(monthStr) {
  const [y, m] = monthStr.split('-')
  const date = new Date(Number(y), Number(m) - 1, 1)
  return date.toLocaleDateString('en-US', {
    month: 'short',
    year: 'numeric',
  })
}

function formatDateInputLabel(dateStr) {
  const [y, m, d] = dateStr.split('-')
  const date = new Date(Number(y), Number(m) - 1, Number(d))
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

function buildMonthCalendar(monthStr) {
  const [year, month] = monthStr.split('-').map(Number)
  const firstDay = new Date(year, month - 1, 1)
  const daysInMonth = new Date(year, month, 0).getDate()
  const leadingDays = firstDay.getDay()
  const cells = []

  for (let i = 0; i < leadingDays; i += 1) {
    cells.push(null)
  }

  for (let day = 1; day <= daysInMonth; day += 1) {
    cells.push(`${monthStr}-${String(day).padStart(2, '0')}`)
  }

  while (cells.length % 7 !== 0) {
    cells.push(null)
  }

  return cells
}

function EnglishDatePicker({ value, month, onChange }) {
  const [open, setOpen] = useState(false)
  const pickerRef = useRef(null)
  const calendarDays = useMemo(() => buildMonthCalendar(month), [month])

  useEffect(() => {
    if (!open) return

    const handlePointerDown = (event) => {
      if (!pickerRef.current?.contains(event.target)) {
        setOpen(false)
      }
    }

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        setOpen(false)
      }
    }

    document.addEventListener('pointerdown', handlePointerDown)
    document.addEventListener('keydown', handleKeyDown)

    return () => {
      document.removeEventListener('pointerdown', handlePointerDown)
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [open])

  return (
    <div className="date-picker" ref={pickerRef}>
      <button
        type="button"
        className="date-picker-button"
        onClick={() => setOpen(current => !current)}
        aria-haspopup="dialog"
        aria-expanded={open}
      >
        <span>{formatDateInputLabel(value)}</span>
        <span className="date-picker-icon" aria-hidden="true">
          <StatIcon type="calendar" />
        </span>
      </button>
      {open && (
        <div className="date-picker-panel" role="dialog" aria-label="Choose date">
          <div className="date-picker-header">{formatMonthTitle(month)}</div>
          <div className="date-picker-weekdays">
            {WEEKDAYS.map(day => (
              <span key={day}>{day}</span>
            ))}
          </div>
          <div className="date-picker-grid">
            {calendarDays.map((day, index) => (
              day ? (
                <button
                  key={day}
                  type="button"
                  className={'date-picker-day' + (value === day ? ' selected' : '')}
                  onClick={() => {
                    onChange(day)
                    setOpen(false)
                  }}
                >
                  {Number(day.slice(-2))}
                </button>
              ) : (
                <span key={`empty-${index}`} className="date-picker-empty" />
              )
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

function loadJSON(key, fallback) {
  try {
    const raw = localStorage.getItem(key)
    return raw ? JSON.parse(raw) : fallback
  } catch {
    return fallback
  }
}

function saveJSON(key, value) {
  localStorage.setItem(key, JSON.stringify(value))
}

function downloadFile(filename, content, mime) {
  const blob = new Blob([content], { type: mime })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}

function exportJSON(expenses, budgetMap) {
  const data = JSON.stringify({ expenses, budget: budgetMap }, null, 2)
  downloadFile('expense-tracker-backup.json', data, 'application/json')
}

function exportCSV(expenses) {
  const header = 'Date,Name,Category,Amount'
  const rows = expenses.map(e =>
    `${e.date},"${e.name}","${e.category}",${e.amount}`
  )
  const csv = [header, ...rows].join('\n')
  downloadFile('expense-tracker-data.csv', csv, 'text/csv;charset=utf-8')
}

export default function App() {
  const [expenses, setExpenses] = useState(() => loadJSON('expenses', []))
  const [budgetMap, setBudgetMap] = useState(() => loadJSON('budget', {}))
  const [selectedMonth, setSelectedMonth] = useState(() => currentMonthStr())
  const [budgetInput, setBudgetInput] = useState('')
  const fileInputRef = useRef(null)
  const headerActionsRef = useRef(null)

  const [name, setName] = useState('')
  const [amount, setAmount] = useState('')
  const [category, setCategory] = useState(CATEGORIES[0])
  const [date, setDate] = useState(todayStr())
  const [backupMenuOpen, setBackupMenuOpen] = useState(false)
  const [historyMenuOpen, setHistoryMenuOpen] = useState(false)
  const [pendingDeleteExpense, setPendingDeleteExpense] = useState(null)

  const currentMonth = currentMonthStr()
  const month = selectedMonth
  const today = todayStr()
  const isCurrentMonth = month === currentMonth

  useEffect(() => { saveJSON('expenses', expenses) }, [expenses])
  useEffect(() => { saveJSON('budget', budgetMap) }, [budgetMap])

  useEffect(() => {
    setBudgetInput(
      Object.prototype.hasOwnProperty.call(budgetMap, month)
        ? String(budgetMap[month])
        : ''
    )
  }, [budgetMap, month])

  useEffect(() => {
    if (!backupMenuOpen && !historyMenuOpen) return

    const handlePointerDown = (event) => {
      if (!headerActionsRef.current?.contains(event.target)) {
        setBackupMenuOpen(false)
        setHistoryMenuOpen(false)
      }
    }

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        setBackupMenuOpen(false)
        setHistoryMenuOpen(false)
      }
    }

    document.addEventListener('pointerdown', handlePointerDown)
    document.addEventListener('keydown', handleKeyDown)

    return () => {
      document.removeEventListener('pointerdown', handlePointerDown)
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [backupMenuOpen, historyMenuOpen])

  useEffect(() => {
    if (!pendingDeleteExpense) return

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        setPendingDeleteExpense(null)
      }
    }

    document.addEventListener('keydown', handleKeyDown)

    return () => {
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [pendingDeleteExpense])

  const availableMonths = useMemo(() => {
    const months = new Set()
    for (const expense of expenses) {
      if (/^\d{4}-\d{2}-\d{2}$/.test(expense.date)) {
        months.add(expense.date.slice(0, 7))
      }
    }
    for (const budgetMonth of Object.keys(budgetMap)) {
      if (/^\d{4}-\d{2}$/.test(budgetMonth)) {
        months.add(budgetMonth)
      }
    }
    return Array.from(months).sort((a, b) => b.localeCompare(a))
  }, [expenses, budgetMap])

  const monthSummaries = useMemo(() => {
    const summaries = {}
    for (const availableMonth of availableMonths) {
      summaries[availableMonth] = {
        records: 0,
        total: 0,
      }
    }
    for (const expense of expenses) {
      if (!/^\d{4}-\d{2}-\d{2}$/.test(expense.date)) continue
      const expenseMonth = expense.date.slice(0, 7)
      if (!summaries[expenseMonth]) {
        summaries[expenseMonth] = { records: 0, total: 0 }
      }
      summaries[expenseMonth].records += 1
      summaries[expenseMonth].total += expense.amount
    }
    return summaries
  }, [availableMonths, expenses])

  const { monthlyTotal, dayTotal } = useMemo(() => {
    const monthExpenses = expenses.filter(e => e.date.startsWith(month + '-'))
    const monthlyTotal = monthExpenses.reduce((sum, e) => sum + e.amount, 0)
    const dayTotal = expenses
      .filter(e => e.date === date)
      .reduce((sum, e) => sum + e.amount, 0)
    return { monthlyTotal, dayTotal }
  }, [expenses, month, date])

  const dateGroups = useMemo(() => {
    const monthExpenses = expenses.filter(e => e.date.startsWith(month + '-'))
    const map = {}
    for (const e of monthExpenses) {
      if (!map[e.date]) map[e.date] = { total: 0, items: [] }
      map[e.date].total += e.amount
      map[e.date].items.push(e)
    }
    for (const key of Object.keys(map)) {
      map[key].items.sort((a, b) => b.id.localeCompare(a.id))
    }
    return Object.entries(map).sort((a, b) => b[0].localeCompare(a[0]))
  }, [expenses, month])

  const currentBudget = budgetMap[month] || 0
  const remaining = currentBudget - monthlyTotal
  const totalRecords = dateGroups.reduce((sum, [, g]) => sum + g.items.length, 0)
  const budgetPercent = currentBudget > 0 ? Math.min((monthlyTotal / currentBudget) * 100, 100) : 0
  const expenseListTitle = isCurrentMonth
    ? `This Month (${totalRecords} records)`
    : `${formatMonthTitle(month)} (${totalRecords} records)`
  const dayCardLabel = date === today ? 'Today' : 'Selected Day'

  const handleSetBudget = useCallback(() => {
    const val = parseFloat(budgetInput)
    if (isNaN(val) || val < 0) return
    setBudgetMap(prev => ({ ...prev, [month]: val }))
  }, [budgetInput, month])

  const handleAdd = useCallback((e) => {
    e.preventDefault()
    const trimmedName = name.trim()
    const parsedAmount = parseFloat(amount)
    if (!trimmedName || isNaN(parsedAmount) || parsedAmount <= 0) return

    setExpenses(prev => [...prev, {
      id: generateId(),
      name: trimmedName,
      amount: parsedAmount,
      category,
      date,
    }])
    setName('')
    setAmount('')
    setCategory(CATEGORIES[0])
  }, [name, amount, category, date])

  const handleDelete = useCallback((id) => {
    setExpenses(prev => prev.filter(e => e.id !== id))
  }, [])

  const handleRequestDelete = useCallback((expense) => {
    setBackupMenuOpen(false)
    setPendingDeleteExpense(expense)
  }, [])

  const handleCancelDelete = useCallback(() => {
    setPendingDeleteExpense(null)
  }, [])

  const handleConfirmDelete = useCallback(() => {
    if (!pendingDeleteExpense) return
    handleDelete(pendingDeleteExpense.id)
    setPendingDeleteExpense(null)
  }, [handleDelete, pendingDeleteExpense])

  const handleImport = useCallback(() => {
    const file = fileInputRef.current?.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target.result)
        if (Array.isArray(data.expenses) && data.budget && typeof data.budget === 'object') {
          setExpenses(data.expenses)
          setBudgetMap(data.budget)
          alert(`Imported ${data.expenses.length} expenses successfully!`)
        } else {
          alert('Invalid backup file: missing expenses or budget data.')
        }
      } catch {
        alert('Failed to parse file. Please select a valid JSON backup.')
      }
    }
    reader.readAsText(file)
    fileInputRef.current.value = ''
  }, [])

  const handleExportJSON = useCallback(() => {
    exportJSON(expenses, budgetMap)
    setBackupMenuOpen(false)
  }, [expenses, budgetMap])

  const handleExportCSV = useCallback(() => {
    exportCSV(expenses)
    setBackupMenuOpen(false)
  }, [expenses])

  const handleSelectImport = useCallback(() => {
    setBackupMenuOpen(false)
    fileInputRef.current?.click()
  }, [])

  const handleToggleBackupMenu = useCallback(() => {
    setBackupMenuOpen(open => !open)
    setHistoryMenuOpen(false)
  }, [])

  const handleToggleHistoryMenu = useCallback(() => {
    setHistoryMenuOpen(open => !open)
    setBackupMenuOpen(false)
  }, [])

  const handleSelectMonth = useCallback((nextMonth) => {
    setSelectedMonth(nextMonth)
    setHistoryMenuOpen(false)
    setBackupMenuOpen(false)
    setDate(prev => (
      prev.startsWith(nextMonth + '-') ? prev : defaultDateForMonth(nextMonth)
    ))
  }, [])

  const handleGoToCurrentMonth = useCallback(() => {
    handleSelectMonth(currentMonthStr())
  }, [handleSelectMonth])

  const progressColor =
    budgetPercent >= 90 ? 'linear-gradient(90deg, #d78372 0%, #bd5e55 100%)' :
    budgetPercent >= 70 ? 'linear-gradient(90deg, #d8b66f 0%, #b98d3d 100%)' :
    'linear-gradient(90deg, #86a982 0%, #3f7852 100%)'

  return (
    <div className="app">
      <div className="header">
        <div className="header-brand">
          <div className="leaf-badge">
            <LeafIcon />
          </div>
          <div className="header-title">Expense Tracker</div>
        </div>
        <div className="header-actions" ref={headerActionsRef}>
          <button
            type="button"
            className="more-btn"
            onClick={handleToggleBackupMenu}
            aria-haspopup="menu"
            aria-expanded={backupMenuOpen}
            aria-label="Open backup menu"
          >
            ...
          </button>
          {historyMenuOpen && (
            <div className="history-menu" role="menu" aria-label="History months">
              <div className="history-menu-title">History</div>
              {availableMonths.length === 0 && (
                <div className="history-menu-empty">No history yet</div>
              )}
              {availableMonths.map(availableMonth => {
                const summary = monthSummaries[availableMonth] || { records: 0, total: 0 }
                return (
                  <button
                    key={availableMonth}
                    type="button"
                    className={'history-menu-item' + (month === availableMonth ? ' selected' : '')}
                    onClick={() => handleSelectMonth(availableMonth)}
                    role="menuitem"
                  >
                    <span className="history-month-name">{formatMonthButton(availableMonth)}</span>
                    <span className="history-month-meta">
                      {summary.records} records - ${summary.total.toLocaleString()}
                    </span>
                  </button>
                )
              })}
            </div>
          )}
          {backupMenuOpen && (
            <div className="backup-menu" role="menu" aria-label="Menu">
              <div className="backup-menu-title">Menu</div>
              <button type="button" className="backup-menu-item" onClick={handleToggleHistoryMenu} role="menuitem">
                History
              </button>
              <button type="button" className="backup-menu-item" onClick={handleExportJSON} role="menuitem">
                Export JSON
              </button>
              <button type="button" className="backup-menu-item" onClick={handleExportCSV} role="menuitem">
                Export CSV
              </button>
              <button type="button" className="backup-menu-item" onClick={handleSelectImport} role="menuitem">
                Import JSON
              </button>
            </div>
          )}
        </div>
      </div>
      <input
        type="file"
        accept=".json"
        ref={fileInputRef}
        onChange={handleImport}
        style={{ display: 'none' }}
      />

      {/* Summary Cards */}
      <div className="summary">
        <div className="summary-card stat-budget">
          <div className="summary-card-top">
            <div className="stat-icon"><StatIcon type="wallet" /></div>
            <div className="label">Monthly Budget</div>
          </div>
          <div className="value">${currentBudget.toLocaleString()}</div>
        </div>
        <div className="summary-card stat-spent">
          <div className="summary-card-top">
            <div className="stat-icon"><StatIcon type="spent" /></div>
            <div className="label">Spent</div>
          </div>
          <div className="value">${monthlyTotal.toLocaleString()}</div>
        </div>
        <div className="summary-card stat-today">
          <div className="summary-card-top">
            <div className="stat-icon"><StatIcon type="calendar" /></div>
            <div className="label">{dayCardLabel}</div>
          </div>
          <div className="value">${dayTotal.toLocaleString()}</div>
        </div>
        <div className="summary-card stat-remaining">
          <div className="summary-card-top">
            <div className="stat-icon"><StatIcon type="remaining" /></div>
            <div className="label">Remaining</div>
          </div>
          <div className={'value ' + (remaining >= 0 ? 'safe' : 'danger')}>
            ${remaining.toLocaleString()}
          </div>
        </div>
      </div>

      {/* Budget Progress Bar */}
      {currentBudget > 0 && (
        <div className="budget-progress">
          <div className="progress-header">
            <span className="progress-label">Budget Used</span>
            <span className="progress-percent">{Math.round(budgetPercent)}%</span>
          </div>
          <div className="progress-track">
            <div
              className="progress-fill"
              style={{ width: `${budgetPercent}%`, background: progressColor }}
            />
          </div>
          <div className="progress-sub">
            ${monthlyTotal.toLocaleString()} of ${currentBudget.toLocaleString()}
            {remaining >= 0
              ? ` - $${remaining.toLocaleString()} left`
              : ` - $${Math.abs(remaining).toLocaleString()} over`
            }
          </div>
        </div>
      )}

      {/* Budget Setting */}
      <div className="budget-bar">
        <input
          type="number"
          placeholder="Set monthly budget"
          value={budgetInput}
          onChange={e => setBudgetInput(e.target.value)}
          inputMode="numeric"
        />
        <button onClick={handleSetBudget}>Set Budget</button>
      </div>

      {/* Add Form */}
      <form className="add-form" onSubmit={handleAdd}>
        <div className="form-row">
          <input
            type="text"
            placeholder="Name, e.g. Lunch"
            value={name}
            onChange={e => setName(e.target.value)}
          />
          <input
            type="number"
            placeholder="Amount"
            value={amount}
            onChange={e => setAmount(e.target.value)}
            inputMode="decimal"
          />
        </div>

        {/* Category Pills */}
        <div className="category-pills">
          <span className="form-label">Category</span>
          <div className="pills-row">
            {CATEGORIES.map(c => (
              <button
                key={c}
                type="button"
                className={'category-pill' + (category === c ? ' selected' : '')}
                onClick={() => setCategory(c)}
              >
                {CATEGORY_EMOJI[c]} {c}
              </button>
            ))}
          </div>
        </div>

        <div className="form-row">
          <EnglishDatePicker
            value={date}
            month={month}
            onChange={setDate}
          />
        </div>
        <button type="submit" className="add-btn">Add Expense</button>
      </form>

      {/* Expense List */}
      <div className="divider month-divider">
        <span>{expenseListTitle}</span>
        {!isCurrentMonth && (
          <button type="button" className="current-month-link" onClick={handleGoToCurrentMonth}>
            This Month
          </button>
        )}
      </div>

      <div className="expense-list">
        {dateGroups.length === 0 && (
          <div className="empty">
            <div className="empty-icon">{'\u{1F4B0}'}</div>
            <div className="empty-title">No expenses this month</div>
            <div className="empty-sub">Add your first expense above</div>
          </div>
        )}
        {dateGroups.map(([dateStr, group]) => (
          <div key={dateStr} className="date-group">
            <div className="date-group-header">
              <span className="date-label">{formatDate(dateStr)}</span>
              <span className="date-total">${group.total.toLocaleString()}</span>
            </div>
            {group.items.map(e => (
              <div key={e.id} className={'expense-item ' + (CATEGORY_CSS_CLASS[e.category] || 'cat-others')}>
                <div className="expense-emoji">{CATEGORY_EMOJI[e.category] || '\u{1F4E6}'}</div>
                <div className="expense-info">
                  <div className="name">{e.name}</div>
                  <div className="category">{e.category}</div>
                </div>
                <div className="expense-amount">-${e.amount.toLocaleString()}</div>
                <button
                  type="button"
                  className="expense-delete"
                  onClick={() => handleRequestDelete(e)}
                  title="Delete"
                  aria-label={`Delete ${e.name}`}
                >
                  X
                </button>
              </div>
            ))}
          </div>
        ))}
      </div>

      {pendingDeleteExpense && (
        <div className="delete-confirm-overlay" onClick={handleCancelDelete}>
          <div
            className="delete-confirm-panel"
            role="dialog"
            aria-modal="true"
            aria-labelledby="delete-confirm-title"
            onClick={e => e.stopPropagation()}
          >
            <div className="delete-confirm-kicker">Confirm delete</div>
            <div className="delete-confirm-title" id="delete-confirm-title">
              Delete expense?
            </div>
            <div className="delete-confirm-expense">
              <div className="delete-confirm-name">{pendingDeleteExpense.name}</div>
              <div className="delete-confirm-amount">
                -${pendingDeleteExpense.amount.toLocaleString()}
              </div>
            </div>
            <div className="delete-confirm-actions">
              <button
                type="button"
                className="delete-confirm-cancel"
                onClick={handleCancelDelete}
              >
                Cancel
              </button>
              <button
                type="button"
                className="delete-confirm-delete"
                onClick={handleConfirmDelete}
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
