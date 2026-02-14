// Paper Trading Engine - localStorage backed
// Migrate to server + user accounts when auth is ready

export interface PaperTrade {
  id: string
  strategy: string
  strategyName: string
  symbol: string
  direction: 'long' | 'short' // selling options = short
  optionType: 'call' | 'put' | 'spread'
  strikePrice: number
  strikePrice2?: number // for spreads
  contracts: number
  shares: number // contracts * 100
  entryPrice: number // stock price at entry
  premium: number // per share
  totalPremium: number // premium * shares
  expirationDate: string
  iv: number
  openedAt: string // ISO timestamp
  closedAt?: string
  closePrice?: number // stock price at close
  closePremium?: number // premium at close
  pnl?: number
  pnlPercent?: number
  status: 'open' | 'closed' | 'expired'
  notes?: string
}

export interface PaperAccount {
  balance: number // starting cash
  startingBalance: number
  trades: PaperTrade[]
  createdAt: string
}

const STORAGE_KEY = 'btcintelvault_paper_trading'

function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8)
}

export function getAccount(): PaperAccount {
  if (typeof window === 'undefined') {
    return { balance: 100000, startingBalance: 100000, trades: [], createdAt: new Date().toISOString() }
  }
  const raw = localStorage.getItem(STORAGE_KEY)
  if (!raw) {
    const account: PaperAccount = {
      balance: 100000,
      startingBalance: 100000,
      trades: [],
      createdAt: new Date().toISOString(),
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(account))
    return account
  }
  return JSON.parse(raw)
}

function saveAccount(account: PaperAccount) {
  if (typeof window !== 'undefined') {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(account))
  }
}

export function placeTrade(trade: Omit<PaperTrade, 'id' | 'openedAt' | 'status'>): PaperTrade {
  const account = getAccount()
  const newTrade: PaperTrade = {
    ...trade,
    id: generateId(),
    openedAt: new Date().toISOString(),
    status: 'open',
  }

  // Debit or credit the account
  if (trade.direction === 'short') {
    // Selling options: credit premium
    account.balance += trade.totalPremium
  } else {
    // Buying options: debit premium
    account.balance -= trade.totalPremium
  }

  // For covered calls: also need to "own" the shares (debit share cost)
  if (trade.strategy === 'covered_call') {
    account.balance -= trade.entryPrice * trade.shares
  }
  // For CSPs: reserve cash for potential assignment
  if (trade.strategy === 'cash_secured_put') {
    account.balance -= trade.strikePrice * trade.shares
  }

  account.trades.push(newTrade)
  saveAccount(account)
  return newTrade
}

export function closeTrade(tradeId: string, closePrice: number, closePremium: number): PaperTrade | null {
  const account = getAccount()
  const trade = account.trades.find(t => t.id === tradeId)
  if (!trade || trade.status !== 'open') return null

  trade.status = 'closed'
  trade.closedAt = new Date().toISOString()
  trade.closePrice = closePrice
  trade.closePremium = closePremium

  // Calculate P&L based on strategy
  if (trade.strategy === 'covered_call') {
    const stockPnl = (closePrice - trade.entryPrice) * trade.shares
    const callPayout = Math.max(0, closePrice - trade.strikePrice) * trade.shares
    trade.pnl = stockPnl - callPayout + trade.totalPremium
    // Return share value + any remaining
    account.balance += closePrice * trade.shares
    if (closePrice >= trade.strikePrice) {
      // Assigned: shares sold at strike
      account.balance += (trade.strikePrice - closePrice) * trade.shares
    }
  } else if (trade.strategy === 'cash_secured_put') {
    const putPayout = Math.max(0, trade.strikePrice - closePrice) * trade.shares
    trade.pnl = trade.totalPremium - putPayout
    // Release reserved cash
    account.balance += trade.strikePrice * trade.shares
    if (closePrice < trade.strikePrice) {
      // Assigned: bought shares at strike, now worth closePrice
      account.balance -= (trade.strikePrice - closePrice) * trade.shares
    }
  } else if (trade.strategy === 'protective_put') {
    const stockPnl = (closePrice - trade.entryPrice) * trade.shares
    const putPayout = Math.max(0, trade.strikePrice - closePrice) * trade.shares
    trade.pnl = stockPnl + putPayout - trade.totalPremium
    account.balance += trade.pnl
  } else if (trade.strategy === 'bull_call_spread') {
    const longCall = Math.max(0, closePrice - trade.strikePrice)
    const shortCall = Math.max(0, closePrice - (trade.strikePrice2 || trade.strikePrice + 20))
    trade.pnl = (longCall - shortCall - trade.premium) * trade.shares
    account.balance += trade.pnl + trade.totalPremium // return debit + pnl
  } else if (trade.strategy === 'bear_put_spread') {
    const longPut = Math.max(0, trade.strikePrice - closePrice)
    const shortPut = Math.max(0, (trade.strikePrice2 || trade.strikePrice - 20) - closePrice)
    trade.pnl = (longPut - shortPut - trade.premium) * trade.shares
    account.balance += trade.pnl + trade.totalPremium
  }

  trade.pnlPercent = trade.totalPremium > 0 ? (trade.pnl! / trade.totalPremium) * 100 : 0

  saveAccount(account)
  return trade
}

export function deleteTrade(tradeId: string) {
  const account = getAccount()
  account.trades = account.trades.filter(t => t.id !== tradeId)
  saveAccount(account)
}

export function resetAccount() {
  const account: PaperAccount = {
    balance: 100000,
    startingBalance: 100000,
    trades: [],
    createdAt: new Date().toISOString(),
  }
  saveAccount(account)
  return account
}

export function getOpenTrades(): PaperTrade[] {
  return getAccount().trades.filter(t => t.status === 'open')
}

export function getClosedTrades(): PaperTrade[] {
  return getAccount().trades.filter(t => t.status !== 'open')
}

export function getStats() {
  const account = getAccount()
  const closed = account.trades.filter(t => t.status !== 'open')
  const open = account.trades.filter(t => t.status === 'open')
  const wins = closed.filter(t => (t.pnl || 0) > 0)
  const losses = closed.filter(t => (t.pnl || 0) <= 0)
  const totalPnl = closed.reduce((s, t) => s + (t.pnl || 0), 0)
  const avgWin = wins.length > 0 ? wins.reduce((s, t) => s + (t.pnl || 0), 0) / wins.length : 0
  const avgLoss = losses.length > 0 ? losses.reduce((s, t) => s + (t.pnl || 0), 0) / losses.length : 0

  return {
    balance: account.balance,
    startingBalance: account.startingBalance,
    totalReturn: ((account.balance - account.startingBalance) / account.startingBalance) * 100,
    totalPnl,
    totalTrades: closed.length,
    openTrades: open.length,
    winRate: closed.length > 0 ? (wins.length / closed.length) * 100 : 0,
    wins: wins.length,
    losses: losses.length,
    avgWin,
    avgLoss,
    profitFactor: avgLoss !== 0 ? Math.abs(avgWin / avgLoss) : 0,
  }
}
