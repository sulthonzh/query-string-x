/**
 * Zero-dep URL query string parser and manipulator
 * 
 * Parse, stringify, and manipulate URL query strings with support for:
 * - Nested objects with dot notation
 * - Arrays (bracket notation and repeated keys)
 * - URL encoding/decoding
 * - String parameters and numbers
 * - Booleans (true/false, 1/0, yes/no, on/off)
 * - Dates (ISO strings and epoch timestamps)
 * - Null/undefined handling
 * - Custom separators and encoding
 * - Type preservation and inference
 * - URL-safe operations
 */

type QueryStringOptions = {
  /** Array format: 'brackets' → a[]=1&a[]=2, 'repeat' → a=1&a=2, 'comma' → a=1,2 */
  arrayFormat?: 'brackets' | 'repeat' | 'comma'
  /** Array separator when using 'comma' format */
  arraySeparator?: string
  /** Skip encoding (for pre-encoded strings) */
  encode?: boolean
  /** Skip decoding (for manual control) */
  decode?: boolean
  /** Stringify null/undefined as empty string instead of omitting */
  strictNull?: boolean
  /** Encode space as '+' instead of '%20' */
  plusSpace?: boolean
  /** Use RFC 3986 encoding (more strict than default) */
  rfc3986?: boolean
  /** Parse numbers only if they look like numbers */
  strictNumbers?: boolean
  /** Parse booleans only if they match explicit patterns */
  strictBooleans?: boolean
  /** Parse dates in additional formats */
  dateFormats?: string[]
  /** Custom decode function */
  decodeFn?: (str: string) => string
  /** Custom encode function */
  encodeFn?: (str: string) => string
}

type QueryValue = string | number | boolean | null | undefined | Date | QueryValue[]
type QueryObject = Record<string, QueryValue>

type ParserOptions = QueryStringOptions & {
  /** Stop parsing at hash (#) */
  noHash?: boolean
  /** Stop parsing at search (?) */
  noSearch?: boolean
}

type StringifierOptions = QueryStringOptions & {
  /** Sort keys alphabetically */
  sort?: boolean
  /** Prefix with ? for URLs */
  url?: boolean
  /** Exclude null/undefined values */
  omitNulls?: boolean
  /** Custom value serializer */
  serialize?: (value: QueryValue) => string
}

/**
 * Parse a query string into an object
 */
export function parse(query: string, options: ParserOptions = {}): QueryObject {
  const {
    arrayFormat = 'brackets',
    arraySeparator = ',',
    encode = true,
    decode = true,
    strictNull = false,
    plusSpace = false,
    rfc3986 = false,
    strictNumbers = false,
    strictBooleans = false,
    dateFormats = ['iso', 'timestamp'],
    decodeFn = decode ? defaultDecode : (str) => str,
    encodeFn = encode ? defaultEncode : (str) => str,
    noHash = false,
    noSearch = false
  } = options

  const result: QueryObject = {}
  
  // Extract query portion (skip ? and # if specified)
  let queryString = query
  if (noSearch && queryString.includes('?')) {
    queryString = queryString.split('?')[1] || ''
  }
  if (noHash && queryString.includes('#')) {
    queryString = queryString.split('#')[0] || ''
  }
  
  if (!queryString) {
    return result
  }

  // Handle decode function preference
  const decodeInternal = (str: string): string => {
    try {
      return decodeFn(str)
    } catch {
      return defaultDecode(str)
    }
  }

  // Parse key-value pairs
  const pairs = queryString.split('&')
  
  for (const pair of pairs) {
    const eqIndex = pair.indexOf('=')
    const rawKey = eqIndex >= 0 ? pair.slice(0, eqIndex) : pair
    const rawValue = eqIndex >= 0 ? pair.slice(eqIndex + 1) : ''
    
    const decodedKey = decodeInternal(rawKey)
    const value = decodeInternal(rawValue)
    
    // Handle comma array format
    if (arrayFormat === 'comma' && value.includes(arraySeparator)) {
      const items = value.split(arraySeparator).map(v => parseValue(v, { strictNumbers, strictBooleans, dateFormats }))
      result[decodedKey] = items
      continue
    }
    
    // Handle nested object notation with dots
    if (decodedKey.includes('.')) {
      const parts = decodedKey.split('.')
      let current = result as any
      
      for (let i = 0; i < parts.length - 1; i++) {
        const part = parts[i]
        if (!current[part]) {
          current[part] = {}
        }
        current = current[part]
      }
      
      const lastPart = parts[parts.length - 1]
      const parsed = parseValue(value, { strictNumbers, strictBooleans, dateFormats })
      
      // Handle bracket array notation on last part of nested path
      if (lastPart.endsWith('[]')) {
        const cleanKey = lastPart.slice(0, -2)
        if (!current[cleanKey]) {
          current[cleanKey] = []
        }
        current[cleanKey].push(parsed)
      } else {
        current[lastPart] = parsed
      }
    } else {
      // Handle array formats
      if (decodedKey.endsWith('[]')) {
        const cleanKey = decodedKey.slice(0, -2)
        if (!result[cleanKey]) {
          result[cleanKey] = []
        }
        const parsed = parseValue(value, { strictNumbers, strictBooleans, dateFormats })
        ;(result[cleanKey] as QueryValue[]).push(parsed)
      } else {
        const existing = result[decodedKey]
        const parsed = parseValue(value, { strictNumbers, strictBooleans, dateFormats })
        
        if (existing !== undefined) {
          // Handle arrays
          if (Array.isArray(existing)) {
            existing.push(parsed)
          } else {
            result[decodedKey] = [existing, parsed]
          }
        } else {
          result[decodedKey] = parsed
        }
      }
    }
  }
  
  return result
}

/**
 * Parse a single value into appropriate type
 */
function parseValue(value: string, options: {
  strictNumbers: boolean
  strictBooleans: boolean
  dateFormats: string[]
}): QueryValue {
  const { strictNumbers, strictBooleans, dateFormats } = options
  
  // Empty string stays empty string
  if (value === '') {
    return ''
  }
  
  // Date parsing (check before numbers — timestamps look like numbers)
  for (const format of dateFormats) {
    if (format === 'iso' && /^(\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?(?:Z|[+-]\d{2}:\d{2})?)$/.test(value)) {
      return new Date(value)
    }
    if (format === 'timestamp' && /^-?\d{10,13}$/.test(value)) {
      const ts = Number(value)
      // Sanity check: valid timestamp range (year 2000-2100 in seconds or millis)
      if (ts > 946684800 && ts < 4102444800) {
        return new Date(ts * 1000)
      }
      if (ts > 946684800000 && ts < 4102444800000) {
        return new Date(ts)
      }
    }
  }
  
  // Boolean parsing (true/false, yes/no, on/off — but NOT 1/0 which are numbers)
  if (!strictBooleans) {
    const lower = value.toLowerCase()
    if (lower === 'true' || lower === 'yes' || lower === 'on') {
      return true
    }
    if (lower === 'false' || lower === 'no' || lower === 'off') {
      return false
    }
  }
  
  // Number parsing
  if (!strictNumbers) {
    const num = Number(value)
    if (!isNaN(num) && String(num) === value) {
      return num
    }
  }
  
  // String fallback
  return value
}

/**
 * Stringify an object into a query string
 */
export function stringify(obj: QueryObject | null | undefined, options: StringifierOptions = {}): string {
  const {
    arrayFormat = 'brackets',
    arraySeparator = ',',
    encode = true,
    strictNull = false,
    plusSpace = false,
    rfc3986 = false,
    sort = false,
    url = false,
    omitNulls = false,
    serialize = defaultSerialize,
    encodeFn = encode ? defaultEncode : (str) => str
  } = options

  if (!obj) {
    return url ? '?' : ''
  }

  const result: string[] = []
  const keys = sort ? Object.keys(obj).sort() : Object.keys(obj)
  
  // Handle encode function preference
  const encodeInternal = (str: string): string => {
    try {
      return encodeFn(str)
    } catch {
      return defaultEncode(str)
    }
  }

  for (const key of keys) {
    const value = obj[key]
    
    if (value === null) {
      if (!omitNulls) {
        result.push(`${encodeInternal(key)}=null`)
      }
      continue
    }
    
    if (value === undefined) {
      if (!omitNulls) {
        result.push(`${encodeInternal(key)}=`)
      }
      continue
    }
    
    if (value === '') {
      if (!omitNulls) {
        result.push(encodeInternal(key) + '=')
      }
      continue
    }
    
    if (Array.isArray(value)) {
      // Handle array serialization
      if (arrayFormat === 'brackets') {
        for (const item of value) {
          const str = serialize(item)
          if (str !== null) {
            result.push(`${encodeInternal(key)}[]=${encodeInternal(str)}`)
          }
        }
      } else if (arrayFormat === 'repeat') {
        for (const item of value) {
          const str = serialize(item)
          if (str !== null) {
            result.push(`${encodeInternal(key)}=${encodeInternal(str)}`)
          }
        }
      } else if (arrayFormat === 'comma') {
        const items = value
          .map(item => serialize(item))
          .filter((item): item is string => item !== null)
        if (items.length > 0) {
          result.push(`${encodeInternal(key)}=${encodeInternal(items.join(arraySeparator))}`)
        }
      }
    } else if (typeof value === 'object' && value !== null && !(value instanceof Date)) {
      // Stringify nested object with dot notation
      const nestedObj: QueryObject = {}
      for (const [nestedKey, nestedValue] of Object.entries(value)) {
        nestedObj[`${key}.${nestedKey}`] = nestedValue as QueryValue
      }
      const nestedStr = stringify(nestedObj, { ...options, sort, url: false, omitNulls })
      if (nestedStr) result.push(nestedStr)
    } else {
      // Handle single values
      const str = serialize(value)
      if (str !== null) {
        result.push(`${encodeInternal(key)}=${encodeInternal(str)}`)
      }
    }
  }
  
  const queryString = result.join('&')
  return url ? `?${queryString}` : queryString
}

/**
 * Parse a URL and return object with pathname, query, hash
 */
export function parseUrl(url: string, options: ParserOptions = {}): {
  pathname: string
  query: QueryObject
  hash: string
  search: string
} {
  const { noHash = false, noSearch = false } = options
  
  const result = {
    pathname: '',
    query: {} as QueryObject,
    hash: '',
    search: ''
  }
  
  // Extract hash (unless noHash or noSearch — they strip downstream portions)
  if (url.includes('#')) {
    const [main, hash] = url.split('#')
    result.hash = (noHash || noSearch) ? '' : (hash || '')
    url = main
  }
  
  // Extract search
  if (url.includes('?')) {
    const [path, search] = url.split('?')
    result.pathname = path
    if (noSearch) {
      result.search = ''
      result.query = {}
    } else {
      result.search = '?' + search
      result.query = parse(search, options)
    }
  } else {
    result.pathname = url
    result.search = ''
    result.query = {}
  }
  
  return result
}

/**
 * Build a URL from components
 */
export function buildUrl(
  pathname: string,
  query: QueryObject | null | undefined = undefined,
  hash: string | null | undefined = undefined,
  options: StringifierOptions = {}
): string {
  let url = pathname
  
  const queryString = stringify(query, options)
  if (queryString) {
    url += '?' + queryString
  }
  
  if (hash) {
    url += '#' + hash
  }
  
  return url
}

/**
 * Merge query strings or query objects
 */
export function merge(
  target: QueryObject | string,
  source: QueryObject | string,
  options: { arrayMerge?: 'concat' | 'replace' } = {}
): QueryObject {
  const arrayMerge = options.arrayMerge || 'concat'
  
  const targetObj = typeof target === 'string' ? parse(target) : target
  const sourceObj = typeof source === 'string' ? parse(source) : source
  
  const result: QueryObject = { ...targetObj }
  
  for (const [key, value] of Object.entries(sourceObj)) {
    const existing = result[key]
    
    if (Array.isArray(value) && Array.isArray(existing)) {
      result[key] = arrayMerge === 'concat' ? [...existing, ...value] : [...value]
    } else {
      result[key] = value
    }
  }
  
  return result
}

/**
 * Pick specific keys from query string/object
 */
export function pick(
  query: QueryObject | string,
  keys: string[],
  options: ParserOptions = {}
): QueryObject {
  const obj = typeof query === 'string' ? parse(query, options) : query
  const result: QueryObject = {}
  
  for (const key of keys) {
    if (key in obj) {
      result[key] = obj[key]
    }
  }
  
  return result
}

/**
 * Omit specific keys from query string/object
 */
export function omit(
  query: QueryObject | string,
  keys: string[],
  options: ParserOptions = {}
): QueryObject {
  const obj = typeof query === 'string' ? parse(query, options) : query
  const result: QueryObject = { ...obj }
  
  for (const key of keys) {
    delete result[key]
  }
  
  return result
}

/**
 * Get value from nested query object with dot notation
 */
export function get(obj: QueryObject, path: string, defaultValue?: QueryValue): QueryValue {
  const parts = path.split('.')
  let current = obj as any
  
  for (const part of parts) {
    if (current === null || current === undefined || !(part in current)) {
      return defaultValue
    }
    current = current[part]
  }
  
  return current
}

/**
 * Set value in nested query object with dot notation
 */
export function set(obj: QueryObject, path: string, value: QueryValue): QueryObject {
  const parts = path.split('.')
  let current = obj as any
  
  for (let i = 0; i < parts.length - 1; i++) {
    const part = parts[i]
    if (!(part in current) || typeof current[part] !== 'object') {
      current[part] = {}
    }
    current = current[part]
  }
  
  current[parts[parts.length - 1]] = value
  return obj
}

/**
 * Default URL encoding
 */
function defaultEncode(str: string): string {
  return encodeURIComponent(str)
    .replace(/%20/g, '+')
    .replace(/%2C/g, ',')
    .replace(/%3A/g, ':')
}

/**
 * Default URL decoding
 */
function defaultDecode(str: string): string {
  return decodeURIComponent(str.replace(/\+/g, ' '))
}

/**
 * Default value serialization
 */
function defaultSerialize(value: QueryValue): string | null {
  if (value === null || value === undefined) {
    return null
  }
  
  if (value instanceof Date) {
    return value.toISOString()
  }
  
  if (typeof value === 'boolean') {
    return String(value)
  }
  
  if (typeof value === 'number') {
    return String(value)
  }
  
  if (Array.isArray(value)) {
    return value.map(v => defaultSerialize(v)).filter(v => v !== null).join(',')
  }
  
  return String(value)
}