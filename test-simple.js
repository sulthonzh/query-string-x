import { parse } from './index.js'

// Simple test
try {
  const result = parse('foo=bar&baz=qux')
  console.log('Basic parse test passed:', result)
} catch (error) {
  console.error('Basic parse test failed:', error.message)
}

// Test with arrays
try {
  const result = parse('foo[]=1&foo[]=2')
  console.log('Array parse test passed:', result)
} catch (error) {
  console.error('Array parse test failed:', error.message)
}

console.log('Simple tests completed')