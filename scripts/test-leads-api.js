const fetch = require('node-fetch')

async function testLeadsAPI() {
  try {
    // Test with the admin password as token
    const token = 'JdArKl@!1927'

    console.log('Testing leads API endpoint...')
    console.log('Token:', token)

    const res = await fetch('http://localhost:3000/api/admin/leads', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    })

    console.log('Status:', res.status, res.statusText)

    const data = await res.json()
    console.log('\nResponse:', JSON.stringify(data, null, 2))

  } catch (error) {
    console.error('Error:', error.message)
  }
}

testLeadsAPI()
