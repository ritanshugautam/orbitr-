import { useEffect, useState } from 'react'
import Globe from './components/Globe.jsx'
import Controls from './components/Controls.jsx'
import { loadSatelliteData } from './utils/celestrak.js'

export default function App() {
  const [satelliteData, setSatelliteData] = useState(null)
  const [dataStatus, setDataStatus] = useState('')
  const [filters, setFilters] = useState({
    showStarlink: true,
    showGPS: true,
    showISS: true,
    showGalileo: true,
    showOneWeb: true,
    showOther: true,
  })
  const [stats, setStats] = useState({ fps: 0, count: 0 })

  useEffect(() => {
    async function init() {
      try {
        const data = await loadSatelliteData((msg) => setDataStatus(msg))
        setSatelliteData(data)
      } catch (err) {
        setDataStatus('Error: ' + err.message)
      }
    }
    init()
  }, [])

  function handleFilterChange(key, value) {
    setFilters(prev => ({ ...prev, [key]: value }))
  }

  return (
    <div style={{ width: '100vw', height: '100vh', overflow: 'hidden', background: '#000008' }}>
      <Globe
        satelliteData={satelliteData}
        filters={filters}
        onStats={setStats}
      />
      <Controls
        filters={filters}
        onFilterChange={handleFilterChange}
        stats={stats}
        dataStatus={dataStatus}
      />
    </div>
  )
}
