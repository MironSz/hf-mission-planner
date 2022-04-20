import Heap from './heap'

export class Position {
    constructor(turn, burns, burn_remaining, pivots, risks, site, engine, previous, free_burns, direction) {
        this.turn = turn
        this.burns = burns
        this.burn_remaining = burn_remaining
        this.pivots_remaining = pivots
        this.risks = risks
        this.site = site
        this.current_engine = engine
        this.previous = previous
        this.free_burns = free_burns
        this.direction = direction
    }

    weight() {
        const maxBurn = 3
        return this.turn / maxBurn + this.burns
    }

    toTupple() {
        return {node: this.site, dir: this.direction, bonus: this.free_burns}
    }

    // porównaj turn, burns, burns_remaining, free_burns, risks, pivots_remaining
    isBetterThan(second_position) {
        if (this.direction !== second_position.direction) {
            return 0
        }
        // -1 : this is better
        // 1 : second_position is better
        // 0: can't compare
        let smaller_compares = []
        if (this.turn < second_position.turn)
            smaller_compares.push(-1)
        else if (this.turn > second_position.turn)
            smaller_compares.push(1)
        else
            smaller_compares.push(0)


        if (this.burns < second_position.burns)
            smaller_compares.push(-1)
        else if (this.burns > second_position.burns)
            smaller_compares.push(1)
        else
            smaller_compares.push(0)

        if (this.risks < second_position.risks)
            smaller_compares.push(-1)
        else if (this.risks > second_position.risks)
            smaller_compares.push(1)
        else
            smaller_compares.push(0)


        if (this.free_burns > second_position.free_burns)
            smaller_compares.push(-1)
        else if (this.free_burns < second_position.free_burns)
            smaller_compares.push(1)
        else
            smaller_compares.push(0)

        if (this.pivots_remaining > second_position.pivots_remaining)
            smaller_compares.push(-1)
        else if (this.pivots_remaining < second_position.pivots_remaining)
            smaller_compares.push(1)
        else
            smaller_compares.push(0)

        if (this.burn_remaining > second_position.burn_remaining)
            smaller_compares.push(-1)
        else if (this.burn_remaining < second_position.burn_remaining)
            smaller_compares.push(1)
        else
            smaller_compares.push(0)


        // //console.log(smaller_compares)
        if (smaller_compares.includes(-1) && !smaller_compares.includes(1))
            return -1
        else if (smaller_compares.includes(1) && !smaller_compares.includes(-1))
            return 1
        else
            return 0
    }

    waitTurn() {
        return new Position(this.turn + 1, this.burns, this.current_engine.burns + 1, this.current_engine.pivots, this.risks, this.site, this.current_engine, this, 0, null)
    }

    pEquals(secondPosition) {
        if (this.burns !== secondPosition.burns)
            return false
        if (this.turn !== secondPosition.turn)
            return false
        if (this.pivots_remaining !== secondPosition.pivots_remaining)
            return false
        if (this.risks !== secondPosition.risks)
            return false
        if (this.burn_remaining !== secondPosition.burn_remaining)
            return false
        if (this.direction !== secondPosition.direction)
            return false
        if (this.site !== secondPosition.site)
            return false
        // console.log("Positions equal")
        return true
        // if (this.burn_remaining !== secondPosition.burn_remaining)
        //     return false
    }
}

function weightCompare(position1, position2) {
    return position1.weight() < position2.weight()
}


function isPositionBest(position, bestPositionInNode) {

    // console.log("isPositionBest")
    // console.log(position)
    // console.log(bestPositionInNode)
    if (bestPositionInNode != null && bestPositionInNode.length > 0) {
        for (const positionInNode of bestPositionInNode) {
            // If there exist position which is better or equal
            if (positionInNode.isBetterThan(position) === 1 || positionInNode.pEquals(position)) {
                // console.log("It is not")
                return false
            }
        }
    }
    // //console.log("It is")
    return true

}


function singleBurn(currentPosition, burnTurnRisk, neighbour) {
    //console.log("Making a burn")
    const reachablePositions = []
    if (currentPosition.free_burns > 0) {
        //console.log("using free burn")
        const nextPosition = new Position(currentPosition.turn,
            currentPosition.burns,
            currentPosition.burn_remaining,
            currentPosition.pivots_remaining,
            currentPosition.risks,
            neighbour.node,
            currentPosition.current_engine,
            currentPosition,
            currentPosition.free_burns - 1,
            neighbour.dir)
        reachablePositions.push(nextPosition)
    } else if (currentPosition.burn_remaining > 0) {
        //console.log("using remaining burn")

        const nextPosition = new Position(currentPosition.turn,
            currentPosition.burns + 1,
            currentPosition.burn_remaining - 1,
            currentPosition.pivots_remaining,
            currentPosition.risks,
            neighbour.node,
            currentPosition.current_engine,
            currentPosition,
            currentPosition.free_burns,
            neighbour.dir)
        //console.log(nextPosition)
        reachablePositions.push(nextPosition)
    } else {
        reachablePositions.push(currentPosition.waitTurn())
    }

    return reachablePositions

}

function singleTurn(currentPosition, burnTurnRisk, neighbour) {
    //console.log("Making a turn")

    const reachablePositions = []
    //If a turn was made, check if we can make it using pivot
    if (currentPosition.pivots_remaining > 0) {
        //console.log("*")

        const nextPosition = new Position(currentPosition.turn,
            currentPosition.burns,
            currentPosition.burn_remaining,
            currentPosition.pivots_remaining - 1,
            currentPosition.risks,
            neighbour.site,
            currentPosition.current_engine,
            currentPosition,
            currentPosition.free_burns,
            neighbour.dir)
        reachablePositions.push(nextPosition)
        //If a turn was made, check if we can make it using 2 burns
    } else if (currentPosition.burn_remaining > 1) {
        const nextPosition = new Position(currentPosition.turn,
            currentPosition.burns + 2,
            currentPosition.burn_remaining - 2,
            currentPosition.pivots_remaining,
            currentPosition.risks,
            neighbour.site,
            currentPosition.current_engine,
            currentPosition,
            currentPosition.free_burns,
            neighbour.dir)
        reachablePositions.push(nextPosition)
    }
    //If no pivots are possible, wait a year AND do tru to turn by burning
    if (currentPosition.pivots_remaining === 0) {
        reachablePositions.push(currentPosition.waitTurn())
    }
    return reachablePositions
}

function reachablePositions(currentPosition, burnTurnRiskArray, neighbour) {
    const burnTurnRisk = {burns: burnTurnRiskArray[0], turns: burnTurnRiskArray[1], risks: burnTurnRiskArray[2]}
    //console.log("reachablePositions")
    //console.log(currentPosition)
    //console.log(burnTurnRisk)
    //console.log(neighbour)
    let reachablePositions = []
    // If a burn was made, make sure engine has enough burns/free burns left
    if (burnTurnRisk.burns === 1) {
        const burnPositions = singleBurn(currentPosition, burnTurnRisk, neighbour)
        reachablePositions = reachablePositions.concat(burnPositions)
    } else if (burnTurnRisk.turns === 1) {
        reachablePositions = reachablePositions.concat(singleTurn(currentPosition, burnTurnRisk, neighbour))
    } else {
        //console.log("*")
        // Nothing happened, cruising through lagrange point or sth, chilling in my spacecraft while being oblivious to the dangers od space travel
        const nextPosition = new Position(currentPosition.turn,
            currentPosition.burns,
            currentPosition.burn_remaining,
            currentPosition.pivots_remaining,
            currentPosition.risks,
            neighbour.node,
            currentPosition.current_engine,
            currentPosition,
            currentPosition.free_burns,
            neighbour.dir)
        reachablePositions.push(nextPosition)
    }
    //console.log("Neighbours")
    //console.log(reachablePositions)
    return reachablePositions
}


//getNeighbours: (site,direction, bonus burns)->[(site,direction, bonus burns)]
// allowed: (id,id)-->bool
export function dijkstra(getNeighbors, burnTurnRiskExtractor, {zero, add, lessThan}, id, source, allowed, engine) {
    //console.log("Starting dijikstra")
    // engine = thrust, pivots
    // position = turns, burns, remaining_burns, remaining_pivots
    const distance = {}
    const previous = {}
    const zero_distance = {burns: 0, pivots: 0, hazards: 0}
    const zero_position = new Position(0, 0, engine.burns, engine.pivots, 0, source.node, engine, null, 0, null)
    let iteration = 0
    distance[id(source)] = zero
    const positionsQueue = []
    const positionsHeap = new Heap(null, weightCompare)
    positionsQueue.push(zero_position)
    positionsHeap.insert(zero_position.weight(), zero_position)

    const bestFound = new Map()

    bestFound.set(source.node, [zero_position])
    // bestFound.set(id(source.toTupple()), [zero_position])

    while (positionsQueue.length > 0) {
        iteration = iteration + 1
        if (iteration % 1000 === 0) {
            console.log("Iteration:")
            console.log(iteration)
            console.log("size")
            console.log(positionsQueue.length)
            console.log(bestFound)
        }
        if (iteration === 10000)
            break

        const currentPosition = positionsQueue.shift()

        //console.log("Current Position")
        //console.log(currentPosition)
        const idCurrentPosition = currentPosition.site

        if (!bestFound.has(idCurrentPosition)) {
            bestFound.set(idCurrentPosition, [])
        }
        // if (!isPositionBest(currentPosition, bestFound.get(idCurrentPosition))) {
        //     continue
        // }

        const neighbours = getNeighbors(currentPosition.toTupple())
        // console.log("Potential neighbours")
        // console.log(neighbours)
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
            const burnTurnRisk = burnTurnRiskExtractor(currentPosition, neighbour)

            const nextPositions = reachablePositions(currentPosition, burnTurnRisk, neighbour)
            // //console.log(nextPositions)
            const nextPositions2 = nextPositions.filter(x => {
                return isPositionBest(x, nextPositions)
            })
            // //console.log(nextPositions2)

            for (const nextPosition of nextPositions) {
                // Kiedy chcę dodać pozycję do listy?
                // Kiedy :
                //          a) nie ma tej pozycji w liście
                //          b) żadana pozycja w liście jej nie dominuje
                //Kiedy chcę usunąć pozycję z listy:
                //          a) kiedy inna pozycja dominuje tę pozycję

                if (nextPosition.burns > 100 || nextPosition.turn > 50) {
                    continue
                } else {
                    // console.log(nextPosition)
                }
                if (isPositionBest(nextPosition, bestFound.get(idNeighbour))) {
                    const bestInSite = bestFound.get(idNeighbour)
                    // console.log("best in site")
                    // console.log(bestFound)
                    bestFound.set(idNeighbour, bestInSite.filter(x => {
                        return nextPosition.isBetterThan(x) === 0
                    }))
                    bestFound.get(idNeighbour).push(nextPosition)
                    positionsQueue.push(nextPosition)
                }

            }
        }
    }
    console.log(bestFound)

    return bestFound
}
