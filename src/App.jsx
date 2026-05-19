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

  const [name, setName] = useState('')
  const [amount, setAmount] = useState('')
  const [category, setCategory] = useState(CATEGORIES[0])
  const [date, setDate] = useState(todayStr())

  const month = currentMonthStr()
  const today = todayStr()

  useEffect(() => { saveJSON('expenses', expenses) }, [expenses])
  useEffect(() => { saveJSON('budget', budgetMap) }, [budgetMap])

  useEffect(() => {
    if (budgetMap[month]) {
      setBudgetInput(String(budgetMap[month]))
    }
  }, [month]) // eslint-disable-line react-hooks/exhaustive-deps

  const { monthlyTotal, todayTotal } = useMemo(() => {
    const monthExpenses = expenses.filter(e => e.date.startsWith(month + '-'))
    const monthlyTotal = monthExpenses.reduce((sum, e) => sum + e.amount, 0)
    const todayTotal = expenses
      .filter(e => e.date === today)
      .reduce((sum, e) => sum + e.amount, 0)
    return { monthlyTotal, todayTotal }
  }, [expenses, month, today])

  // Group by date, sorted newest first
  const dateGroups = useMemo(() => {
    const monthExpenses = expenses.filter(e => e.date.startsWith(month + '-'))
    const map = {}
    for (const e of monthExpenses) {
      if (!map[e.date]) map[e.date] = { total: 0, items: [] }
      map[e.date].total += e.amount
      map[e.date].items.push(e)
    }
    // Sort items within each date group by id descending
    for (const key of Object.keys(map)) {
      map[key].items.sort((a, b) => b.id.localeCompare(a.id))
    }
    // Return entries sorted by date descending
    return Object.entries(map).sort((a, b) => b[0].localeCompare(a[0]))
  }, [expenses, month])

  const currentBudget = budgetMap[month] || 0
  const remaining = currentBudget - monthlyTotal
  const totalRecords = dateGroups.reduce((sum, [, g]) => sum + g.items.length, 0)

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

  return (
    <div className="app">
      <div className="header">Expense Tracker</div>

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

      {/* Export / Import */}
      <div className="toolbar">
        <button className="tool-btn" onClick={() => exportJSON(expenses, budgetMap)}>
          Export JSON
        </button>
        <button className="tool-btn" onClick={() => exportCSV(expenses)}>
          Export CSV
        </button>
        <input
          type="file"
          accept=".json"
          ref={fileInputRef}
          onChange={handleImport}
          style={{ display: 'none' }}
        />
        <button className="tool-btn" onClick={() => fileInputRef.current?.click()}>
          Import JSON
        </button>
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
            style={{ maxWidth: 120 }}
          />
        </div>
        <div className="form-row">
          <select value={category} onChange={e => setCategory(e.target.value)}>
            {CATEGORIES.map(c => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
          <input
            type="date"
            value={date}
            onChange={e => setDate(e.target.value)}
            style={{ maxWidth: 160 }}
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
          <div className="empty">No expenses yet. Start tracking!</div>
        )}
        {dateGroups.map(([dateStr, group]) => (
          <div key={dateStr} className="date-group">
            <div className="date-group-header">
              <span className="date-label">{formatDate(dateStr)}</span>
              <span className="date-total">${group.total.toLocaleString()}</span>
            </div>
            {group.items.map(e => (
              <div key={e.id} className="expense-item">
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
                  &#x2715;
                </button>
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  )
}
