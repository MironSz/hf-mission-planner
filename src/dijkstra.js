import Heap from './heap'

export class Position {
    constructor(turn, burns, burnRemaining, pivots, risks, site, engine, previous, freeBurns, direction, engines) {

        this.turn = turn
        this.burns = burns
        this.burnsRemaining = burnRemaining
        this.pivotsRemaining = pivots
        this.risks = risks
        this.site = site
        this.currentEngine = engine
        this.previous = previous
        this.freeBurns = freeBurns
        this.direction = direction
        if (previous == null)
            this.engines = engines
        else
            this.engines = previous.engines
        this.thrustModifier = 0
        if(freeBurns>10){
            console.log(this)
        }
    }

    getThrust() {
        return this.currentEngine.baseThrust + this.thrustModifier
    }

    toTupple() {
        return {node: this.site, dir: this.direction, bonus: 0}
    }

    // porównaj turn, burns, burns_remaining, freeBurns, risks, pivotsRemaining
    isNotDominating(position) {
        // if (this.burns - this.currentEngine.burnCost(this.freeBurns +this.pivotsRemaining*2)> position.burns - position.currentEngine.burnCost*(position.freeBurns+2*position.pivotsRemaining))
        // This is not better if position has better potential (which may not be used) than the number of burns we already did
        // if (this.burns > position.burns - position.currentEngine.burnCost * (position.freeBurns + 2 * position.pivotsRemaining))
        if (position.direction !== this.direction)
            return true
        if (this.burns > position.burns)//- position.currentEngine.burnCost * (position.freeBurns + 2 * position.pivotsRemaining))
            return true

        if (this.risks > position.risks)
            return true
        if (this.pivotsRemaining < position.pivotsRemaining) {
            return true
        }
        if (this.burnsRemaining < position.burnsRemaining) {
            return true
        }
        if (this.freeBurns < position.freeBurns) {
            return true
        }
        if (this.turn > position.turn) {
            return true
        }
        return false
    }


    waitTurn() {
        const changedEngine = []
        for (const activeEngine of this.engines) {
            changedEngine.push(
                new Position(this.turn + 1, this.burns, activeEngine.baseThrust, this.currentEngine.pivots, this.risks, this.site, activeEngine, this, 0, null)
            )
        }
        for (const position of changedEngine) {
            position.tag = "waiting a turn"
        }
        // console.log("Changing engine")
        // console.log(changedEngine)
        return changedEngine
    }

    pEquals(secondPosition) {
        // console.log({dir1: this.direction, dir2: secondPosition.direction, cmp : this.direction !== secondPosition.direction})
        if (this.burns !== secondPosition.burns)
            return false
        if (this.turn !== secondPosition.turn)
            return false
        if (this.pivotsRemaining !== secondPosition.pivotsRemaining)
            return false
        if (this.risks !== secondPosition.risks)
            return false
        if (this.burnsRemaining !== secondPosition.burnsRemaining)
            return false
        if (this.direction !== secondPosition.direction)
            return false
        if (this.site !== secondPosition.site)
            return false
        // console.log("Positions equal")
        return true
        // if (this.burnsRemaining !== secondPosition.burnsRemaining)
        //     return false
    }
}

function checkThrust(position, siteId) {

}


function isPositionBest(position, bestPositionInNode) {
    if (bestPositionInNode != null && bestPositionInNode.length > 0) {
        for (const positionInNode of bestPositionInNode) {
            // If there exist position which is better or equal
            if (!positionInNode.isNotDominating(position) || positionInNode.pEquals(position)) {
                // console.log("Found better")
                // console.log({u:position,v:positionInNode, cmp: positionInNode.isNotDominating(position) ,  eq: positionInNode.pEquals(positionInNode) })
                // if (positionInNode.isBetterThan(position) === 1 || positionInNode.pEquals(position)) {
                // console.log("It is not")
                return false
            }
        }
    }
    // console.log("Didnt find better")
    // console.log({u:position})

    return true

}


function singleBurn(currentPosition, burnTurnRisk, neighbour) {
    // console.log({burn: burnTurnRisk})

    var reachablePositions = []
    if (currentPosition.freeBurns > 0) {
        const nextPosition = new Position(currentPosition.turn,
            currentPosition.burns,
            currentPosition.burnsRemaining,
            currentPosition.pivotsRemaining,
            currentPosition.risks,
            neighbour.node,
            currentPosition.currentEngine,
            currentPosition,
            currentPosition.freeBurns - 1,
            neighbour.dir)
        nextPosition.tag = "free burn"
        reachablePositions.push(nextPosition)
    } else if (currentPosition.burnsRemaining > 0) {
        //console.log("using remaining burn")

        const nextPosition = new Position(currentPosition.turn,
            currentPosition.burns + currentPosition.currentEngine.burnCost,
            currentPosition.burnsRemaining - 1,
            currentPosition.pivotsRemaining,
            currentPosition.risks,
            neighbour.node,
            currentPosition.currentEngine,
            currentPosition,
            currentPosition.freeBurns,
            neighbour.dir)
        nextPosition.tag = "burn"

        reachablePositions.push(nextPosition)
    } else {
        reachablePositions = reachablePositions.concat(currentPosition.waitTurn())
    }
    return reachablePositions

}

function singleTurn(currentPosition, burnTurnRisk, neighbour) {

    var reachablePositions = []
    //If a turn was made, check if we can make it using pivot
    if (currentPosition.pivotsRemaining > 0) {

        const nextPosition = new Position(currentPosition.turn,
            currentPosition.burns,
            currentPosition.burnsRemaining,
            currentPosition.pivotsRemaining - 1,
            currentPosition.risks,
            neighbour.node,
            currentPosition.currentEngine,
            currentPosition,
            currentPosition.freeBurns,
            neighbour.dir)
        nextPosition.tag = "pivot"

        reachablePositions.push(nextPosition)
        //If a turn was made, check if we can make it using 2 burns
    } else if (currentPosition.burnsRemaining > 1) {
        const nextPosition = new Position(currentPosition.turn,
            currentPosition.burns + currentPosition.currentEngine.burnCost * 2,
            currentPosition.burnsRemaining - 2,
            currentPosition.pivotsRemaining,
            currentPosition.risks,
            neighbour.node,
            currentPosition.currentEngine,
            currentPosition,
            currentPosition.freeBurns,
            neighbour.dir)
        nextPosition.tag = "forced turn"

        reachablePositions.push(nextPosition)
    }
    //If no pivots are possible, wait a year AND do try to turn by burning
    if (currentPosition.pivotsRemaining === 0) {
        reachablePositions = reachablePositions.concat(currentPosition.waitTurn())
    }
    return reachablePositions
}

function reachablePositions(currentPosition, burnTurnRiskArray, neighbour) {
    // if (neighbour.bonus !== 0)
    //     console.log(neighbour)
    const burnTurnRisk = {burns: burnTurnRiskArray[0], turns: burnTurnRiskArray[1], risks: burnTurnRiskArray[2]}
    // console.log(burnTurnRisk)
    let reachablePositions = []
    if (burnTurnRisk.burns === 1) {
        const burnPositions = singleBurn(currentPosition, burnTurnRisk, neighbour)
        reachablePositions = reachablePositions.concat(burnPositions)
    } else if (burnTurnRisk.turns === 1) {
        reachablePositions = reachablePositions.concat(singleTurn(currentPosition, burnTurnRisk, neighbour))
    } else {
        // Nothing happened, cruising through lagrange point or sth, chilling in my spacecraft while being oblivious to the dangers od space travel
        const nextPosition = new Position(currentPosition.turn,
            currentPosition.burns,
            currentPosition.burnsRemaining,
            currentPosition.pivotsRemaining,
            currentPosition.risks,
            neighbour.node,
            currentPosition.currentEngine,
            currentPosition,
            currentPosition.freeBurns+neighbour.bonus,
            // currentPosition.freeBurns + neighbour.bonus,
            neighbour.dir)
        nextPosition.tag = "crusing"
        reachablePositions.push(nextPosition)
    }
    //console.log("Neighbours")
    //console.log(reachablePositions)
    return reachablePositions
}


//getNeighbours: (site,direction, bonus burns)->[(site,direction, bonus burns)]
// allowed: (id,id)-->bool
export function dijkstra(getNeighbors, burnTurnRiskExtractor, {zero, add, lessThan}, id, source, allowed, engines) {
    console.log(engines)
    let iteration = 0
    const positionsQueue = []
    const bestFound = new Map()

    bestFound.set(source.node, [])

    // const positionsHeap = new Heap(null, weightCompare)
    for (const engine of engines) {
        // if(!(engine.pivots&&engine.baseThrust&&engine.burnCost)){
        //     console.log("Missing engine data")
        //     return null
        // }
        const zeroPosition = new Position(1, 0, engine.baseThrust, engine.pivots, 0, source.node, engine, null, 0, null, engines)
        positionsQueue.push(zeroPosition)
        bestFound.get(source.node).push(zeroPosition)
    }
    // positionsHeap.insert(zero_position.weight(), zero_position)


    while (positionsQueue.length > 0) {
        // if(positionsQueue.length>1000)
        //     break
        iteration = iteration + 1
        if (iteration % 100000 === 0) {
            console.log("Iteration:")
            console.log(iteration)
            console.log("size")
            console.log(positionsQueue.length)
        }
        // if (iteration == 1000)
        //     break

        const currentPosition = positionsQueue.shift()

        const idCurrentPosition = currentPosition.site

        if (!bestFound.has(idCurrentPosition)) {
            bestFound.set(idCurrentPosition, [])
        }

        const neighbours = getNeighbors(currentPosition.toTupple())
        // console.log({position: currentPosition,neigbours:neighbours})
        //console.log(currentPosition.toTupple())
        for (const neighbour of neighbours) {
            //console.log("NExt neighbour")
            //console.log(neighbour)
            if (!allowed(currentPosition, neighbour, id)) {
                //console.log("not allowed :(")
                continue
            } else {
                //console.log("allowed :)")

            }

            const idNeighbour = neighbour.node
            if (!bestFound.has(neighbour.node)) {
                bestFound.set(neighbour.node, [])
            }
            const burnTurnRisk = burnTurnRiskExtractor(currentPosition.toTupple(), neighbour)

            const nextPositions = reachablePositions(currentPosition, burnTurnRisk, neighbour)
            const nextPositions2 = nextPositions.filter(x => {
                return isPositionBest(x, nextPositions)
            })

            for (const nextPosition of nextPositions) {
                const idNeighbour = nextPosition.site
                if (isPositionBest(nextPosition, bestFound.get(idNeighbour))) {
                    const bestInSite = bestFound.get(idNeighbour)
                    bestFound.set(idNeighbour, bestInSite.filter(x => {
                        return (x.isNotDominating(nextPosition))
                    }))
                    bestFound.get(idNeighbour).push(nextPosition)
                    const xxx = bestFound.get(idNeighbour).sort(function (a, b) {
                        return a.burns - b.burns
                    })
                    bestFound.set(idNeighbour, xxx)
                    // console.log(xxx)
                    positionsQueue.push(nextPosition)
                }

            }
            positionsQueue.sort(function (a, b) {
                return a.burns < b.burns
            })
        }
    }
    return bestFound
}
