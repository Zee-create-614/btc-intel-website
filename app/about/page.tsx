import { Shield, Database, Calculator, AlertTriangle, ExternalLink, Scale } from 'lucide-react'
import Link from 'next/link'

export const metadata = {
  title: 'About & Methodology | BTCIntelVault',
  description: 'Learn about BTCIntelVault\'s data sources, return calculation methodology, and how we track congressional stock trading activity.',
  openGraph: {
    title: 'About & Methodology | BTCIntelVault',
    description: 'How we track congressional stock trades and calculate returns.',
  },
  twitter: { card: 'summary' },
}

export default function AboutPage() {
  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="text-center">
        <h1 className="text-4xl font-bold mb-4 bg-gradient-to-r from-bitcoin-500 to-yellow-500 bg-clip-text text-transparent">
          About BTCIntelVault
        </h1>
        <p className="text-xl text-gray-400 max-w-2xl mx-auto">
          Transparency in congressional stock trading. Public data, open analysis.
        </p>
      </div>

      {/* Data Source */}
      <div className="card">
        <h2 className="text-2xl font-bold mb-4 flex items-center gap-3">
          <Database className="h-6 w-6 text-bitcoin-500" />
          Data Source
        </h2>
        <p className="text-gray-300 mb-4">
          All trading data is sourced from official congressional financial disclosures required under the 
          <strong className="text-white"> STOCK Act</strong> (Stop Trading on Congressional Knowledge Act of 2012).
        </p>
        <p className="text-gray-300 mb-4">
          Members of Congress are required to report stock transactions within 45 days. These disclosures are 
          public record and are collected via <a href="https://www.capitoltrades.com/" target="_blank" rel="noopener noreferrer" className="text-bitcoin-500 hover:text-bitcoin-400">Capitol Trades</a>, which aggregates filings from:
        </p>
        <ul className="list-disc list-inside text-gray-400 space-y-2 ml-4">
          <li><a href="https://efdsearch.senate.gov/search/" target="_blank" rel="noopener noreferrer" className="text-bitcoin-500 hover:text-bitcoin-400">Senate Electronic Financial Disclosure (eFD)</a></li>
          <li><a href="https://disclosures-clerk.house.gov/PublicDisclosure/FinancialDisclosure" target="_blank" rel="noopener noreferrer" className="text-bitcoin-500 hover:text-bitcoin-400">House Financial Disclosure Reports</a></li>
        </ul>
      </div>

      {/* Methodology */}
      <div className="card">
        <h2 className="text-2xl font-bold mb-4 flex items-center gap-3">
          <Calculator className="h-6 w-6 text-bitcoin-500" />
          Return Calculation Methodology
        </h2>
        <div className="space-y-4 text-gray-300">
          <p>
            Returns are calculated based on the stock price at the time of trade versus the current market price:
          </p>
          <div className="bg-gray-900 border border-gray-800 rounded-lg p-4 font-mono text-sm">
            <p className="text-bitcoin-400">Return % = ((Current Price - Trade Price) / Trade Price) × 100</p>
          </div>
          <p>
            <strong className="text-white">Average Return:</strong> The arithmetic mean of all individual trade returns 
            for a given politician, weighted equally regardless of trade size.
          </p>
          <p>
            <strong className="text-white">Cumulative Return:</strong> Sum of all individual trade returns, representing 
            total portfolio performance if each trade was an equal-weight position.
          </p>
          <p>
            <strong className="text-white">Important caveats:</strong>
          </p>
          <ul className="list-disc list-inside text-gray-400 space-y-1 ml-4">
            <li>Trade sizes are reported in ranges (e.g., $1K–$15K), not exact amounts</li>
            <li>We don't know the exact number of shares traded</li>
            <li>Some trades don't have price data available</li>
            <li>Returns are calculated for BUY trades only (sell trades are exits)</li>
            <li>Options, bonds, and non-equity trades may not have accurate return data</li>
          </ul>
        </div>
      </div>

      {/* STOCK Act */}
      <div className="card">
        <h2 className="text-2xl font-bold mb-4 flex items-center gap-3">
          <Scale className="h-6 w-6 text-bitcoin-500" />
          The STOCK Act & Compliance
        </h2>
        <p className="text-gray-300 mb-4">
          The STOCK Act, signed into law in 2012, requires members of Congress and senior congressional staff to 
          publicly disclose financial transactions within 45 days. It explicitly prohibits the use of non-public 
          information for personal financial gain.
        </p>
        <p className="text-gray-300 mb-4">
          BTCIntelVault tracks compliance and transparency by monitoring:
        </p>
        <ul className="list-disc list-inside text-gray-400 space-y-2 ml-4">
          <li>Trading frequency and patterns of individual members</li>
          <li>Performance metrics that may indicate information advantages</li>
          <li>Sector concentration around committee assignments</li>
          <li>Timeliness of disclosure filings</li>
        </ul>
        <p className="text-gray-400 mt-4 text-sm">
          All data tracked here is publicly available information. We believe transparency in government 
          financial dealings is essential to a healthy democracy.
        </p>
      </div>

      {/* Disclaimer */}
      <div className="card border-yellow-500/30 bg-yellow-500/5">
        <h2 className="text-2xl font-bold mb-4 flex items-center gap-3">
          <AlertTriangle className="h-6 w-6 text-yellow-500" />
          Disclaimer
        </h2>
        <div className="space-y-3 text-gray-300">
          <p>
            <strong className="text-yellow-400">This is not financial advice.</strong> BTCIntelVault is an informational 
            tool that aggregates publicly available congressional trading data for transparency purposes.
          </p>
          <p>
            Do not make investment decisions based solely on politician trading activity. Past performance does 
            not guarantee future results. Always consult with a qualified financial advisor before making 
            investment decisions.
          </p>
          <p className="text-sm text-gray-500">
            BTCIntelVault is not affiliated with the U.S. government, Congress, or any political party. 
            Data accuracy depends on the timeliness and completeness of official disclosure filings.
          </p>
        </div>
      </div>

      {/* CTA */}
      <div className="card text-center py-8">
        <h3 className="text-xl font-bold mb-4">Start Exploring</h3>
        <div className="flex flex-wrap justify-center gap-4">
          <Link href="/politicians" className="bg-bitcoin-500 text-black font-bold px-6 py-3 rounded-lg hover:bg-bitcoin-400 transition-colors">
            View All Politicians
          </Link>
          <Link href="/politicians/leaderboard" className="bg-gray-800 border border-gray-700 text-white font-bold px-6 py-3 rounded-lg hover:border-bitcoin-500/50 transition-colors">
            Leaderboard
          </Link>
        </div>
      </div>
    </div>
  )
}
