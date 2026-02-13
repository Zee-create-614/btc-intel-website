'use client'

import { useState, useEffect } from 'react'
import { TrendingUp, TrendingDown, Search, Filter } from 'lucide-react'
import { getTreasuryHoldings, getBTCPrice, formatCurrency, formatNumber, formatPercent, type TreasuryHolding, type BTCPriceData } from '../lib/data'

type SortField = 'entity_name' | 'btc_holdings' | 'market_value' | 'unrealized_pnl' | 'avg_cost_basis'
type SortDirection = 'asc' | 'desc'
type FilterType = 'all' | 'company' | 'etf' | 'country'

export default function TreasuriesPage() {
  const [holdings, setHoldings] = useState<TreasuryHolding[]>([])
  const [btcPrice, setBtcPrice] = useState<BTCPriceData | null>(null)
  const [loading, setLoading] = useState(true)
  const [sortField, setSortField] = useState<SortField>('btc_holdings')
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc')
  const [filter, setFilter] = useState<FilterType>('all')
  const [searchTerm, setSearchTerm] = useState('')

  useEffect(() => {
    async function fetchData() {
      try {
        const [holdingsData, priceData] = await Promise.all([
          getTreasuryHoldings(),
          getBTCPrice()
        ])
        
        // Calculate current values based on latest BTC price
        const updatedHoldings = holdingsData.map(holding => ({
          ...holding,
          market_value: holding.btc_holdings * priceData.price_usd,
          unrealized_pnl: holding.avg_cost_basis 
            ? (holding.btc_holdings * priceData.price_usd) - (holding.btc_holdings * holding.avg_cost_basis)
            : 0
        }))
        
        setHoldings(updatedHoldings)
        setBtcPrice(priceData)
      } catch (error) {
        console.error('Error fetching data:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  const handleSort = (field: SortField) => {
    if (field === sortField) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
    } else {
      setSortField(field)
      setSortDirection('desc')
    }
  }

  const filteredAndSortedHoldings = holdings
    .filter(holding => {
      if (filter !== 'all' && holding.entity_type !== filter) return false
      if (searchTerm && !holding.entity_name.toLowerCase().includes(searchTerm.toLowerCase())) return false
      return true
    })
    .sort((a, b) => {
      let aValue: number | string = a[sortField] || 0
      let bValue: number | string = b[sortField] || 0
      
      if (typeof aValue === 'string' && typeof bValue === 'string') {
        aValue = aValue.toLowerCase()
        bValue = bValue.toLowerCase()
      }
      
      if (sortDirection === 'asc') {
        return aValue < bValue ? -1 : aValue > bValue ? 1 : 0
      } else {
        return aValue > bValue ? -1 : aValue < bValue ? 1 : 0
      }
    })

  const getSortIcon = (field: SortField) => {
    if (sortField !== field) return null
    return sortDirection === 'asc' ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />
  }

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'company': return 'bg-bitcoin-500 text-black'
      case 'etf': return 'bg-mstr-500 text-white'
      case 'country': return 'bg-green-500 text-black'
      default: return 'bg-gray-500 text-white'
    }
  }

  const totalBTC = filteredAndSortedHoldings.reduce((sum, holding) => sum + holding.btc_holdings, 0)
  const totalValue = btcPrice ? totalBTC * btcPrice.price_usd : 0

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-bitcoin-500 mx-auto mb-4"></div>
          <p className="text-gray-400">Loading treasury data...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold mb-2">Bitcoin Treasury Tracker</h1>
          <p className="text-gray-400">
            Real-time tracking of institutional Bitcoin holdings
          </p>
        </div>
        {btcPrice && (
          <div className="mt-4 md:mt-0 text-right">
            <p className="text-sm text-gray-400">BTC Price</p>
            <p className="text-2xl font-bold text-bitcoin-500">
              {formatCurrency(btcPrice.price_usd)}
            </p>
            <p className={`text-sm ${(btcPrice.change_24h || 0) >= 0 ? 'text-green-400' : 'text-red-400'}`}>
              {formatPercent(btcPrice.change_24h || 0)} 24h
            </p>
          </div>
        )}
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="card text-center">
          <p className="text-sm text-gray-400 mb-2">Total BTC (Filtered)</p>
          <p className="text-2xl font-bold">{formatNumber(totalBTC)}</p>
          <p className="text-gray-500">{formatCurrency(totalValue)}</p>
        </div>
        <div className="card text-center">
          <p className="text-sm text-gray-400 mb-2">Total Entities</p>
          <p className="text-2xl font-bold">{filteredAndSortedHoldings.length}</p>
          <p className="text-gray-500">of {holdings.length} total</p>
        </div>
        <div className="card text-center">
          <p className="text-sm text-gray-400 mb-2">Market Dominance</p>
          <p className="text-2xl font-bold">{((totalBTC / 21000000) * 100).toFixed(2)}%</p>
          <p className="text-gray-500">of max supply</p>
        </div>
      </div>

      {/* Controls */}
      <div className="card">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
          {/* Search */}
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <input
              type="text"
              placeholder="Search entities..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-gray-800 border border-gray-600 rounded-lg focus:ring-2 focus:ring-bitcoin-500 focus:border-transparent"
            />
          </div>

          {/* Filter */}
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <Filter className="h-4 w-4 text-gray-400" />
              <span className="text-sm text-gray-400">Filter:</span>
            </div>
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value as FilterType)}
              className="bg-gray-800 border border-gray-600 rounded px-3 py-2 text-sm focus:ring-2 focus:ring-bitcoin-500"
            >
              <option value="all">All Types</option>
              <option value="company">Companies</option>
              <option value="etf">ETFs</option>
              <option value="country">Countries</option>
            </select>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-800">
              <tr>
                <th className="table-header">Rank</th>
                <th 
                  className="table-header cursor-pointer hover:bg-gray-700 transition-colors"
                  onClick={() => handleSort('entity_name')}
                >
                  <div className="flex items-center space-x-1">
                    <span>Entity</span>
                    {getSortIcon('entity_name')}
                  </div>
                </th>
                <th className="table-header">Type</th>
                <th 
                  className="table-header cursor-pointer hover:bg-gray-700 transition-colors text-right"
                  onClick={() => handleSort('btc_holdings')}
                >
                  <div className="flex items-center justify-end space-x-1">
                    <span>BTC Holdings</span>
                    {getSortIcon('btc_holdings')}
                  </div>
                </th>
                <th 
                  className="table-header cursor-pointer hover:bg-gray-700 transition-colors text-right"
                  onClick={() => handleSort('market_value')}
                >
                  <div className="flex items-center justify-end space-x-1">
                    <span>Market Value</span>
                    {getSortIcon('market_value')}
                  </div>
                </th>
                <th 
                  className="table-header cursor-pointer hover:bg-gray-700 transition-colors text-right"
                  onClick={() => handleSort('avg_cost_basis')}
                >
                  <div className="flex items-center justify-end space-x-1">
                    <span>Avg Cost</span>
                    {getSortIcon('avg_cost_basis')}
                  </div>
                </th>
                <th 
                  className="table-header cursor-pointer hover:bg-gray-700 transition-colors text-right"
                  onClick={() => handleSort('unrealized_pnl')}
                >
                  <div className="flex items-center justify-end space-x-1">
                    <span>Unrealized P&L</span>
                    {getSortIcon('unrealized_pnl')}
                  </div>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800">
              {filteredAndSortedHoldings.map((holding, index) => (
                <tr key={holding.id} className="hover:bg-gray-800/50 transition-colors">
                  <td className="table-cell">
                    <div className="bg-bitcoin-500 text-black text-sm font-bold rounded-full w-8 h-8 flex items-center justify-center">
                      {index + 1}
                    </div>
                  </td>
                  <td className="table-cell">
                    <div>
                      <p className="font-semibold">{holding.entity_name}</p>
                      {holding.additional_info?.ticker && (
                        <p className="text-sm text-gray-400">{holding.additional_info.ticker}</p>
                      )}
                    </div>
                  </td>
                  <td className="table-cell">
                    <span className={`px-2 py-1 rounded text-xs font-medium ${getTypeColor(holding.entity_type)}`}>
                      {holding.entity_type.toUpperCase()}
                    </span>
                  </td>
                  <td className="table-cell text-right">
                    <p className="font-bold">{formatNumber(holding.btc_holdings)}</p>
                    <p className="text-sm text-gray-400">BTC</p>
                  </td>
                  <td className="table-cell text-right">
                    <p className="font-bold">{formatCurrency(holding.market_value || 0)}</p>
                    {btcPrice && (
                      <p className="text-sm text-gray-400">
                        @ {formatCurrency(btcPrice.price_usd)}/BTC
                      </p>
                    )}
                  </td>
                  <td className="table-cell text-right">
                    {holding.avg_cost_basis ? (
                      <p className="font-mono">{formatCurrency(holding.avg_cost_basis)}</p>
                    ) : (
                      <p className="text-gray-500">N/A</p>
                    )}
                  </td>
                  <td className="table-cell text-right">
                    {holding.avg_cost_basis && holding.unrealized_pnl ? (
                      <>
                        <p className={`font-bold ${holding.unrealized_pnl >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                          {formatCurrency(holding.unrealized_pnl)}
                        </p>
                        <p className={`text-sm ${holding.unrealized_pnl >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                          {formatPercent(((holding.market_value || 0) / (holding.btc_holdings * holding.avg_cost_basis) - 1) * 100)}
                        </p>
                      </>
                    ) : (
                      <p className="text-gray-500">N/A</p>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {filteredAndSortedHoldings.length === 0 && (
        <div className="card text-center py-12">
          <p className="text-gray-400">No entities found matching your criteria.</p>
        </div>
      )}
    </div>
  )
}