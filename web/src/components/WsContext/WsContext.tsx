import React, {
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from 'react'

interface Card {
  suite: 'SPADES' | 'CLUBS' | 'HEARTS' | 'DIAMONDS'
  value: number
}

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

interface GameValues {
  player1Hand: [
    Card | UnknownCard,
    Card | UnknownCard,
    Card | UnknownCard,
    Card | UnknownCard,
    Card | UnknownCard
  ]
  player2Hand: [
    Card | UnknownCard,
    Card | UnknownCard,
    Card | UnknownCard,
    Card | UnknownCard,
    Card | UnknownCard
  ]
}

export type WsValue = [boolean, GameValues, WebSocket['send'] | undefined]

interface WsContextProps {
  game: Game
  playerId: string
  register: (gameId: string, playerId: string) => void
}

// const WsContext = React.createContext<WsValue | undefined>(undefined)
const WsContext = React.createContext<WsContextProps | undefined>(undefined)

interface Props {
  children: React.ReactNode
}

const WsContextProvider: React.FC<Props> = ({ children }) => {
  // const [isReady, setIsReady] = useState(false)
  const [playerId, setPlayerId] = useState('')
  const playerIdRef = useRef<string>()
  // const [gameId, setGameId] = useState('')
  const [game, setGame] = useState<Game>()

  const ws = useRef<WebSocket>()

  useEffect(() => {
    const socket = new WebSocket('ws://localhost:8911/ws')

    // socket.onopen = () => setIsReady(true)
    // socket.onclose = () => setIsReady(false)
    socket.onmessage = (event) => {
      console.log('onmessage', event.data)
      const data = JSON.parse(event.data)
      if (data.type === 'PLAYERS') {
        console.log('PLAYERS', data.players)

        setGame((game) => {
          const me = game?.players.find((p) => p.id === playerIdRef.current)

          const players = data.players.map((player) => {
            if (player.id === me?.id) {
              return {
                ...player,
                hand: me.hand,
              }
            }

            return player
          })

          return { ...game, players }
        })
      } else if (data.type === 'UPDATE') {
        console.log('UPDATE', data.player)
        setGame((game) => {
          const players = game.players.map((player) => {
            if (player.id === data.player.id) {
              return data.player
            }

            return player
          })

          console.log('new game', { ...game, players })

          return { ...game, players }
        })
      }
    }

    ws.current = socket

    return () => {
      socket.close()
    }
  }, [])

  // const ret: WsValue = [isReady, val, ws.current?.send.bind(ws.current)]
  const register = useCallback((gameId: string, playerId: string) => {
    setPlayerId(playerId)
    playerIdRef.current = playerId
    ws.current?.send(JSON.stringify({ cmd: 'REGISTER', playerId, gameId }))
  }, [])

  return (
    <WsContext.Provider value={{ game, playerId, register }}>
      {children}
    </WsContext.Provider>
  )
}

export function useWsContext() {
  const context = useContext(WsContext)

  if (!context) {
    throw new Error(
      'useScaffoldContext must be used within a ScaffoldContextProvider'
    )
  }

  return context
}

export default WsContextProvider
