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

async function discard(
  gameId: string,
  playerId: string,
  card: { suite: string; value: number }
) {
  console.log('deal to player', playerId)
  return fetch(`/.redwood/functions/game/${gameId}/${playerId}/hand`, {
    method: 'DELETE',
    body: JSON.stringify({ card }),
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
  const [playerId, setPlayerId] = useState('')

  const me = game?.players.find((p) => p.id === playerId)

  console.log('game', game)
  console.log('me', me)

  return (
    <>
      <MetaTags title="Home" description="Home page" />

      {createdGameId && <p>Ask other players to join {createdGameId}</p>}

      {game?.players.map((player) => {
        if (player.id === playerId) {
          return null
        }

        return (
          <div key={player.id}>
            <h1>{player.name}</h1>
            <div className="cards">
              {[...player.hand].map((card, index) => (
                <div key={index}>
                  {card.played ? (
                    <div className="card">
                      <img
                        src={card.suite[0].toLowerCase() + card.value + '.png'}
                        alt={card.suite + ' ' + card.value}
                      />
                    </div>
                  ) : card.discarded ? (
                    <div></div>
                  ) : (
                    <div className="card">
                      <img src="back.png" alt="Hidden card" />
                    </div>
                  )}
                </div>
              ))}
            </div>
            {me?.dealer && (
              <button
                onClick={() => {
                  console.log('deal', player.id)
                  deal(createdGameId || gameId, player.id)
                }}
              >
                Deal
              </button>
            )}
          </div>
        )
      })}

      {me && (
        <div>
          <h1>{me.name}</h1>
          <div className="cards">
            {[...me.hand].map((card, index) => (
              <div key={index}>
                {card.suite !== 'UNKNOWN' && !card.discarded && (
                  <>
                    <div key={index} className="card">
                      <img
                        src={card.suite[0].toLowerCase() + card.value + '.png'}
                        alt={card.suite + ' ' + card.value}
                      />
                    </div>
                    <button
                      onClick={() => {
                        discard(createdGameId || gameId, playerId, card)
                      }}
                    >
                      Discard
                    </button>
                  </>
                )}
              </div>
            ))}
          </div>
          {me.dealer && (
            <button
              onClick={() => {
                console.log('deal', me.id)
                deal(createdGameId || gameId, me.id)
              }}
            >
              Deal
            </button>
          )}
        </div>
      )}

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
            setPlayerId(playerId)
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
          setPlayerId(playerId)
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
