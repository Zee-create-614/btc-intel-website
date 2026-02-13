import { Trophy, TrendingUp, TrendingDown, Medal } from 'lucide-react'
import Link from 'next/link'
import {
  getLeaderboard, partyColor, partyBg, partyName,
  returnColor, formatReturn,
} from '../../lib/politician-data'

export const metadata = {
  title: 'Politician Trading Leaderboard | BTCIntelVault',
  description: 'See which politicians are the best and worst stock traders. Rankings by return, trade volume, and more.',
}

async function LeaderboardTable({ title, sortBy, icon: Icon, description }: {
  title: string;
  sortBy: string;
  icon: any;
  description: string;
}) {
  const data = await getLeaderboard(sortBy, 15)
  
  return (
    <div className="card">
      <div className="flex items-center gap-3 mb-2">
        <Icon className="h-6 w-6 text-bitcoin-500" />
        <h2 className="text-xl font-bold">{title}</h2>
      </div>
      <p className="text-gray-400 text-sm mb-6">{description}</p>
      
      <div className="space-y-3">
        {data.map((pol, i) => {
          const medal = i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `${i + 1}.`;
          
          return (
            <Link
              key={pol.name}
              href={`/politicians/${encodeURIComponent(pol.name)}`}
              className="flex items-center justify-between p-4 bg-gray-800 rounded-lg hover:bg-gray-700 transition-colors group"
            >
              <div className="flex items-center gap-4">
                <span className="text-xl w-8 text-center">{medal}</span>
                <div>
                  <p className="font-semibold group-hover:text-bitcoin-400 transition-colors">
                    {pol.name}
                  </p>
                  <p className="text-xs text-gray-400">
                    <span className={partyColor(pol.party)}>{partyName(pol.party)}</span>
                    {' · '}{pol.chamber}{pol.state ? ` · ${pol.state}` : ''}
                    {' · '}{pol.total_trades} trades
                  </p>
                </div>
              </div>
              
              <div className="text-right">
                <p className={`text-xl font-bold ${returnColor(pol.avg_return_pct)}`}>
                  {formatReturn(pol.avg_return_pct)}
                </p>
                <p className="text-xs text-gray-500">avg return</p>
              </div>
            </Link>
          )
        })}
      </div>
      
      {data.length === 0 && (
        <p className="text-gray-500 text-center py-8">
          Performance data calculating... Check back soon.
        </p>
      )}
    </div>
  )
}

export default function LeaderboardPage() {
  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-4xl font-bold mb-4 bg-gradient-to-r from-yellow-400 to-bitcoin-500 bg-clip-text text-transparent">
          🏆 Politician Trading Leaderboard
        </h1>
        <p className="text-xl text-gray-400 max-w-2xl mx-auto">
          Who's beating the market and who's losing their shirt? Rankings based on actual trade performance.
        </p>
      </div>

      <Link href="/politicians" className="text-gray-400 hover:text-white text-sm">
        ← Back to All Politicians
      </Link>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <LeaderboardTable
          title="🔥 Best Performers"
          sortBy="avg_return"
          icon={TrendingUp}
          description="Politicians with the highest average returns on their trades"
        />
        
        <LeaderboardTable
          title="📉 Worst Performers"
          sortBy="worst_return"
          icon={TrendingDown}
          description="Politicians with the lowest average returns on their trades"
        />
      </div>

      <LeaderboardTable
        title="📊 Most Active Traders"
        sortBy="most_trades"
        icon={Trophy}
        description="Politicians making the most trades"
      />

      {/* CTA */}
      <div className="card text-center py-8">
        <h3 className="text-2xl font-bold mb-4">Get Alerts on Every Trade</h3>
        <p className="text-gray-400 mb-6">
          Follow @BTCIntelVault on X for real-time politician trade notifications.
        </p>
        <a 
          href="https://x.com/BTCIntelVault" 
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 bg-bitcoin-500 text-black font-bold px-6 py-3 rounded-lg hover:bg-bitcoin-400 transition-colors"
        >
          Follow @BTCIntelVault
        </a>
      </div>
    </div>
  )
}
