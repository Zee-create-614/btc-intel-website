// Quick test of the data functions
import { getDashboardStats, getTreasuryHoldings, getBTCPrice, getMSTRData } from './lib/data.ts'

async function testData() {
  console.log('Testing frontend data functions...')
  
  const stats = await getDashboardStats()
  console.log('Dashboard stats:', stats)
  
  const holdings = await getTreasuryHoldings()
  console.log(`Treasury holdings: ${holdings.length} entities`)
  
  const btcPrice = await getBTCPrice()
  console.log('BTC price:', btcPrice)
  
  const mstrData = await getMSTRData()
  console.log('MSTR data:', mstrData)
}

testData().catch(console.error)