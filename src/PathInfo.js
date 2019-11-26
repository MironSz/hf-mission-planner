import React, { useEffect, useRef } from 'react'

const e = React.createElement

const pl = (n, sg, pl) => n === 1 ? `${n} ${sg}` : `${n} ${pl}`

export function PathInfo({path, weight, points}) {
  const ref = useRef()
  useEffect(() => {
    // Work around a Chrome bug that prevents the overlay layer from being
    // painted. Fixed in Chrome 80, maybe 79
    if (path) {
      ref.current.parentElement.style.width = 0
      setTimeout(() => {
        ref.current.parentElement.style.width = null
      })
    }
  }, [!!path])
  if (!path) return null
  else {
    let burns = 0
    let hazards = 0
    for (let i = 1; i < path.length; i++) {
      burns += weight(path[i-1], path[i])
    }
    for (let i = 1; i < path.length; i++) {
      if (path[i].node !== path[i-1].node) {
        // only count hazards once, when we move into the node
        hazards += points[path[i].node].hazard ? 1 : 0
      }
    }
    return e('div', {className: 'PathInfo', ref},
      e('div', {}, `${pl(burns, 'burn', 'burns')}`),
      e('div', {}, `${pl(hazards, 'hazard', 'hazards')}`)
    )
  }
}