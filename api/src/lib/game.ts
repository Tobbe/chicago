import nanoid from 'nanoid'

import { broadcast, message } from '../../server.config'

interface UnknownCard {
  suite: 'UNKNOWN'
  value: 0
}

interface Player {
  id?: string
  name?: string
  score: number
  hand: Array<Card | UnknownCard>
  played: Array<Card>
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

function uniqueGameId(games: Game[]) {
  let id: string

  do {
    id = Math.random()
      .toString(36)
      .slice(2, 6)
      .toUpperCase()
      // I is sometimes difficult to distinguish from 1, so let's replace it with L
      .replaceAll('I', 'L')
      // O is difficult to distinguish from 0, so let's replace it with Q
      .replaceAll('O', 'Q')
      // 0 is difficult to distinguish from O, so let's replace it with 8
      .replaceAll('0', '9')
  } while (games.find((g) => g.id === id))

  return id
}

export function newGame() {
  const game: Game = {
    id: uniqueGameId(games),
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
    played: [],
    dealer: game.players.length === 0 ? true : false,
  })

  broadcast(gameId, {
    type: 'PLAYERS',
    players: game.players.map((player) => {
      const hand = player.hand.map(() => {
        return { suite: 'UNKNOWN', value: 0 }
      })

      return {
        ...player,
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
    players: game.players.map((player) => {
      const hand = player.hand.map(() => {
        return { suite: 'UNKNOWN', value: 0 }
      })

      return {
        ...player,
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

  player.hand = player.hand.filter(
    (c) => c.suite !== card.suite || c.value !== card.value
  )

  broadcast(gameId, {
    type: 'PLAYERS',
    players: game.players.map((player) => {
      const hand = player.hand.map(() => {
        return { suite: 'UNKNOWN', value: 0 }
      })

      return {
        ...player,
        hand,
      }
    }),
  })
  updatePlayer(gameId, playerId)
}

export function playCard(gameId: string, playerId: string, card: Card) {
  const game = games.find((game) => game.id === gameId)

  if (!game) {
    throw new Error('Can not find game ' + gameId)
  }

  const player = game.players.find((player) => player.id === playerId)

  if (!player) {
    throw new Error('Can not find player ' + playerId)
  }

  console.log('play card', card)

  const hand = player.hand.filter(
    (c) => c.suite !== card.suite || c.value !== card.value
  )

  console.log('hand after playing', hand)

  if (hand.length === player.hand.length - 1) {
    player.hand = hand
    player.played.push(card)
  }

  broadcast(gameId, {
    type: 'PLAYERS',
    players: game.players.map((player) => {
      const hand = player.hand.map(() => {
        return { suite: 'UNKNOWN', value: 0 }
      })

      return {
        ...player,
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

  const newCard = game.deck.pop()

  player.hand.push(newCard)

  broadcast(gameId, {
    type: 'PLAYERS',
    players: game.players.map((player) => {
      const hand = player.hand.map(() => {
        return { suite: 'UNKNOWN', value: 0 }
      })

      return {
        ...player,
        hand,
      }
    }),
  })
  updatePlayer(gameId, playerId)

  return newCard
}

/**
 * Clear all players hands and played cards, and switch dealer (round-robin
 * style). Finally we shuffle the deck.
 */
export function nextRound(gameId: string, playerId: string) {
  const game = games.find((game) => game.id === gameId)

  if (!game) {
    throw new Error('Can not find game ' + gameId)
  }

  const player = game.players.find((player) => player.id === playerId)

  if (!player) {
    throw new Error('Can not find player ' + playerId)
  }

  let currentDealerIndex = 0
  game.players.forEach((player, index) => {
    player.hand = []
    player.played = []

    if (player.dealer) {
      player.dealer = false
      currentDealerIndex = index
    }
  })

  if (currentDealerIndex === game.players.length - 1) {
    game.players[0].dealer = true
  } else {
    game.players[currentDealerIndex + 1].dealer = true
  }

  game.deck = shuffledDeck()

  broadcast(gameId, {
    type: 'PLAYERS',
    players: game.players.map((player) => {
      const hand = player.hand.map(() => {
        return { suite: 'UNKNOWN', value: 0 }
      })

      return {
        ...player,
        hand,
      }
    }),
  })

  game.players.forEach((player) => {
    updatePlayer(gameId, player.id)
  })
}

export function score(gameId: string, playerId: string, score: number) {
  const game = games.find((game) => game.id === gameId)

  if (!game) {
    throw new Error('Can not find game ' + gameId)
  }

  const player = game.players.find((player) => player.id === playerId)

  if (!player) {
    throw new Error('Can not find player ' + playerId)
  }

  player.score = score

  broadcast(gameId, {
    type: 'PLAYERS',
    players: game.players.map((player) => {
      const hand = player.hand.map(() => {
        return { suite: 'UNKNOWN', value: 0 }
      })

      return {
        ...player,
        hand,
      }
    }),
  })
  // updatePlayer(gameId, playerId)

  return score
}
