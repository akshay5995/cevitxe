import { collection, deleteCollectionItems, purgeDeletedCollectionItems } from './collection'
import { docSetFromObject, docSetToObject } from './docSetHelpers'

describe('selectors', () => {
  const name = 'teachers'
  const teachersCollection = collection(name)

  const reduxState = {
    [teachersCollection.keyName]: {
      1: true,
      2: false,
      3: true,
    },
    1: { id: '1', type: 'teacher' },
    2: { id: '2', type: 'teacher' },
    3: { id: '3', type: 'teacher' },
  }

  describe('getAll', () => {
    it('should only return non-deleted items for the collection', () => {
      const actual = teachersCollection.getAll(reduxState)
      expect(actual).toEqual([reduxState[1], reduxState[3]])
    })

    it('should return empty array if state is undefined', () => {
      const actual = teachersCollection.getAll(undefined)
      expect(actual).toEqual([])
    })

    it('should return empty array if collection index does not exist', () => {
      const state = { ...reduxState }
      delete state[teachersCollection.keyName]
      const actual = teachersCollection.getAll(state)
      expect(actual).toEqual([])
    })
  })

  describe('count', () => {
    it('should return the number of non-deleted items for the collection', () => {
      const actual = teachersCollection.count(reduxState)
      expect(actual).toEqual(2)
    })

    it('should return zero if state is undefined', () => {
      const actual = teachersCollection.count(undefined)
      expect(actual).toEqual(0)
    })

    it('should return zero if collection index does not exist', () => {
      const state = { ...reduxState }
      delete state[teachersCollection.keyName]
      const actual = teachersCollection.count(state)
      expect(actual).toEqual(0)
    })
  })
})

describe('deleteCollectionItems', () => {
  const docSet = docSetFromObject({
    teachers: {
      1: true,
      2: true,
      3: true,
    },
    1: { id: '1', type: 'teacher' },
    2: { id: '2', type: 'teacher' },
    3: { id: '3', type: 'teacher' },

    schools: {
      4: true,
      5: true,
    },
    4: { id: '4', type: 'school' },
    5: { id: '4', type: 'school' },
  })

  it('should remove all items listed in index', () => {
    deleteCollectionItems(docSet, 'teachers')
    expect(docSetToObject(docSet)).toEqual({
      teachers: {
        1: false,
        2: false,
        3: false,
      },

      schools: {
        4: true,
        5: true,
      },
      4: { id: '4', type: 'school' },
      5: { id: '4', type: 'school' },
    })
  })
})

describe('purgeDeletedCollectionItems', () => {
  const docSet = docSetFromObject({
    teachers: {
      1: true,
      2: false,
      3: false,
    },
    1: { id: '1', type: 'teacher' },
    2: { id: '2', type: 'teacher' },
    3: { id: '3', type: 'teacher' },

    schools: {
      4: true,
      5: true,
    },
    4: { id: '4', type: 'school' },
    5: { id: '5', type: 'school' },
  })

  it('should remove all docs marked as deleted in the index', () => {
    purgeDeletedCollectionItems(docSet, 'teachers')
    expect(docSetToObject(docSet)).toEqual({
      teachers: {
        1: true,
        2: false,
        3: false,
      },
      1: { id: '1', type: 'teacher' },

      schools: {
        4: true,
        5: true,
      },
      4: { id: '4', type: 'school' },
      5: { id: '5', type: 'school' },
    })
  })
})
