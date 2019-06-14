import automerge from 'automerge'
import { Buffer } from 'buffer'
import hypercore from 'hypercore'
import crypto from 'hypercore-crypto'
import pump from 'pump'
import rai from 'random-access-idb'
//import reduceReducers from 'reduce-reducers'
import {
  applyMiddleware,
  createStore as reduxCreateStore,
  Middleware,
  Reducer,
  Store,
} from 'redux'
import signalhub from 'signalhub'
import swarm from 'webrtc-swarm'
//import { adaptReducer } from './adaptReducer'
import { initialize } from './initialize'
import { actions } from './actions'
import { mockCrypto } from './mockCrypto'
import { CevitxeStoreOptions } from './types'

const CevitxeFeed = () => {
  let feed: Feed<any>
  let key: Key
  let secretKey: Key
  let databaseName: string
  let peerHubs: Array<string>
  let reduxStore: Store

  const createStore = (options: CevitxeStoreOptions): Promise<Store> => {
    return new Promise((resolve, _) => {
      if (!options.key)
        throw new Error('Key is required, should be XXXX in length')
      // hypercore seems to be happy when I turn the key into a discoveryKey,
      // maybe we could get away with just using a Buffer (or just calling discoveryKey with a string?)
      key = crypto.discoveryKey(Buffer.from(options.key))
      if (!options.secretKey)
        throw new Error('Secret key is required, should be XXXX in length')
      // hypercore doesn't seem to like the secret key being a discoveryKey,
      // but rather just a Buffer
      secretKey = Buffer.from(options.secretKey)

      databaseName = options.databaseName || 'data'
      peerHubs = options.peerHubs || [
        'https://signalhub-jccqtwhdwc.now.sh/', // default public signaling server
      ]

      // Init an indexedDB
      const todos = rai(getStoreName())
      const storage = (filename: any) => todos(filename)

      // Create a new hypercore feed
      feed = hypercore(storage, key, {
        secretKey: secretKey,
        valueEncoding: 'utf-8',
        crypto: mockCrypto,
      })
      feed.on('error', (err: any) => console.log(err))

      feed.on('ready', () => {
        console.log('ready', key.toString('hex'))
        console.log('discovery', feed.discoveryKey.toString('hex'))
        joinSwarm()

        reduxStore = createReduxStore({
          ...options,
          preloadedState: feed.length === 0 ? options.preloadedState : null,
        })

        if (feed.length === 0) {
          // Write the initial automerge state to the feed
          const storeState = reduxStore.getState()
          const history = automerge.getChanges(automerge.init(), storeState)
          history.forEach(c => feed.append(JSON.stringify(c)))
          console.log('writing initial state to feed')
        }
        resolve(reduxStore)
      })

      startStreamReader()
    })
  }

  const feedMiddleware: Middleware = store => next => action => {
    const prevState = store.getState()
    const result = next(action)
    // Don't re-write items to the feed
    if (action.payload.fromCevitxe) {
      console.log('already from cevitxe, skipping the feed write')
      return result
    }
    const nextState = store.getState()
    const existingState = prevState ? prevState : automerge.init()
    console.log('existingState', existingState)
    console.log('nextState', nextState)
    const changes = automerge.getChanges(existingState, nextState)
    changes.forEach(c => feed.append(JSON.stringify(c)))
    return result
  }

  // Read items from this and peer feeds,
  // then dispatch them to our redux store
  const startStreamReader = () => {
    // Wire up reading from the feed
    const stream = feed.createReadStream({ live: true })
    stream.on('data', (value: string) => {
      try {
        const change = JSON.parse(value)
        console.log('onData', change)
        reduxStore.dispatch(actions.applyChange(change))
      } catch (err) {
        console.log('%c feed read err', 'color: red;', err)
        console.log('%c feed value', 'color: red;', value)
      }
    })
  }

  // Join our feed to the swarm and accept peers
  const joinSwarm = () => {
    // could add option to disallow peer connectivity here
    const hub = signalhub(getKeyHex(), peerHubs)
    const sw = swarm(hub)
    sw.on('peer', onPeerConnect)
  }

  // When a feed peer connects, replicate our feed to them
  const onPeerConnect = (peer: any, id: any) => {
    console.log('peer', id, peer)
    pump(
      peer,
      feed.replicate({
        encrypt: false,
        live: true,
        upload: true,
        download: true,
      }),
      peer
    )
  }

  const getKeyHex = () => key.toString('hex')
  // I'm constructing a name here using the key because re-using the same name
  // with different keys throws an error "Another hypercore is stored here"
  const getStoreName = () => `${databaseName}-${getKeyHex().substr(0, 12)}`

  const createReduxStore = (options: CevitxeStoreOptions) => {
    let initialState: any
    let optionMiddlewares = options.middlewares ? options.middlewares : []
    const middlewares = [...optionMiddlewares, feedMiddleware]
    // check
    //if (enhancer !== undefined) middlewares.push(enhancer)

    console.log('adding a feed-enabled reducer here')

    // TODO: Automatically apply adaptReducer so the user doesn't have to do it
    // Add the cevitxe reducer at the same level as the user's reducer
    // This allows us to operate at the root state and the user can still
    // have nested state reducers.
    // note: Casting these as Reducer may not be right
    // const combinedReducers = reduceReducers(
    //   null,
    //   adaptReducer as Reducer,
    //   reducer as Reducer
    // )

    if (options.preloadedState) {
      // Convert the plain object preloadedState to Automerge using initialize()
      initialState = initialize(options.preloadedState)
      console.log('creating redux store with initial state', initialState)
      return reduxCreateStore(
        options.reducer,
        initialState,
        applyMiddleware(...middlewares)
      )
    }
    console.log('creating redux store without initial state')
    return reduxCreateStore(
      options.reducer as Reducer,
      applyMiddleware(...middlewares)
    )
  }

  return { createStore }
}

const feedInstance = CevitxeFeed()
export const { createStore } = feedInstance
