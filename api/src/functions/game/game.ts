import type { APIGatewayEvent, Context } from 'aws-lambda'

import { deal, discardCard, joinGame, newGame, syncGame } from 'src/lib/game'
import { logger } from 'src/lib/logger'

/**
 * The handler function is your code that processes http request events.
 * You can use return and throw to send a response or error, respectively.
 *
 * Important: When deployed, a custom serverless function is an open API endpoint and
 * is your responsibility to secure appropriately.
 *
 * @see {@link https://redwoodjs.com/docs/serverless-functions#security-considerations|Serverless Function Considerations}
 * in the RedwoodJS documentation for more information.
 *
 * @typedef { import('aws-lambda').APIGatewayEvent } APIGatewayEvent
 * @typedef { import('aws-lambda').Context } Context
 * @param { APIGatewayEvent } event - an object which contains information from the invoker.
 * @param { Context } context - contains information about the invocation,
 * function, and execution environment.
 */
export const handler = async (event: APIGatewayEvent, _context: Context) => {
  logger.info(`${event.httpMethod} ${event.path}: game function`)
  console.log('event', event)

  let returnData = {}

  if (event.path === '/game') {
    if (event.httpMethod === 'PUT') {
      console.log('Create a new game')
      returnData = newGame()
    } else if (event.httpMethod === 'POST') {
      const body = JSON.parse(event.body)
      console.log('Join game', body.gameId)
      returnData = joinGame(body.gameId, body.name)
    }
  } else if (event.path.split('/').length === 3) {
    const gameId = event.path.split('/')[2]
    console.log('Sync game', gameId)
    syncGame(gameId)
  } else if (event.path.split('/').length === 5) {
    const gameId = event.path.split('/')[2]
    const playerId = event.path.split('/')[3]

    if (event.path.endsWith('/hand') && event.httpMethod === 'PUT') {
      console.log('Put card', gameId, playerId, event.body)
      const card = await deal(gameId, playerId)
      console.log('Dealt card', card)
    } else if (event.path.endsWith('/hand') && event.httpMethod === 'DELETE') {
      console.log('Delete card', gameId, playerId, event.body)
      const body = JSON.parse(event.body)
      const card = await discardCard(gameId, playerId, body.card)
      console.log('Discarded card', card)
    }
  }

  return {
    statusCode: 200,
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(returnData),
  }
}
