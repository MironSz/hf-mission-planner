import ReactDOM from 'react-dom'
import React from 'react'
import {zoom} from 'd3-zoom'
import {select, event} from 'd3-selection'

import './index.css'
import HFMap from '../assets/hf.png'
import HF4Map from '../assets/hf4.jpg'
import {dijkstra} from './dijkstra'
import {Overlay} from './Overlay'
import {MapData} from './MapData'
import './dijkstra.js'

const isHF3 = location.search === '?ed=3'

const map = new Image
map.src = isHF3 ? HFMap : HF4Map
main.textContent = 'loading...'
const sphere0 = ['0.36272382934364455', '0.5730595728419228', '0.151123319733119', '0.8666219009954395', '0.6478148574369198', '0.9409627950397135', '0.4368240342037728', '0.8909469841468036', '0.41814157667403595', '0.8740461469252594', '0.4311797254112899', '0.6629059126241763', '0.9261489166631787', '0.3661984554637969', '0.971894135879019', '0.1461091771138916', '0.5349151568485067', '0.36272382934364455']
const sphere1 = ['0.569696645044709', '0.12750630492996828', '0.9323891754914411', '0.988140037597792', '0.891950239095429', '0.8517510833579742', '0.8020918061937716', '0.9258094768863108', '0.25254724535264184', '0.3028733357761537', '0.9431649960761752', '0.3486601876436579', '0.8144015775246347', '0.9557171717439816', '0.17775498663439615', '0.880610703614801', '0.6621034565729562', '0.35830747951457287', '0.8259714200819714', '0.971894135879019', '0.1461091771138916']
const sphere2 = ['0.53253133415193', '0.6298331242626691', '0.13152529515928002', '0.7491605650006234', '0.08474244265171471', '0.45641911923189404', '0.6830019554117492', '0.33353370924875225', '0.8844337980565591', '0.7662353374915887', '0.9946957915375505', '0.8957854272718304', '0.8957854272718304', '0.18202317099163023', '0.3512939316614885', '0.6537643694371449', '0.44954204558498834', '0.11256351357233219', '0.038519111088396674', '0.6677664153547038', '0.02511700411544271', '0.10467082066639066', '0.5227306733230033', '0.7998261316365423']
const sphere3 = ['0.12904666986673075', '0.007003499137781866', '0.7615932293539489', '0.22209853757812703', '0.42169310126567106', '0.7608582799616022', '0.7438584427949413', '0.7467831424854232', '0.6077586169241691', '0.24195149982812203', '0.7518741724924001', '0.4764830379546452', '0.21902800679841716']
const sphere4 = ['0.30789913395565915', '0.46097932574630596', '0.20394874437959531', '0.942937505828084', '0.5782744478823085', '0.41989026645434424', '0.27240728235556744', '0.28753195085717254', '0.8491573612358616', '0.8313354525437968', '0.5876327474002074', '0.5448469152107185', '0.854121208040407', '0.854121208040407', '0.20060337189813748', '0.42324119159677664']
const sphere5 = ['0.21009217614767972', '0.16964672949143877', '0.784619524763774', '0.0664785816865836', '0.16326752060547012']
const sphere6 = ['0.8621482962342524', '0.547790060077221', '0.06654803290031341', '0.6049519784978001', '0.6294830318273861', '0.38250898898138397']
const sphere7 = ['0.6848456583017779', '0.6525772490924986', '0.8493612681155245']

const canvas = document.createElement('canvas')
const overlay = document.createElement('div')

const sphereSeparators = [sphere7, sphere6, sphere5, sphere4, sphere3, sphere2, sphere1, sphere0]
const sphere = new Map()


overlay.setAttribute('id', 'overlay')
map.onload = () => {
    main.textContent = ''
    main.appendChild(map)
    canvas.width = map.width
    canvas.height = map.height
    main.appendChild(canvas)
    document.body.appendChild(overlay)
    const z = zoom()
        .scaleExtent([0.2, 1.5])
        .translateExtent([[0, 0], [map.width, map.height]])
        .filter(() => {
            return !event.ctrlKey && !event.button && event.target.tagName === 'CANVAS'
        })
        .on("zoom", () => zoomed(event.transform))
    select(document.documentElement).call(z).call(z.translateTo, 0.85 * canvas.width, 0.80 * canvas.height)
    draw()
}

function zoomed({x, y, k}) {
    main.style.transform = `translate(${x}px,${y}px) scale(${k})`
    main.style.transformOrigin = '0 0'
}

let editing = false
let mapData = null
let connecting = null
// Set highlightedPath in order to draw path. Probably of type [id_of_site]
let highlightedPath = null
let venus = false
//FromId
let pathOrigin = null
//node -> list of all pareto optimal positions
let searchTree = null
let chosenPathId = 0
let engines = [

    {
        baseThrust: 1,
        pivots: 1,
        burnCost: 1
    }
]

const loadData = (json) => {
    mapData = MapData.fromJSON(json)
    setTimeout(draw, 0)
    calculateSpheres()
}

if ('data' in localStorage) {
    loadData(JSON.parse(localStorage.data))
} else if (location.protocol !== 'file:') {
    if (isHF3) {
        import('../assets/data.json').then(({default: data}) => loadData(data))
    } else {
        import('../assets/data-hf4.json').then(({default: data}) => loadData(data))
    }
}

function changed() {
    localStorage.data = JSON.stringify(mapData.toJSON())
}

canvas.onclick = e => {
    if (editing) {
        const x = e.offsetX
        const y = e.offsetY
        const xPct = x / canvas.width
        const yPct = y / canvas.height
        const pointId = Math.random().toString()
        mapData.addPoint(pointId, {
            x: xPct,
            y: yPct,
            type: 'hohmann',
        })
        draw()
    } else {
        const closestId = nearestPoint(mousePos.x, mousePos.y, id => mapData.points[id].type !== 'decorative')
        if (!closestId) {
            return
        }
        if (canPath(closestId)) {
            highlightedPath = extractPathFromSearchTree(pathOrigin, closestId, searchTree)

            // highlightedPath = drawPath(pathData, pathOrigin, closestId)
            endPathing()
        } else {
            beginPathing(closestId)
        }

        draw()
    }
}

function calculateSpheres() {
    const {edgeLabels, points} = mapData

    const startingPointNearNeptun = '0.8393093402425826'
    const startingPointNearUranus = '0.7700452967993057'
    for (let sphereId = 0; sphereId < sphereSeparators.length + 1; sphereId++) {
        const visitedPoints = new Set()
        const queue = [startingPointNearNeptun]
        if (sphereId === 1) {
            queue.push(startingPointNearUranus)
        }
        while (queue.length > 0) {
            const currentPoint = queue.shift()
            if (!sphere.has(currentPoint)) {
                sphere.set(currentPoint, -6 + sphereId)

            }
            mapData.neighborsOf(currentPoint).forEach(nextPoint => {
                if (!visitedPoints.has(nextPoint)) {
                    if (sphereId === sphereSeparators.length || !sphereSeparators[sphereId].includes(nextPoint)) {
                        queue.push(nextPoint)

                        visitedPoints.add(nextPoint)

                    }
                }
            })
        }
    }
}

function beginPathing(originId) {
    pathOrigin = originId
    searchTree = findPath(originId)
}

function canPath(closestId) {
    return closestId && pathOrigin && closestId !== pathOrigin
}

function endPathing() {
    pathOrigin = null
    searchTree = null
}

function refreshPath() {
    if (pathOrigin && searchTree) {
        const closestId = nearestPoint(mousePos.x, mousePos.y, id => mapData.points[id].type !== 'decorative')
        if (canPath(closestId)) {
            highlightedPath = extractPathFromSearchTree(pathOrigin, closestId, searchTree)
        }
    }
}

const mousePos = {x: 0, y: 0} // pct
canvas.onmousemove = e => {
    mousePos.x = e.offsetX / canvas.width
    mousePos.y = e.offsetY / canvas.height
    refreshPath()
    draw()
}

function nearestPoint(testX, testY, filter = undefined) {
    let closest = null
    let dist = Infinity
    for (const pId in mapData.points) {
        if (filter && !filter(pId)) continue
        const {x, y} = mapData.points[pId]
        const dx = x - testX
        const dy = y - testY
        const testDist = Math.sqrt(dx * dx + dy * dy)
        if (testDist < dist) {
            closest = pId
            dist = testDist
        }
    }
    if (dist < 0.02)
        return closest
}

function clipToPi(a) {
    if (a < -Math.PI)
        return a + Math.PI * 2 * Math.abs(Math.floor((a + Math.PI) / (Math.PI * 2)))
    else if (a > Math.PI)
        return a - Math.PI * 2 * Math.abs(Math.ceil(((a - Math.PI) / (Math.PI * 2))))
    else
        return a
}

function nearestEdge(testX, testY) {
    const npId = nearestPoint(testX, testY)
    if (!npId) return
    const np = mapData.points[npId]
    const ns = mapData.neighborsOf(npId)
    const mdx = testX - np.x
    const mdy = testY - np.y
    const mouseAngle = Math.atan2(mdy, mdx)
    let minD = Infinity
    let closestEdge = null
    ns.forEach(otherEndId => {
        const otherEnd = mapData.points[otherEndId]
        const dy = otherEnd.y - np.y
        const dx = otherEnd.x - np.x
        const angle = Math.atan2(dy, dx)
        const dAngle = clipToPi(mouseAngle - angle)
        if (Math.abs(dAngle) < minD) {
            minD = Math.abs(dAngle)
            closestEdge = [npId, otherEndId]
        }
    })
    if (minD < Math.PI / 4) {
        return closestEdge.sort()
    }
}

window.onkeydown = e => {
    if (e.code === 'Escape') {
        connecting = null
        pathOrigin = null
        highlightedPath = null
        chosenPathId = 0
    }
    // Left Arrow
    if (e.code === 'ArrowLeft') {
        chosenPathId = Math.max(0, chosenPathId - 1)
        refreshPath()
    }
    // Right arrow
    if (e.code === 'ArrowRight') {
        chosenPathId = chosenPathId + 1
        refreshPath()
    }
    if (editing) {
        if (e.code === 'KeyA') { // Add edge
            const closestId = nearestPoint(mousePos.x, mousePos.y)
            if (connecting) {
                if (closestId && closestId !== connecting) {
                    if (mapData.hasEdge(closestId, connecting))
                        mapData.deleteEdge(closestId, connecting)
                    else
                        mapData.addEdge(closestId, connecting)
                    changed()
                    connecting = null
                }
            } else {
                if (closestId) connecting = closestId
            }
        }
        if (e.code === 'KeyM') { // Move point
            const closestId = nearestPoint(mousePos.x, mousePos.y)
            if (closestId) {
                mapData.points[closestId].x = mousePos.x
                mapData.points[closestId].y = mousePos.y
                changed()
            }
        }
        if (e.code === 'KeyX') { // Delete point
            const closestId = nearestPoint(mousePos.x, mousePos.y)
            if (closestId) {
                mapData.deletePoint(closestId)
                changed()
            }
        }
        if (e.code === 'KeyH') { // Set point type to hohmann
            const closestId = nearestPoint(mousePos.x, mousePos.y)
            if (closestId) {
                mapData.points[closestId].type = 'hohmann'
                changed()
            }
        }
        if (e.code === 'KeyL') { // Set point type to lagrange
            const closestId = nearestPoint(mousePos.x, mousePos.y)
            if (closestId) {
                mapData.points[closestId].type = 'lagrange'
                changed()
            }
        }
        if (e.code === 'KeyB') { // Set point type to burn / cycle through burn types
            const closestId = nearestPoint(mousePos.x, mousePos.y)
            if (closestId) {
                const p = mapData.points[closestId]
                if (p.type === 'burn') {
                    if (p.landing == null) {
                        p.landing = 1
                    } else if (p.landing === 1) {
                        p.landing = 0.5
                    } else {
                        delete p.landing
                    }
                } else {
                    p.type = 'burn'
                }
                changed()
            }
        }
        if (e.code === 'KeyD') { // Set point type to decorative
            const closestId = nearestPoint(mousePos.x, mousePos.y)
            if (closestId) {
                mapData.points[closestId].type = 'decorative'
                changed()
            }
        }
        if (e.code === 'KeyR') { // Set point type to radhaz
            const closestId = nearestPoint(mousePos.x, mousePos.y)
            if (closestId) {
                mapData.points[closestId].type = 'radhaz'
                changed()
            }
        }
        if (e.code === 'KeyZ') { // Toggle hazard
            const closestId = nearestPoint(mousePos.x, mousePos.y)
            if (closestId) {
                mapData.points[closestId].hazard = !mapData.points[closestId].hazard
                changed()
            }
        }
        if (e.code === 'KeyY') { // Set point type to flyby / cycle boost size
            const closestId = nearestPoint(mousePos.x, mousePos.y)
            if (closestId) {
                mapData.points[closestId].type = 'flyby'
                mapData.points[closestId].flybyBoost = ((mapData.points[closestId].flybyBoost || 0) % 4) + 1
                changed()
            }
        }
        if (e.code === 'KeyV') { // Set point type to be venus
            const closestId = nearestPoint(mousePos.x, mousePos.y)
            if (closestId) {
                mapData.points[closestId].type = 'venus'
                mapData.points[closestId].flybyBoost = ((mapData.points[closestId].flybyBoost || 0) % 4) + 1
                changed()
            }
        }
        if (e.code === 'KeyS') { // Set point type to site
            const closestId = nearestPoint(mousePos.x, mousePos.y)
            if (closestId) {
                const p = mapData.points[closestId]
                p.type = 'site'
                p.siteName = prompt("Site name", p.siteName)
                p.siteSize = prompt("Site size + type", p.siteSize)
                p.siteWater = prompt("Site water", p.siteWater)
                changed()
            }
        }
        if (e.code.startsWith('Digit')) { // Set edge label
            const label = e.code.slice(5)
            const np = nearestPoint(mousePos.x, mousePos.y)
            const ne = nearestEdge(mousePos.x, mousePos.y)
            if (np && ne) {
                const [a, b] = ne
                const other = a === np ? b : a
                mapData.setEdgeLabel(np, other, label)
                changed()
            }
        }
    } else {
        if (e.code === 'KeyV') {
            venus = !venus
            if (searchTree) {
                beginPathing(pathOrigin)
                refreshPath()
                draw()
            }
        }
    }

    if (e.code === 'Tab') { // Toggle edit mode
        editing = !editing
        e.preventDefault()
    }

    draw()
}


function thrustRequired(index) {

}

// Is movement from u to v allowed (in the same turn)
function allowed2(u, v, id) {
    if (u.previous == null || v.previous == null) {
        return true
    }
    //No movement occurred
    if (u.site === v.site) return true
    if (v.previous.site === u.site || u.previous.site === v.site)
        return false
    return true
}

// p is tuple (site,direction, bonus burns)
// return list of such tupples
function getNeighbors(p) {
    const {node, dir, bonus} = p
    const ns = []
    const {edgeLabels, points} = mapData
    if (edgeLabels[node]) {
        Object.keys(edgeLabels[node]).forEach(otherNode => {
            if (edgeLabels[node][otherNode] !== dir) {
                ns.push({node, dir: edgeLabels[node][otherNode], bonus: bonus})
            }
        })
    }
    // (obecnie zachodzi coś takiego   (a,dir)->(a,null). To błąd!!! musze zobazczyć gdzie to się dodaje
    // to jest chyba staroć
    // if (bonus > 0 || dir != null) {
    //     // you can always throw away your extra burns if you want.
    //     // this also allows the path finder to not have to search for the
    //     // destination node at different amounts of bonus.
    //     ns.push({node, dir: null, bonus: 0})
    // }
    mapData.neighborsOf(node).forEach(other => {
        if (edgeLabels[other] && edgeLabels[other][node] === '0') {
            return
        }
        if (!(node in edgeLabels) || !(other in edgeLabels[node]) || edgeLabels[node][other] === dir) {
            const direction = edgeLabels[other] && edgeLabels[other][node] ? edgeLabels[other][node] : null
            const entryCost = points[other].type === 'burn' ? 1 : 0
            const flybyBoost = points[other].type === 'flyby' || points[other].type === 'venus' ? points[other].flybyBoost : 0
            const bonusAfterEntry = Math.max(bonus - entryCost + flybyBoost, 0)
            if (points[other].type === 'venus' && !venus) {
                return
            }
            if (!(node === other && dir != null && direction == null))
                ns.push({node: other, dir: direction, bonus: bonusAfterEntry})
        }
    })
    return ns
}

const ints = {
    zero: 0,
    add: (a, b) => a + b,
    lessThan: (a, b) => a < b
}

const distance = {
    zero: [0, 0, 0, 0],
    add: (a, b) => a.map((x, i) => x + b[i]),
    lessThan: ([a, b, c, d], [x, y, z, w]) => {
        return (
            a < x || (a === x && (
                b < y || (b === y) && (
                    c < z || (c === z) && (
                        d < w)))))
    }
}

function burnWeight(u, v) {
    const {node: uId, dir: uDir, bonus} = u
    const {node: vId, dir: vDir} = v
    const {points} = mapData
    if (points[vId].type === 'burn') {
        return bonus > 0 && !points[vId].landing ? 0 : 1
    } else if (points[vId].type === 'hohmann') {
        return 0;
        // return uId === vId && uDir != null && vDir != null && uDir !== vDir ? 1 : 0;
    } else if (points[vId].type === 'flyby' || points[vId].type === 'venus') {
        return 0
    } else {
        return 0
    }
}

// Calculates whether turn took place  while going from u to v
function turnWeight(u, v) {
    const {node: uId, dir: uDir, bonus} = u
    const {node: vId, dir: vDir} = v
    const {points} = mapData
    let result = 0
    if (points[vId].type === 'hohmann') {

        if (uId === vId && uDir != null && vDir != null) {
            result = uDir !== vDir ? 1 : 0
        }
    }
    return result
}

function hazardWeight(u, v) {
    const {node: uId} = u
    const {node: vId} = v
    if (uId === vId) return 0
    const {points} = mapData
    if (points[vId].hazard)
        return 1
    if (points[vId].type === 'radhaz') {
        return 0.1 // eh, close enough
    }
    return 0
}

function burnsTurnsHazardsSegments(u, v) {
    const burns = burnWeight(u, v)
    const turns = turnWeight(u, v) // Assuming infinite thrust and no waiting...
    const hazards = hazardWeight(u, v)
    return [burns, turns, hazards, 1]
}

function pathId(p) {
    // return p.node

    return p.dir != null || p.bonus ? `${p.node}@${p.dir}@${p.bonus}` : p.node
}

// function pathId2(p) {
//     return p.dir != null || p.bonus ? `${p.node}@${p.dir}@${p.bonus}` : p.node
// }

function findPath(fromId) {
    // NB for pathfinding along Hohmanns each
    // hohmann is kind of like two nodes, one for
    // each direction. Moving into either node is
    // free, but switching from one to the other
    // costs 2 burns (or a turn).
    // After waiting a turn, direction is set to null
    // to represent free choice of direction
    //  .
    //   `-.         ,-'
    //      `-O.  ,-'
    //      2 | `-.
    //       ,O'   `-.
    //    ,-'         `-
    // .-'
    // point: {node: string; dir: string?, id: string}
    console.time('calculating paths')

    const source = {node: fromId, dir: null, bonus: 0}
    const pathData = dijkstra(getNeighbors, burnsTurnsHazardsSegments, distance, pathId, source, allowed2, engines,sphere)

    console.timeEnd('calculating paths')

    return pathData
}

// TODO
function extractPathFromSearchTree(fromId, toId, searchTree) {
    if (searchTree.has(toId)) {
        let currentPosition = searchTree.get(toId)[Math.min(chosenPathId,searchTree.get(toId).length-1)]
        let path = [{node: toId}]
        // console.log({currentPosition:currentPosition, allPositions: searchTree.get(toId)})

        while (currentPosition.site !== fromId) {
            currentPosition = currentPosition.previous

            path.push({node: currentPosition.site})

        }
        // console.log(path)
        return path
    }

}

// TODO ukatnualnić z moją implementacją. Powinno być prościej (yey)
//  previous jest tablicą, chyba powinna zwracać [id_of_site]
function drawPath({distance, previous}, fromId, toId) {
    const source = {node: fromId, dir: null, bonus: 0}

    let shorterTo = {node: toId, dir: null, bonus: 0}
    let shorterToId = pathId(shorterTo)

    if (shorterToId in distance) {
        const path = [shorterTo]
        let cur = shorterTo
        while (pathId(cur) !== pathId(source)) {
            const n = previous[pathId(cur)]
            path.unshift(n)
            cur = n
        }

        return path
    }
}

function pathWeight(path) {
    if (!path || !searchTree) {
        return [0, 0, 0, 0]
    }
    const lastNodeId = path[0].node
    const lastPosition = searchTree.get(lastNodeId)[Math.min(chosenPathId, searchTree.get(lastNodeId).length - 1)]
    return [lastPosition.burns, lastPosition.turn, lastPosition.risks, 0]
}

let isru = 0

function setIsru(e) {
    isru = e
    draw()
}

//example: (3,2,1);(1,0,solar)
function setEngines(newEnginesStr) {
    const newEngines = []
    for (let engineStr of newEnginesStr.split(";")) {
        engineStr = engineStr.replace("(", "")
        engineStr = engineStr.replace(")", "")
        const splitted = engineStr.split(",").map(Number)
        if (splitted[0] == null || splitted[1] == null || splitted[2] == null) {

            console.log("Missing engine data")
            console.log({0: splitted[0], 1: splitted[1], 2: splitted[2]})
            return 0
        }
        const solarPowered = engineStr.split(",").includes("solar")
        newEngines.push({
            baseThrust: splitted[0],
            burnCost: splitted[1],
            pivots: splitted[2],
            solarPowered: solarPowered
        })
    }
    engines = newEngines
    console.log("Successfully updated engine info, redrawing the map")
    console.log({egines: engines})
    beginPathing(pathOrigin)
    draw()

}


function draw() {
    if (!mapData) return
    const {points, edges, edgeLabels} = mapData
    const ctx = canvas.getContext('2d')
    const {width, height} = ctx.canvas
    ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height)
    ctx.lineWidth = 2
    const nearestToCursor = nearestPoint(mousePos.x, mousePos.y)
    if (editing) {
        const ce = nearestEdge(mousePos.x, mousePos.y)
        edges.forEach(e => {
            const [a, b] = e.split(":")
            const pa = points[a]
            const pb = points[b]
            if (ce && ce[0] === a && ce[1] === b) {
                ctx.strokeStyle = 'lightgreen'
            } else {
                ctx.strokeStyle = 'white'
            }
            ctx.beginPath()
            ctx.moveTo(pa.x * width, pa.y * height)
            ctx.lineTo(pb.x * width, pb.y * height)
            ctx.stroke()
        })
        for (let pId in points) {
            const p = points[pId]
            ctx.fillStyle = 'transparent'
            ctx.strokeStyle = 'white'
            if (p.type === 'hohmann') {

                ctx.fillStyle = 'green'
            } else if (p.type === 'lagrange' || p.type === 'flyby') {
                ctx.fillStyle = 'transparent'
                ctx.strokeStyle = '#c66932'
                if (p.hazard) {
                    ctx.fillStyle = '#d5cde5'
                }
            } else if (p.type === 'radhaz') {
                ctx.fillStyle = 'yellow'
            } else if (p.type === 'venus') {
                ctx.fillStyle = 'orange'
            } else if (p.type === 'site') {
                ctx.fillStyle = 'black'
            } else if (p.type === 'burn') {
                ctx.fillStyle = '#d60f7a'
            } else {
                ctx.fillStyle = 'cornflowerblue'
            }
            if (nearestToCursor === pId) {
                ctx.fillStyle = 'red'
            }
            const r = p.type === 'decorative' ? 3 : 10
            ctx.beginPath()
            if (p.type === 'site') {
                ctx.save()
                ctx.translate(p.x * width, p.y * height)
                const siteR = 15
                ctx.moveTo(siteR, 0)
                for (let t = 1; t < Math.PI * 2; t += Math.PI * 2 / 6) {
                    ctx.lineTo(Math.cos(t) * siteR, Math.sin(t) * siteR)
                }
                ctx.closePath()
                ctx.restore()
            } else if (p.type === 'burn' && p.landing) {
                ctx.rect(p.x * width - r, p.y * height - r, r * 2 * p.landing, r * 2)
            } else {
                ctx.arc(p.x * width, p.y * height, r, 0, Math.PI * 2)
            }
            ctx.fill()
            ctx.stroke()
            if (p.hazard) {
                ctx.save()
                ctx.fillStyle = p.type === 'burn' ? 'white' : 'black'
                ctx.font = '22px menlo'
                ctx.textAlign = 'center'
                ctx.textBaseline = 'middle'
                ctx.fillText('☠︎', p.x * width, p.y * height)
                ctx.restore()
            }
            if (p.type === 'flyby' || p.type === 'venus') {
                ctx.save()
                ctx.fillStyle = 'white'
                ctx.shadowOffsetX = 1
                ctx.shadowOffsetY = 1
                ctx.shadowColor = 'black'
                ctx.font = '14px helvetica'
                ctx.textBaseline = 'middle'
                ctx.textAlign = 'center'
                ctx.fillText(`+${p.flybyBoost}`, p.x * width, p.y * height)
                ctx.restore()
            }
            if (p.type === 'site') {
                ctx.save()
                ctx.fillStyle = 'white'
                ctx.font = '12px helvetica'
                ctx.textBaseline = 'middle'
                ctx.textAlign = 'center'
                ctx.fillText(`${p.siteSize}`, p.x * width, p.y * height - 6)
                ctx.fillText(`${p.siteWater}`, p.x * width, p.y * height + 6)
                ctx.restore()
            }

            ctx.save()
            ctx.fillStyle = 'white'
            ctx.shadowOffsetX = 1
            ctx.shadowOffsetY = 1
            ctx.shadowColor = 'black'
            ctx.font = '12px helvetica'
            for (let otherId in (edgeLabels[pId] || {})) {
                const otherPoint = points[otherId]
                const label = edgeLabels[pId][otherId]
                const dx = (otherPoint.x - p.x) * width
                const dy = (otherPoint.y - p.y) * height
                const d = Math.sqrt(dx * dx + dy * dy)
                const nx = dx / d
                const ny = dy / d
                ctx.textBaseline = 'middle'
                ctx.textAlign = 'center'
                const displacement = 12
                ctx.fillText(label, p.x * width + nx * displacement, p.y * height + ny * displacement)
            }
            ctx.restore()
        }
    } else {
        for (let pId in points) {
            const p = points[pId]
            if (p.type === 'venus') {
                if (!venus) {
                    ctx.save()
                    ctx.lineWidth = 8
                    ctx.strokeStyle = "red"
                    ctx.lineCap = "round"
                    ctx.beginPath()
                    const r = 15
                    ctx.moveTo(p.x * width - r, p.y * height - r)
                    ctx.lineTo(p.x * width + r, p.y * height + r)
                    ctx.moveTo(p.x * width + r, p.y * height - r)
                    ctx.lineTo(p.x * width - r, p.y * height + r)
                    ctx.stroke()
                    ctx.restore()
                }
                ctx.save()
                ctx.font = 'italic bold 14px helvetica'
                ctx.fillStyle = 'white'
                ctx.shadowColor = 'black'
                ctx.shadowOffsetX = 1
                ctx.shadowOffsetY = 1
                ctx.textBaseline = 'bottom'
                ctx.textAlign = 'center'
                ctx.fillText(`Press [V] to toggle`, p.x * width, p.y * height - 25)
                ctx.restore()
            }
        }
        const nearest = nearestPoint(mousePos.x, mousePos.y, id => points[id].type !== 'decorative')
        if (nearest != null) {
            const p = points[nearest]
            ctx.save()
            ctx.strokeStyle = "yellow"
            ctx.lineWidth = 4
            ctx.shadowColor = 'rgba(0,0,0,0.5)'
            ctx.shadowBlur = 5
            ctx.beginPath()
            ctx.arc(p.x * width, p.y * height, 15, 0, 2 * Math.PI)
            ctx.stroke()
            ctx.restore()
        }
        if (pathOrigin != null) {
            const p = points[pathOrigin]
            ctx.save()
            ctx.strokeStyle = "red"
            ctx.lineWidth = 4
            ctx.shadowColor = 'rgba(0,0,0,0.5)'
            ctx.shadowBlur = 5
            ctx.beginPath()
            ctx.arc(p.x * width, p.y * height, 15, 0, 2 * Math.PI)
            ctx.stroke()
            ctx.restore()
            // Print distance on each site
            for (const pId in points) {
                const p = points[pId]
                if (p.type === 'site' && p.siteWater >= isru) {
                    ctx.save()
                    ctx.font = 'bold 70px helvetica'
                    ctx.shadowColor = 'black'
                    ctx.shadowOffsetX = 0
                    ctx.shadowOffsetY = 0
                    ctx.shadowBlur = 10
                    ctx.textBaseline = 'middle'
                    ctx.textAlign = 'center'

                    const path = extractPathFromSearchTree(pathOrigin, pId, searchTree)
                    // const path = drawPath(searchTree, pathOrigin, pId)
                    // TODO  change displayed info
                    let weight = pathWeight(path)
                    const colors = [
                        '#ffffb2',
                        '#fecc5c',
                        '#fd8d3c',
                        '#f03b20',
                        '#bd0026',
                    ]
                    ctx.fillStyle = colors[Math.min(colors.length - 1, weight[0])]
                    ctx.fillText(weight[0]+"/"+weight[1]+"/"+weight[2], p.x * width, p.y * height)
                    ctx.restore()
                }
            }
        }
    }
    if (highlightedPath) {
        ctx.save()
        ctx.lineWidth = 20
        ctx.lineCap = 'round'
        ctx.lineJoin = 'round'
        ctx.strokeStyle = 'rgba(214,15,122,0.7)'
        const p0 = mapData.points[highlightedPath[0].node]
        ctx.beginPath()
        ctx.moveTo(p0.x * width, p0.y * height) // tu nie działa
        for (let p of highlightedPath.slice(1)) {
            const point = mapData.points[p.node]
            ctx.lineTo(point.x * width, point.y * height)
        }
        ctx.stroke()
        ctx.restore()
    }
    const weight = pathWeight(highlightedPath)
    // console.log({render:searchTree.get(highlightedPath[0].node).sort(function(a,b){return a.burns-b.burns})})
    ReactDOM.render(React.createElement(Overlay, {path: highlightedPath, weight, engines, setEngines}), overlay)
}
