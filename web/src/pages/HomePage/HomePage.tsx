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

async function nextRound(gameId: string, playerId: string) {
  console.log('next round', playerId)
  return fetch(`/.redwood/functions/game/${gameId}/round`, {
    method: 'PUT',
    body: JSON.stringify({ playerId }),
  }).then((res) => res.json())
}

async function discard(
  gameId: string,
  playerId: string,
  card: { suite: string; value: number }
) {
  console.log('player', playerId, 'discards card', card)
  // TODO: This and others like it should be
  // /game/{id}/player/{id}/hand
  return fetch(`/.redwood/functions/game/${gameId}/${playerId}/hand`, {
    method: 'DELETE',
    body: JSON.stringify({ card }),
  }).then((res) => res.json())
}

async function play(
  gameId: string,
  playerId: string,
  card: { suite: string; value: number }
) {
  console.log('player', playerId, 'plays card', card)
  return fetch(`/.redwood/functions/game/${gameId}/${playerId}/hand`, {
    method: 'POST',
    body: JSON.stringify({ card }),
  }).then((res) => res.json())
}

async function score(gameId: string, playerId: string, score: number) {
  console.log('set player score', playerId, score)
  return fetch(`/.redwood/functions/game/${gameId}/player/${playerId}`, {
    method: 'POST',
    body: JSON.stringify({ score }),
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
            <header>
              <h1>{player.name}</h1>
              <label>
                Score:
                <input
                  type="text"
                  onChange={(e) => {
                    console.log('new score', e.target.value)
                    // Write to me.score to quickly update the value shown in
                    // the input. This will then be overwritten when the game
                    // is updated by the websocket
                    player.score = parseInt(e.target.value || '0', 10)
                    score(createdGameId || gameId, player.id, player.score)
                  }}
                  value={player.score}
                />
              </label>
            </header>
            <p>Hand</p>
            <div className="cards">
              {player.hand.map((_card, index) => (
                <div key={index} className="card">
                  <img src="back.png" alt="Hidden card" />
                </div>
              ))}
            </div>
            <p>Played</p>
            <div className="cards cards-played">
              {player.played.map((card, index) => (
                <div key={index} className="card">
                  <img
                    src={card.suite[0].toLowerCase() + card.value + '.png'}
                    alt={card.suite + ' ' + card.value}
                  />
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
          <header>
            <h1>{me.name}</h1>
            <label>
              Score:
              <input
                type="text"
                onChange={(e) => {
                  console.log('new score', e.target.value)
                  // Write to me.score to quickly update the value shown in the
                  // input. This will then be overwritten when the game is
                  // updated by the websocket
                  me.score = parseInt(e.target.value || '0', 10)
                  score(createdGameId || gameId, me.id, me.score)
                }}
                value={me.score}
              />
            </label>
          </header>
          <p>Played</p>
          <div className="cards cards-played">
            {me.played.map((card, index) => (
              <div key={index} className="card">
                <img
                  src={card.suite[0].toLowerCase() + card.value + '.png'}
                  alt={card.suite + ' ' + card.value}
                />
              </div>
            ))}
          </div>
          <p>Hand</p>
          <div className="cards">
            {me.hand.map((card, index) => (
              <div key={index}>
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
                <button
                  onClick={() => {
                    play(createdGameId || gameId, playerId, card)
                  }}
                >
                  Play
                </button>
              </div>
            ))}
          </div>
          {me.dealer && (
            <>
              <button
                onClick={() => {
                  deal(createdGameId || gameId, me.id)
                }}
              >
                Deal
              </button>
              <button
                onClick={() => {
                  nextRound(createdGameId || gameId, me.id)
                }}
              >
                Next round
              </button>
            </>
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
