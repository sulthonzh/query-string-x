# query-string-x

Zero-dependency URL query string parser and manipulator with type inference, nested object support, and advanced options.

## Features

- **Zero Dependencies**: Pure TypeScript, no external dependencies
- **Type Inference**: Automatically parses numbers, booleans, dates, and arrays
- **Nested Objects**: Support for dot notation (`user.name.first=John`)
- **Array Formats**: Multiple array serialization formats (brackets, repeat, comma)
- **URL Operations**: Parse, build, and manipulate URLs
- **Query Manipulation**: Merge, pick, omit, get, and set operations
- **Custom Encoding**: Flexible URL encoding/decoding options
- **CLI Tool**: Command-line interface for query string operations
- **TypeScript Support**: Full type definitions included

## Installation

```bash
npm install query-string-x
```

## Quick Start

### Parsing Query Strings

```typescript
import { parse } from 'query-string-x'

const query = 'name=John&age=25&active=true&tags[]=js&tags[]=ts'
const result = parse(query)

console.log(result)
// Output: { name: 'John', age: 25, active: true, tags: ['js', 'ts'] }
```

### Stringifying Objects

```typescript
import { stringify } from 'query-string-x'

const obj = { name: 'John', age: 25, active: true, tags: ['js', 'ts'] }
const query = stringify(obj)

console.log(query)
// Output: 'name=John&age=25&active=true&tags[]=js&tags[]=ts'
```

### URL Operations

```typescript
import { parseUrl, buildUrl } from 'query-string-x'

// Parse URL
const url = parseUrl('https://example.com/path?foo=bar#section')
console.log(url)
// Output: { pathname: '...', query: { foo: 'bar' }, hash: 'section' }

// Build URL
const newUrl = buildUrl('/path', { foo: 'bar' }, 'section')
console.log(newUrl)
// Output: '/path?foo=bar#section'
```

## API Reference

### `parse(query: string, options?): QueryObject`

Parse a query string into an object.

```typescript
import { parse } from 'query-string-x'

// Basic parsing
const result = parse('foo=bar&baz=qux')

// With options
const result = parse('foo=123&bar=1', {
  strictNumbers: true,  // Keep as strings
  strictBooleans: true // Parse only explicit booleans
})
```

#### Options

- `arrayFormat`: `'brackets' | 'repeat' | 'comma'` - Array serialization format
- `arraySeparator`: `string` - Separator for comma arrays
- `encode`: `boolean` - URL encode values (default: `true`)
- `decode`: `boolean` - URL decode values (default: `true`)
- `strictNull`: `boolean` - Include null values as empty strings
- `strictNumbers`: `boolean` - Parse only numbers that look like numbers
- `strictBooleans`: `boolean` - Parse only explicit boolean values
- `dateFormats`: `string[]` - Date parsing formats

### `stringify(obj: QueryObject, options?): string`

Convert an object to a query string.

```typescript
import { stringify } from 'query-string-x'

// Basic stringification
const query = stringify({ foo: 'bar', baz: 'qux' })

// With options
const query = stringify({ tags: ['js', 'ts'] }, {
  arrayFormat: 'comma',  // Output: 'tags=js,ts'
  sort: true,           // Sort keys alphabetically
  url: true             // Add ? prefix
})
```

#### Options

- `arrayFormat`: `'brackets' | 'repeat' | 'comma'` - Array serialization format
- `arraySeparator`: `string` - Separator for comma arrays
- `encode`: `boolean` - URL encode values (default: `true`)
- `sort`: `boolean` - Sort keys alphabetically
- `url`: `boolean` - Add ? prefix for URLs
- `omitNulls`: `boolean` - Omit null/undefined values

### `parseUrl(url: string, options?): UrlComponents`

Parse a URL into components.

```typescript
import { parseUrl } from 'query-string-x'

const result = parseUrl('https://example.com/path?foo=bar#section')
// Output: { pathname: '...', query: { foo: 'bar' }, hash: 'section', search: '?foo=bar' }
```

### `buildUrl(pathname, query?, hash?, options?): string`

Build a URL from components.

```typescript
import { buildUrl } from 'query-string-x'

const url = buildUrl('/path', { foo: 'bar' }, 'section')
// Output: '/path?foo=bar#section'
```

### `merge(target, source, options?): QueryObject`

Merge two query strings or objects.

```typescript
import { merge } from 'query-string-x'

const result = merge('foo=bar', '{ "baz": "qux" }')
// Output: { foo: 'bar', baz: 'qux' }
```

### `pick(query, keys, options?): QueryObject`

Pick specific keys from a query string.

```typescript
import { pick } from 'query-string-x'

const result = pick('foo=bar&baz=qux', 'foo,baz')
// Output: { foo: 'bar', baz: 'qux' }
```

### `omit(query, keys, options?): QueryObject`

Omit specific keys from a query string.

```typescript
import { omit } from 'query-string-x'

const result = omit('foo=bar&baz=qux', 'baz')
// Output: { foo: 'bar' }
```

### `get(obj, path, defaultValue?): QueryValue`

Get value from nested object with dot notation.

```typescript
import { get } from 'query-string-x'

const obj = { user: { profile: { name: 'John' } } }
const name = get(obj, 'user.profile.name', 'Unknown')
// Output: 'John'
```

### `set(obj, path, value): QueryObject`

Set value in nested object with dot notation.

```typescript
import { set } from 'query-string-x'

const obj = {}
const result = set(obj, 'user.profile.name', 'John')
// Output: { user: { profile: { name: 'John' } } }
```

## CLI Usage

```bash
# Parse query string
query-string parse "foo=bar&baz=qux"

# Stringify object
query-string stringify '{ "foo": "bar", "baz": "qux" }'

# Parse URL
query-string url "https://example.com/path?foo=bar#section"

# Build URL
query-string build "/path" '{ "foo": "bar" }' "section"

# Merge queries
query-string merge "foo=bar" '{ "baz": "qux" }'

# Pick keys
query-string pick "foo=bar&baz=qux" "foo,baz"

# Omit keys
query-string omit "foo=bar&baz=qux" "baz"

# Get nested value
query-string get '{ "user": { "name": "John" } }' "user.name"

# Set nested value
query-string set '{ "user": {} }' "user.name" "John"

# With options
query-string parse --array-format=comma --strict-numbers=false "foo=bar&tags=js,ts"
```

## Advanced Features

### Type Inference

The library automatically infers types from query strings:

```typescript
const result = parse('name=John&age=25&active=true&score=95.5&birth=2020-01-01')
// Output: {
//   name: 'John',
//   age: 25,          // number
//   active: true,     // boolean
//   score: 95.5,      // number
//   birth: Date       // ISO date
// }
```

### Nested Objects

Dot notation creates nested objects:

```typescript
const result = parse('user.name.first=John&user.name.last=Doe&user.email=john@example.com')
// Output: {
//   user: {
//     name: {
//       first: 'John',
//       last: 'Doe'
//     },
//     email: 'john@example.com'
//   }
// }
```

### Array Formats

Different array serialization formats:

```typescript
// Brackets format (default)
const result = stringify({ tags: ['js', 'ts'] }, { arrayFormat: 'brackets' })
// Output: 'tags[]=js&tags[]=ts'

// Repeat format
const result = stringify({ tags: ['js', 'ts'] }, { arrayFormat: 'repeat' })
// Output: 'tags=js&tags=ts'

// Comma format
const result = stringify({ tags: ['js', 'ts'] }, { arrayFormat: 'comma' })
// Output: 'tags=js,ts'
```

### Custom Encoding

Flexible encoding options:

```typescript
// Custom decode function
const result = parse('foo=hello%20world', {
  decode: false  // Keep encoded
})

// Custom encode function
const result = stringify({ 'hello world': 'test' }, {
  encode: false  // Don't encode
})
```

## Browser Usage

For browser usage, you can import the module directly:

```html
<script type="module">
  import { parse, stringify } from './query-string-x/index.ts'
  
  const query = parse('foo=bar&baz=qux')
  console.log(query)
  
  const result = stringify({ foo: 'bar', baz: 'qux' })
  console.log(result)
</script>
```

## Performance

- Zero dependencies means smaller bundle size
- Optimized parsing algorithms for performance
- Minimal memory usage with efficient string operations
- Suitable for both server and client environments

## Testing

Run the test suite:

```bash
npm test
```

## License

MIT License - see [LICENSE](LICENSE) file for details.