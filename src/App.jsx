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

function todayStr() {
  return new Date().toISOString().slice(0, 10)
}

function currentMonthStr() {
  return todayStr().slice(0, 7)
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
  const [budgetInput, setBudgetInput] = useState('')
  const fileInputRef = useRef(null)
  const backupMenuRef = useRef(null)

  const [name, setName] = useState('')
  const [amount, setAmount] = useState('')
  const [category, setCategory] = useState(CATEGORIES[0])
  const [date, setDate] = useState(todayStr())
  const [backupMenuOpen, setBackupMenuOpen] = useState(false)

  const month = currentMonthStr()
  const today = todayStr()

  useEffect(() => { saveJSON('expenses', expenses) }, [expenses])
  useEffect(() => { saveJSON('budget', budgetMap) }, [budgetMap])

  useEffect(() => {
    if (budgetMap[month]) {
      setBudgetInput(String(budgetMap[month]))
    }
  }, [month]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!backupMenuOpen) return

    const handlePointerDown = (event) => {
      if (!backupMenuRef.current?.contains(event.target)) {
        setBackupMenuOpen(false)
      }
    }

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        setBackupMenuOpen(false)
      }
    }

    document.addEventListener('pointerdown', handlePointerDown)
    document.addEventListener('keydown', handleKeyDown)

    return () => {
      document.removeEventListener('pointerdown', handlePointerDown)
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [backupMenuOpen])

  const { monthlyTotal, todayTotal } = useMemo(() => {
    const monthExpenses = expenses.filter(e => e.date.startsWith(month + '-'))
    const monthlyTotal = monthExpenses.reduce((sum, e) => sum + e.amount, 0)
    const todayTotal = expenses
      .filter(e => e.date === today)
      .reduce((sum, e) => sum + e.amount, 0)
    return { monthlyTotal, todayTotal }
  }, [expenses, month, today])

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
    setDate(todayStr())
  }, [name, amount, category, date])

  const handleDelete = useCallback((id) => {
    setExpenses(prev => prev.filter(e => e.id !== id))
  }, [])

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

  const progressColor =
    budgetPercent >= 90 ? '#ef4444' :
    budgetPercent >= 70 ? '#f59e0b' :
    '#22c55e'

  return (
    <div className="app">
      <div className="header">
        <div className="header-title">Expense Tracker</div>
        <div className="header-actions" ref={backupMenuRef}>
          <button
            type="button"
            className="more-btn"
            onClick={() => setBackupMenuOpen(open => !open)}
            aria-haspopup="menu"
            aria-expanded={backupMenuOpen}
            aria-label="Open backup menu"
          >
            More
          </button>
          {backupMenuOpen && (
            <div className="backup-menu" role="menu" aria-label="Backup">
              <div className="backup-menu-title">Backup</div>
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
        <div className="summary-card">
          <div className="label">Monthly Budget</div>
          <div className="value">${currentBudget.toLocaleString()}</div>
        </div>
        <div className="summary-card">
          <div className="label">Spent</div>
          <div className="value">${monthlyTotal.toLocaleString()}</div>
        </div>
        <div className="summary-card">
          <div className="label">Today</div>
          <div className="value">${todayTotal.toLocaleString()}</div>
        </div>
        <div className="summary-card">
          <div className="label">Remaining</div>
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
              ? ` • $${remaining.toLocaleString()} left`
              : ` • $${Math.abs(remaining).toLocaleString()} over`
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
            style={{ maxWidth: 130 }}
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
          <input
            type="date"
            value={date}
            onChange={e => setDate(e.target.value)}
            style={{ maxWidth: 170 }}
          />
        </div>
        <button type="submit" className="add-btn">Add Expense</button>
      </form>

      {/* Expense List */}
      <div className="divider">
        This Month ({totalRecords} records)
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
                  className="expense-delete"
                  onClick={() => handleDelete(e.id)}
                  title="Delete"
                >
                  {'✕'}
                </button>
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  )
}
