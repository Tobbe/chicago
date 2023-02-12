// import useSWR from 'swr'
import { useState } from 'react'

import useSWRMutation from 'swr/mutation'

import { MetaTags } from '@redwoodjs/web'

import { useWsContext } from 'src/components/WsContext/WsContext'

// const fetcher = (...args) => fetch(...args).then((res) => res.json())
// async function fetcher<JSON = any>(
//   input: RequestInfo,
//   init?: RequestInit
// ): Promise<JSON> {
//   const res = await fetch(input, init)
//   return res.json()
// }
// const { data } = useSWR<{
//   forks_count: number
//   stargazers_count: number
//   watchers: number
// }>('/api/data?id=' + id, fetch)

async function putRequest(url, { arg }) {
  return fetch(url, {
    method: 'PUT',
    body: JSON.stringify(arg),
  }).then((res) => res.json())
}

async function postRequest(url, { arg }) {
  return fetch(url, {
    method: 'POST',
    body: JSON.stringify(arg),
  }).then((res) => res.json())
}

// async function getRequest(url, { arg }) {
//   return fetch(url, {
//     method: 'GET',
//     body: JSON.stringify(arg),
//   }).then((res) => res.json())
// }

async function syncGame(gameId: string) {
  console.log('sync game', gameId)
  return fetch('/.redwood/functions/game/' + gameId, {
    method: 'GET',
  }).then((res) => res.json())
}

async function deal(gameId: string, playerId: string) {
  console.log('deal to player', playerId)
  return fetch(`/.redwood/functions/game/${gameId}/${playerId}/hand`, {
    method: 'PUT',
  }).then((res) => res.json())
}

const HomePage = () => {
  const { register, game } = useWsContext()
  const { trigger: createGame, isMutating: isCreatingGame } = useSWRMutation(
    '/.redwood/functions/game',
    putRequest /* options */
  )
  const { trigger: joinGame, isMutating: isJoiningGame } = useSWRMutation(
    '/.redwood/functions/game',
    postRequest /* options */
  )
  // const { trigger: syncGame, isMutating: isSyncingGame } = useSWRMutation(
  //   '/.redwood/functions/game',
  //   getRequest /* options */
  // )
  const [gameId, setGameId] = useState('')
  const [createdGameId, setCreatedGameId] = useState('')
  const [name, setName] = useState('')

  console.log('game', game)

  return (
    <>
      <MetaTags title="Home" description="Home page" />

      {createdGameId && <p>Ask other players to join {createdGameId}</p>}

      {game?.players.map((player, index) => (
        <div key={player.id}>
          <h1>{player.name}</h1>
          <div>
            {[...player.hand].map((card, index) => (
              <div key={index}>
                {card.played ? (
                  <div key={index} className="card">
                    {card.suite} {card.value}
                  </div>
                ) : (
                  <div key={index}>Hidden</div>
                )}
              </div>
            ))}
          </div>
          <button
            onClick={() => {
              console.log('deal', player.id)
              deal(createdGameId || gameId, player.id)
            }}
          >
            Deal
          </button>
        </div>
      ))}

      <div>
        <label htmlFor="name">Your name</label>
        <input
          id="name"
          name="name"
          type="text"
          value={name}
          onChange={(event) => {
            setName(event.target.value)
          }}
        />
      </div>
      <div>
        <button
          onClick={async () => {
            const gameId = await createGame()
            setCreatedGameId(gameId)
            console.log('gameId', gameId)
            const playerId = await joinGame({ gameId, name })
            console.log('playerId', playerId)
            register(gameId, playerId)
            // TODO: Make `register` async and have it wait for ACK
            await new Promise((resolve) => setTimeout(resolve, 300))
            await syncGame(gameId)
          }}
          disabled={isCreatingGame}
        >
          Create Game
        </button>
      </div>

      <div>
        <label htmlFor="gameId">Game ID</label>
        <input
          id="gameId"
          name="gameId"
          type="text"
          value={gameId}
          onChange={(event) => {
            setGameId(event.target.value)
          }}
        />
      </div>
      <button
        onClick={async () => {
          const playerId = await joinGame({ gameId, name })
          console.log('playerId', playerId)
          register(gameId, playerId)
          // TODO: Make `register` async and have it wait for ACK
          await new Promise((resolve) => setTimeout(resolve, 300))
          await syncGame(gameId)
        }}
        disabled={isJoiningGame}
      >
        Join Game
      </button>
    </>
  )
}

export default HomePage
