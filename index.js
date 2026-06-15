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
/**
 * Parse a query string into an object
 */
export function parse(query, options = {}) {
    const { arrayFormat = 'brackets', arraySeparator = ',', encode = true, decode = true, strictNull = false, plusSpace = false, rfc3986 = false, strictNumbers = false, strictBooleans = false, dateFormats = ['iso', 'timestamp'], decodeFn = decode ? defaultDecode : (str) => str, encodeFn = encode ? defaultEncode : (str) => str, noHash = false, noSearch = false } = options;
    const result = {};
    // Extract query portion (skip ? and # if specified)
    let queryString = query;
    if (noSearch && queryString.includes('?')) {
        queryString = queryString.split('?')[1] || '';
    }
    if (noHash && queryString.includes('#')) {
        queryString = queryString.split('#')[0] || '';
    }
    if (!queryString) {
        return result;
    }
    // Handle decode function preference
    const decodeInternal = (str) => {
        try {
            return decodeFn(str);
        }
        catch {
            return defaultDecode(str);
        }
    };
    // Parse key-value pairs
    const pairs = queryString.split('&');
    for (const pair of pairs) {
        const [key, ...values] = pair.split('=');
        if (!key)
            continue;
        const decodedKey = decodeInternal(key);
        const value = values.length > 0 ? decodeInternal(values.join('=')) : '';
        // Handle nested object notation with dots
        if (decodedKey.includes('.')) {
            const parts = decodedKey.split('.');
            let current = result;
            for (let i = 0; i < parts.length - 1; i++) {
                const part = parts[i];
                if (!current[part]) {
                    current[part] = {};
                }
                current = current[part];
            }
            current[parts[parts.length - 1]] = parseValue(value, {
                strictNumbers,
                strictBooleans,
                dateFormats
            });
        }
        else {
            // Handle array formats
            if (decodedKey.endsWith('[]') && arrayFormat !== 'repeat') {
                const cleanKey = decodedKey.slice(0, -2);
                if (!result[cleanKey]) {
                    result[cleanKey] = [];
                }
                const parsed = parseValue(value, { strictNumbers, strictBooleans, dateFormats });
                result[cleanKey].push(parsed);
            }
            else {
                const existing = result[decodedKey];
                const parsed = parseValue(value, { strictNumbers, strictBooleans, dateFormats });
                if (existing !== undefined) {
                    // Handle arrays
                    if (Array.isArray(existing)) {
                        existing.push(parsed);
                    }
                    else {
                        result[decodedKey] = [existing, parsed];
                    }
                }
                else {
                    result[decodedKey] = parsed;
                }
            }
        }
    }
    return result;
}
/**
 * Parse a single value into appropriate type
 */
function parseValue(value, options) {
    const { strictNumbers, strictBooleans, dateFormats } = options;
    // Empty string handling
    if (value === '') {
        return null;
    }
    // Number parsing
    if (!strictNumbers || /^-?\d+(\.\d+)?$/.test(value)) {
        const num = Number(value);
        if (!isNaN(num) && String(num) === value) {
            return num;
        }
    }
    // Boolean parsing
    if (!strictBooleans || /^(true|false|1|0|yes|no|on|off)$/i.test(value)) {
        const lower = value.toLowerCase();
        if (lower === 'true' || lower === '1' || lower === 'yes' || lower === 'on') {
            return true;
        }
        if (lower === 'false' || lower === '0' || lower === 'no' || lower === 'off') {
            return false;
        }
    }
    // Date parsing
    for (const format of dateFormats) {
        if (format === 'iso' && /^(\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?(?:Z|[+-]\d{2}:\d{2})?)$/.test(value)) {
            return new Date(value);
        }
        if (format === 'timestamp' && /^-?\d+$/.test(value)) {
            return new Date(Number(value) * 1000);
        }
    }
    // String fallback
    return value;
}
/**
 * Stringify an object into a query string
 */
export function stringify(obj, options = {}) {
    const { arrayFormat = 'brackets', arraySeparator = ',', encode = true, strictNull = false, plusSpace = false, rfc3986 = false, sort = false, url = false, omitNulls = false, serialize = defaultSerialize, encodeFn = encode ? defaultEncode : (str) => str } = options;
    if (!obj) {
        return url ? '?' : '';
    }
    const result = [];
    const keys = sort ? Object.keys(obj).sort() : Object.keys(obj);
    // Handle encode function preference
    const encodeInternal = (str) => {
        try {
            return encodeFn(str);
        }
        catch {
            return defaultEncode(str);
        }
    };
    for (const key of keys) {
        const value = obj[key];
        if (value === null || value === undefined) {
            if (strictNull && !omitNulls) {
                result.push(encodeInternal(key) + '=');
            }
            continue;
        }
        if (value === '') {
            if (!omitNulls) {
                result.push(encodeInternal(key) + '=');
            }
            continue;
        }
        if (Array.isArray(value)) {
            // Handle array serialization
            if (arrayFormat === 'brackets') {
                for (const item of value) {
                    const str = serialize(item);
                    if (str !== null) {
                        result.push(`${encodeInternal(key)}[]=${encodeInternal(str)}`);
                    }
                }
            }
            else if (arrayFormat === 'repeat') {
                for (const item of value) {
                    const str = serialize(item);
                    if (str !== null) {
                        result.push(`${encodeInternal(key)}=${encodeInternal(str)}`);
                    }
                }
            }
            else if (arrayFormat === 'comma') {
                const items = value
                    .map(item => serialize(item))
                    .filter((item) => item !== null);
                if (items.length > 0) {
                    result.push(`${encodeInternal(key)}=${encodeInternal(items.join(arraySeparator))}`);
                }
            }
        }
        else {
            // Handle single values
            const str = serialize(value);
            if (str !== null) {
                result.push(`${encodeInternal(key)}=${encodeInternal(str)}`);
            }
        }
    }
    const queryString = result.join('&');
    return url ? `?${queryString}` : queryString;
}
/**
 * Parse a URL and return object with pathname, query, hash
 */
export function parseUrl(url, options = {}) {
    const { noHash = false, noSearch = false } = options;
    const result = {
        pathname: '',
        query: {},
        hash: '',
        search: ''
    };
    // Extract hash
    if (url.includes('#')) {
        const [main, hash] = url.split('#');
        result.hash = hash;
        url = main;
    }
    // Extract search
    if (url.includes('?')) {
        const [path, search] = url.split('?');
        result.pathname = path;
        result.search = '?' + search;
        result.query = parse(search, options);
    }
    else {
        result.pathname = url;
        result.search = '';
        result.query = {};
    }
    return result;
}
/**
 * Build a URL from components
 */
export function buildUrl(pathname, query = undefined, hash = undefined, options = {}) {
    let url = pathname;
    const queryString = stringify(query, options);
    if (queryString) {
        url += queryString;
    }
    if (hash) {
        url += '#' + hash;
    }
    return url;
}
/**
 * Merge query strings or query objects
 */
export function merge(target, source, options = {}) {
    const arrayMerge = options.arrayMerge || 'concat';
    const targetObj = typeof target === 'string' ? parse(target) : target;
    const sourceObj = typeof source === 'string' ? parse(source) : source;
    const result = { ...targetObj };
    for (const [key, value] of Object.entries(sourceObj)) {
        const existing = result[key];
        if (Array.isArray(value) && Array.isArray(existing)) {
            result[key] = arrayMerge === 'concat' ? [...existing, ...value] : [...value];
        }
        else {
            result[key] = value;
        }
    }
    return result;
}
/**
 * Pick specific keys from query string/object
 */
export function pick(query, keys, options = {}) {
    const obj = typeof query === 'string' ? parse(query, options) : query;
    const result = {};
    for (const key of keys) {
        if (key in obj) {
            result[key] = obj[key];
        }
    }
    return result;
}
/**
 * Omit specific keys from query string/object
 */
export function omit(query, keys, options = {}) {
    const obj = typeof query === 'string' ? parse(query, options) : query;
    const result = { ...obj };
    for (const key of keys) {
        delete result[key];
    }
    return result;
}
/**
 * Get value from nested query object with dot notation
 */
export function get(obj, path, defaultValue) {
    const parts = path.split('.');
    let current = obj;
    for (const part of parts) {
        if (current === null || current === undefined || !(part in current)) {
            return defaultValue;
        }
        current = current[part];
    }
    return current;
}
/**
 * Set value in nested query object with dot notation
 */
export function set(obj, path, value) {
    const parts = path.split('.');
    let current = obj;
    for (let i = 0; i < parts.length - 1; i++) {
        const part = parts[i];
        if (!(part in current) || typeof current[part] !== 'object') {
            current[part] = {};
        }
        current = current[part];
    }
    current[parts[parts.length - 1]] = value;
    return obj;
}
/**
 * Default URL encoding
 */
function defaultEncode(str) {
    return encodeURIComponent(str)
        .replace(/%20/g, '+')
        .replace(/%2C/g, ',');
}
/**
 * Default URL decoding
 */
function defaultDecode(str) {
    return decodeURIComponent(str.replace(/\+/g, ' '));
}
/**
 * Default value serialization
 */
function defaultSerialize(value) {
    if (value === null || value === undefined) {
        return null;
    }
    if (value instanceof Date) {
        return value.toISOString();
    }
    if (typeof value === 'boolean') {
        return String(value);
    }
    if (typeof value === 'number') {
        return String(value);
    }
    if (Array.isArray(value)) {
        return value.map(v => defaultSerialize(v)).filter(v => v !== null).join(',');
    }
    return String(value);
}
