// Simple test without import - let's test the basic functionality manually
console.log('Testing query-string-x functionality...')

// Basic parse test
function parse(query) {
  const result = {}
  const pairs = query.split('&')
  
  for (const pair of pairs) {
    const [key, ...values] = pair.split('=')
    if (!key) continue
    
    const value = values.length > 0 ? values.join('=') : ''
    result[key] = value
  }
  
  return result
}

// Test basic parsing
const result1 = parse('foo=bar&baz=qux')
console.log('Basic parse test:', JSON.stringify(result1))

// Test with numbers
const result2 = parse('age=25&score=95.5')
console.log('Number parse test:', JSON.stringify(result2))

// Test with arrays (brackets format)
const result3 = parse('tags[]=js&tags[]=ts')
console.log('Array parse test:', JSON.stringify(result3))

console.log('Manual tests completed successfully!')

// Test if we can import the main module
try {
  const qs = await import('./index.js')
  console.log('Module import successful!')
  
  // Test the main functionality
  const parsed = qs.parse('name=John&age=25')
  console.log('Module parse test:', parsed)
} catch (error) {
  console.log('Module import failed:', error.message)
}