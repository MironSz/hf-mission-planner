import React from 'react'

const e = React.createElement

const pl = (n, sg, pl) => n === 1 ? `${n} ${sg}` : `${n} ${pl}`

function PathInfo({path, weight: [burns, turns, risks]}) {
  if (!path) return e('div')
  else {
    return e('div', {className: 'PathInfo'},
      e('div', {}, `${pl(burns, 'burn', 'burns')}`),
      e('div', {}, `${pl(turns, 'turn', 'turns')}`),
      e('div', {}, `${pl(Math.floor(risks), 'hazard', 'hazards')}`)
    )
  }
}
//TODO read engine data
function VehicleInfo({defaultEngines, setEngines}) {
  return e('div', {className: 'VehicleInfo'},
    e('div', {className: 'field'},
      'List of engines (format: (thrust,cost,pivots);(thrust,cost,pivots)',
      // 'ISRU',
      e('input', { type: 'text', min: 0, max: 4, onChange: e => setEngines(e.target.value)})
    )
  )
}

export function Overlay({path, weight, defaultEngines, setEngines}) {
  return [
    PathInfo({path, weight}),
    VehicleInfo({defaultEngines, setEngines}),
  ]
}
