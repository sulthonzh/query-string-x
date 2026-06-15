import { strict as assert } from 'node:assert'
import { test } from 'node:test'
import * as qs from '../index.js'

// Basic parsing tests
test('parse basic query string', () => {
  const result = qs.parse('foo=bar&baz=qux')
  assert.deepEqual(result, { foo: 'bar', baz: 'qux' })
})

test('parse query string with empty values', () => {
  const result = qs.parse('foo=&bar=baz')
  assert.deepEqual(result, { foo: '', bar: 'baz' })
})

test('parse query string with null values', () => {
  const result = qs.parse('foo=null&bar=undefined')
  assert.deepEqual(result, { foo: 'null', bar: 'undefined' })
})

// Number parsing tests
test('parse numbers', () => {
  const result = qs.parse('foo=123&bar=-456&baz=0')
  assert.deepEqual(result, { foo: 123, bar: -456, baz: 0 })
})

test('parse decimal numbers', () => {
  const result = qs.parse('foo=123.45&bar=0.5&baz=-99.99')
  assert.deepEqual(result, { foo: 123.45, bar: 0.5, baz: -99.99 })
})

test('parse numbers as strings when strictNumbers=true', () => {
  const result = qs.parse('foo=123&bar=456', { strictNumbers: true })
  assert.deepEqual(result, { foo: '123', bar: '456' })
})

// Boolean parsing tests
test('parse booleans', () => {
  const result = qs.parse('foo=true&bar=false&baz=1&qux=0')
  assert.deepEqual(result, { foo: true, bar: false, baz: true, qux: false })
})

test('parse booleans with words', () => {
  const result = qs.parse('foo=yes&bar=no&baz=on&qux=off')
  assert.deepEqual(result, { foo: true, bar: false, baz: true, qux: false })
})

test('parse booleans as strings when strictBooleans=true', () => {
  const result = qs.parse('foo=true&bar=false', { strictBooleans: true })
  assert.deepEqual(result, { foo: 'true', bar: 'false' })
})

// Array parsing tests
test('parse arrays with brackets format', () => {
  const result = qs.parse('foo[]=1&foo[]=2&foo[]=3')
  assert.deepEqual(result, { foo: [1, 2, 3] })
})

test('parse arrays with repeat format', () => {
  const result = qs.parse('foo=1&foo=2&foo=3', { arrayFormat: 'repeat' })
  assert.deepEqual(result, { foo: [1, 2, 3] })
})

test('parse arrays with comma format', () => {
  const result = qs.parse('foo=1,2,3', { arrayFormat: 'comma' })
  assert.deepEqual(result, { foo: [1, 2, 3] })
})

test('parse arrays with custom separator', () => {
  const result = qs.parse('foo=1|2|3', { arrayFormat: 'comma', arraySeparator: '|' })
  assert.deepEqual(result, { foo: [1, 2, 3] })
})

// Date parsing tests
test('parse ISO dates', () => {
  const result = qs.parse('foo=2024-01-01T12:00:00Z&bar=2024-01-01T12:00:00.123Z')
  assert.deepEqual(result, { 
    foo: new Date('2024-01-01T12:00:00Z'), 
    bar: new Date('2024-01-01T12:00:00.123Z') 
  })
})

test('parse timestamp dates', () => {
  const timestamp = Math.floor(Date.now() / 1000)
  const result = qs.parse(`foo=${timestamp}`, { dateFormats: ['timestamp'] })
  assert.deepEqual(result, { foo: new Date(timestamp * 1000) })
})

// Nested object tests
test('parse nested objects', () => {
  const result = qs.parse('user.name=John&user.email=john@example.com&user.age=30')
  assert.deepEqual(result, { 
    user: { 
      name: 'John', 
      email: 'john@example.com', 
      age: 30 
    } 
  })
})

test('parse deeply nested objects', () => {
  const result = qs.parse('a.b.c.d=deep&e.f.g=h')
  assert.deepEqual(result, { 
    a: { 
      b: { 
        c: { 
          d: 'deep' 
        } 
      } 
    }, 
    e: { 
      f: { 
        g: 'h' 
      } 
    } 
  })
})

// Stringify tests
test('stringify basic object', () => {
  const result = qs.stringify({ foo: 'bar', baz: 'qux' })
  assert.equal(result, 'foo=bar&baz=qux')
})

test('stringify with numbers', () => {
  const result = qs.stringify({ foo: 123, bar: -456, baz: 0 })
  assert.equal(result, 'foo=123&bar=-456&baz=0')
})

test('stringify with booleans', () => {
  const result = qs.stringify({ foo: true, bar: false })
  assert.equal(result, 'foo=true&bar=false')
})

test('stringify with dates', () => {
  const date = new Date('2024-01-01T12:00:00Z')
  const result = qs.stringify({ foo: date })
  assert.equal(result, `foo=${date.toISOString()}`)
})

// Array stringify tests
test('stringify arrays with brackets format', () => {
  const result = qs.stringify({ foo: [1, 2, 3] }, { arrayFormat: 'brackets' })
  assert.equal(result, 'foo[]=1&foo[]=2&foo[]=3')
})

test('stringify arrays with repeat format', () => {
  const result = qs.stringify({ foo: [1, 2, 3] }, { arrayFormat: 'repeat' })
  assert.equal(result, 'foo=1&foo=2&foo=3')
})

test('stringify arrays with comma format', () => {
  const result = qs.stringify({ foo: [1, 2, 3] }, { arrayFormat: 'comma' })
  assert.equal(result, 'foo=1,2,3')
})

// Null/undefined handling tests
test('stringify nulls', () => {
  const result = qs.stringify({ foo: null, bar: 'value' })
  assert.equal(result, 'foo=null&bar=value')
})

test('stringify with strictNull option', () => {
  const result = qs.stringify({ foo: null, bar: 'value' }, { strictNull: true })
  assert.equal(result, 'foo=null&bar=value')
})

test('omit nulls when omitNulls=true', () => {
  const result = qs.stringify({ foo: null, bar: 'value', baz: undefined }, { omitNulls: true })
  assert.equal(result, 'bar=value')
})

// URL building tests
test('buildUrl with query', () => {
  const url = qs.buildUrl('/path', { foo: 'bar' })
  assert.equal(url, '/path?foo=bar')
})

test('buildUrl with hash', () => {
  const url = qs.buildUrl('/path', null, 'section')
  assert.equal(url, '/path#section')
})

test('buildUrl with query and hash', () => {
  const url = qs.buildUrl('/path', { foo: 'bar' }, 'section')
  assert.equal(url, '/path?foo=bar#section')
})

// Parse URL tests
test('parseUrl basic URL', () => {
  const result = qs.parseUrl('/path?foo=bar#section')
  assert.deepEqual(result, {
    pathname: '/path',
    query: { foo: 'bar' },
    hash: 'section',
    search: '?foo=bar'
  })
})

test('parseUrl without hash', () => {
  const result = qs.parseUrl('/path?foo=bar')
  assert.deepEqual(result, {
    pathname: '/path',
    query: { foo: 'bar' },
    hash: '',
    search: '?foo=bar'
  })
})

test('parseUrl without query', () => {
  const result = qs.parseUrl('/path#section')
  assert.deepEqual(result, {
    pathname: '/path',
    query: {},
    hash: 'section',
    search: ''
  })
})

// Merge tests
test('merge query objects', () => {
  const result = qs.merge({ foo: 'bar', baz: 'old' }, { baz: 'new', qux: 'added' })
  assert.deepEqual(result, { foo: 'bar', baz: 'new', qux: 'added' })
})

test('merge arrays with concat', () => {
  const result = qs.merge({ foo: [1, 2] }, { foo: [3, 4] }, { arrayMerge: 'concat' })
  assert.deepEqual(result, { foo: [1, 2, 3, 4] })
})

test('merge arrays with replace', () => {
  const result = qs.merge({ foo: [1, 2] }, { foo: [3, 4] }, { arrayMerge: 'replace' })
  assert.deepEqual(result, { foo: [3, 4] })
})

// Pick/Omit tests
test('pick specific keys', () => {
  const result = qs.pick({ foo: 'bar', baz: 'qux', qux: 'test' }, ['foo', 'qux'])
  assert.deepEqual(result, { foo: 'bar', qux: 'test' })
})

test('omit specific keys', () => {
  const result = qs.omit({ foo: 'bar', baz: 'qux', qux: 'test' }, ['baz'])
  assert.deepEqual(result, { foo: 'bar', qux: 'test' })
})

// Get/Set tests
test('get nested value', () => {
  const obj = { user: { profile: { name: 'John' } } }
  const result = qs.get(obj, 'user.profile.name')
  assert.equal(result, 'John')
})

test('get with default value', () => {
  const obj = { foo: 'bar' }
  const result = qs.get(obj, 'missing.key', 'default')
  assert.equal(result, 'default')
})

test('set nested value', () => {
  const obj = {}
  const result = qs.set(obj, 'user.profile.name', 'John')
  assert.deepEqual(result, { user: { profile: { name: 'John' } } })
})

// Edge cases
test('handle empty query string', () => {
  const result = qs.parse('')
  assert.deepEqual(result, {})
})

test('handle malformed query string', () => {
  const result = qs.parse('foo=bar&=baz&qux=')
  assert.deepEqual(result, { foo: 'bar', '': 'baz', qux: '' })
})

test('handle URL encoding/decoding', () => {
  const result = qs.parse('foo=hello%20world&bar=test%2Fpath')
  assert.deepEqual(result, { foo: 'hello world', bar: 'test/path' })
})

test('handle complex nested structures', () => {
  const query = 'user.name.first=John&user.name.last=Doe&user.contacts[]=email&user.contacts[]=phone&user.settings.theme=dark&user.settings.notifications[]=email&user.notifications[]=new'
  const result = qs.parse(query)
  
  assert.deepEqual(result, {
    user: {
      name: { first: 'John', last: 'Doe' },
      contacts: ['email', 'phone'],
      settings: { theme: 'dark', notifications: ['email'] },
      notifications: ['new']
    }
  })
})

test('round-trip parse/stringify', () => {
  const original = { foo: 'bar', baz: 123, qux: true, arr: [1, 2, 3], nested: { a: 'b' } }
  const stringified = qs.stringify(original)
  const parsed = qs.parse(stringified)
  assert.deepEqual(parsed, original)
})

// Custom options tests
test('custom encoding/decoding', () => {
  const result = qs.parse('foo=hello%20world', { 
    encode: false, 
    decode: false 
  })
  assert.deepEqual(result, { foo: 'hello%20world' })
})

test('sort keys', () => {
  const result = qs.stringify({ baz: 'qux', foo: 'bar' }, { sort: true })
  assert.equal(result, 'baz=qux&foo=bar')
})

test('URL prefix option', () => {
  const result = qs.stringify({ foo: 'bar' }, { url: true })
  assert.equal(result, '?foo=bar')
})

test('array format options', () => {
  const obj = { tags: ['js', 'ts', 'node'] }
  
  const brackets = qs.stringify(obj, { arrayFormat: 'brackets' })
  assert.equal(brackets, 'tags[]=js&tags[]=ts&tags[]=node')
  
  const repeat = qs.stringify(obj, { arrayFormat: 'repeat' })
  assert.equal(repeat, 'tags=js&tags=ts&tags=node')
  
  const comma = qs.stringify(obj, { arrayFormat: 'comma' })
  assert.equal(comma, 'tags=js,ts,node')
})

// Parse URL with options
test('parseUrl with noHash option', () => {
  const result = qs.parseUrl('/path?foo=bar#section', { noHash: true })
  assert.deepEqual(result, {
    pathname: '/path',
    query: { foo: 'bar' },
    hash: '',
    search: '?foo=bar'
  })
})

test('parseUrl with noSearch option', () => {
  const result = qs.parseUrl('/path?foo=bar#section', { noSearch: true })
  assert.deepEqual(result, {
    pathname: '/path',
    query: {},
    hash: '',
    search: ''
  })
})

// Test with real URL
test('parse real URL', () => {
  const result = qs.parseUrl('https://example.com/path/to/page?search=query&sort=asc#comments')
  assert.deepEqual(result, {
    pathname: 'https://example.com/path/to/page',
    query: { search: 'query', sort: 'asc' },
    hash: 'comments',
    search: '?search=query&sort=asc'
  })
})

// Large numbers test
test('handle large numbers', () => {
  const result = qs.parse('big=9999999999999999999&small=1')
  assert.equal((result.big as number).toString(), '9999999999999999999')
  assert.equal(result.small, 1)
})

// Test array edge cases
test('array with empty values', () => {
  const result = qs.parse('foo[]=&foo[]=2')
  assert.deepEqual(result, { foo: ['', 2] })
})

test('array with single value', () => {
  const result = qs.stringify({ foo: [1] }, { arrayFormat: 'brackets' })
  assert.equal(result, 'foo[]=1')
})

// Test null/undefined in stringify
test('null and undefined handling', () => {
  const result = qs.stringify({
    present: 'value',
    nullValue: null,
    undefinedValue: undefined,
    empty: ''
  })
  assert.equal(result, 'present=value&nullValue=null&undefinedValue=&empty=')
})