import React from 'react'

const e = React.createElement

const pl = (n, sg, pl) => n === 1 ? `${n} ${sg}` : `${n} ${pl}`

function PathInfo({path, weight: [burns, turns, risks,pathId, numberOfPaths]}) {
    if (!path)
        return e('div', {className: 'PathInfo'},
            e('div', {}, `No route found. Fancier rocket needed.`)
        )
    else {
        return e('div', {className: 'PathInfo'},
            e('div', {}, `${pl(burns, 'Fuel Steps', 'Fuel Steps')}`),
            e('div', {}, `${pl(turns, 'Years', 'Years')}`),
            e('div', {}, `${pl(Math.floor(risks), 'Hazards', 'Hazards')}`),
            e('div', {}, `Path ${pathId}/${numberOfPaths}`),
        )
    }
}

//TODO read default engine data
function VehicleInfo({defaultEngines, setEngines}) {
    return e('div', {className: 'VehicleInfo'},
        e('div', {className: 'field'},
            'List of engines (format: (thrust,cost,pivots);(thrust,cost,pivots)',
            // 'ISRU',
            e('input', {type: 'text', min: 0, max: 4, onChange: e => setEngines(e.target.value)})
        )
    )
}


export function Overlay({path, weight, defaultEngines, setEngines}) {
    return [
        PathInfo({path, weight}),
        VehicleInfo({defaultEngines, setEngines}),

    ]
}
