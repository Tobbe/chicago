import nanoid from 'nanoid'

import { broadcast, message } from '../../server.config'

interface PlayerCard extends Card {
  played: boolean
  discarded: boolean
}

interface Player {
  id?: string
  name?: string
  score: number
  hand: Array<PlayerCard>
  dealer?: boolean
}

interface Game {
  id: string
  players: Array<Player>
  deck: Array<Card>
}

const games: Array<Game> = []

interface Card {
  suite: 'SPADES' | 'CLUBS' | 'HEARTS' | 'DIAMONDS'
  value: number
}

const DECK: Array<Card> = [
  { suite: 'SPADES', value: 2 },
  { suite: 'SPADES', value: 3 },
  { suite: 'SPADES', value: 4 },
  { suite: 'SPADES', value: 5 },
  { suite: 'SPADES', value: 6 },
  { suite: 'SPADES', value: 7 },
  { suite: 'SPADES', value: 8 },
  { suite: 'SPADES', value: 9 },
  { suite: 'SPADES', value: 10 },
  { suite: 'SPADES', value: 11 },
  { suite: 'SPADES', value: 12 },
  { suite: 'SPADES', value: 13 },
  { suite: 'SPADES', value: 14 },
  { suite: 'CLUBS', value: 2 },
  { suite: 'CLUBS', value: 3 },
  { suite: 'CLUBS', value: 4 },
  { suite: 'CLUBS', value: 5 },
  { suite: 'CLUBS', value: 6 },
  { suite: 'CLUBS', value: 7 },
  { suite: 'CLUBS', value: 8 },
  { suite: 'CLUBS', value: 9 },
  { suite: 'CLUBS', value: 10 },
  { suite: 'CLUBS', value: 11 },
  { suite: 'CLUBS', value: 12 },
  { suite: 'CLUBS', value: 13 },
  { suite: 'CLUBS', value: 14 },
  { suite: 'HEARTS', value: 2 },
  { suite: 'HEARTS', value: 3 },
  { suite: 'HEARTS', value: 4 },
  { suite: 'HEARTS', value: 5 },
  { suite: 'HEARTS', value: 6 },
  { suite: 'HEARTS', value: 7 },
  { suite: 'HEARTS', value: 8 },
  { suite: 'HEARTS', value: 9 },
  { suite: 'HEARTS', value: 10 },
  { suite: 'HEARTS', value: 11 },
  { suite: 'HEARTS', value: 12 },
  { suite: 'HEARTS', value: 13 },
  { suite: 'HEARTS', value: 14 },
  { suite: 'DIAMONDS', value: 2 },
  { suite: 'DIAMONDS', value: 3 },
  { suite: 'DIAMONDS', value: 4 },
  { suite: 'DIAMONDS', value: 5 },
  { suite: 'DIAMONDS', value: 6 },
  { suite: 'DIAMONDS', value: 7 },
  { suite: 'DIAMONDS', value: 8 },
  { suite: 'DIAMONDS', value: 9 },
  { suite: 'DIAMONDS', value: 10 },
  { suite: 'DIAMONDS', value: 11 },
  { suite: 'DIAMONDS', value: 12 },
  { suite: 'DIAMONDS', value: 13 },
  { suite: 'DIAMONDS', value: 14 },
]

function shuffledDeck() {
  const deck = [...DECK]
  const shuffledDeck = []

  while (deck.length > 0) {
    const randomIndex = Math.floor(Math.random() * deck.length)
    const card = deck.splice(randomIndex, 1)[0]
    shuffledDeck.push(card)
  }

  return shuffledDeck
}

function card(deck: Array<Card>) {
  return { ...deck.pop(), played: false, discarded: false }
}

function updatePlayer(gameId: string, playerId: string) {
  const game = games.find((game) => game.id === gameId)

  if (!game) {
    throw new Error('Can not find game ' + gameId)
  }

  const player = game.players.find((p) => p.id === playerId)

  if (!player) {
    throw new Error('Can not find player ' + playerId)
  }

  console.log('sending update for player', player)

  message(gameId, playerId, {
    type: 'UPDATE',
    player,
  })
}

export function newGame() {
  const game: Game = {
    id: nanoid(),
    players: [],
    deck: shuffledDeck(),
  }

  games.push(game)

  return game.id
}

export function joinGame(gameId: string, name: string) {
  const game = games.find((game) => game.id === gameId)

  if (!game) {
    throw new Error('Game not found ' + gameId)
  }

  if (game.players.find((p) => p.name === name)) {
    throw new Error('Player ' + name + ' already exists')
  }

  game.players.push({
    id: nanoid(),
    name,
    score: 0,
    hand: [],
    dealer: game.players.length === 0 ? true : false,
  })

  broadcast(gameId, {
    type: 'PLAYERS',
    players: game.players.map((p) => {
      const hand = p.hand.map((c) => {
        if (c.played) {
          return c
        } else {
          // Whoever receives this can't trust suite and value because played is false
          return { ...c, suite: 'UNKNOWN', value: 0 }
        }
      })

      return {
        ...p,
        hand,
      }
    }),
  })

  return game.players.at(-1).id
}

export function syncGame(gameId: string) {
  const game = games.find((game) => game.id === gameId)

  if (!game) {
    throw new Error('Can not find game ' + gameId)
  }

  broadcast(gameId, {
    type: 'PLAYERS',
    players: game.players.map((p) => {
      const hand = p.hand.map((c) => {
        if (c.played) {
          return c
        } else {
          // Whoever receives this can't trust suite and value because played is false
          return { ...c, suite: 'UNKNOWN', value: 0 }
        }
      })

      return {
        ...p,
        hand,
      }
    }),
  })
}

export function discardCard(gameId: string, playerId: string, card: Card) {
  const game = games.find((game) => game.id === gameId)

  if (!game) {
    throw new Error('Can not find game ' + gameId)
  }

  const player = game.players.find((player) => player.id === playerId)

  if (!player) {
    throw new Error('Can not find player ' + playerId)
  }

  const playerCard = player.hand.find(
    (pC) => pC.suite === card.suite && pC.value === card.value
  )

  if (playerCard) {
    playerCard.discarded = true
  }

  broadcast(gameId, {
    type: 'PLAYERS',
    players: game.players.map((p) => {
      const hand = p.hand.map((c) => {
        if (c.played) {
          return c
        } else {
          // Whoever receives this can't trust suite and value because played is false
          return { ...c, suite: 'UNKNOWN', value: 0 }
        }
      })

      return {
        ...p,
        hand,
      }
    }),
  })
  updatePlayer(gameId, playerId)
}

export function deal(gameId: string, playerId: string) {
  const game = games.find((game) => game.id === gameId)

  if (!game) {
    throw new Error('Can not find game ' + gameId)
  }
  const player = game.players.find((player) => player.id === playerId)

  if (!player) {
    throw new Error('Can not find player ' + playerId)
  }

  if (game.deck.length === 0) {
    throw new Error('Deck is empty')
  }

  const newCard = card(game.deck)

  player.hand.push(newCard)

  broadcast(gameId, {
    type: 'PLAYERS',
    players: game.players.map((p) => {
      const hand = p.hand.map((c) => {
        if (c.played) {
          return c
        } else {
          // Whoever receives this can't trust suite and value because played is false
          return { ...c, suite: 'UNKNOWN', value: 0 }
        }
      })

      return {
        ...p,
        hand,
      }
    }),
  })
  updatePlayer(gameId, playerId)

  return newCard
}
