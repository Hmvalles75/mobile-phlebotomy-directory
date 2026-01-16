import * as fs from 'fs'

const filePath = 'c:\\Users\\hmval\\OneDrive\\Desktop\\MobilePhlebotomy\\data\\top-metros.ts'

// Read the file
const content = fs.readFileSync(filePath, 'utf8')

// Remove all lines that contain "population:"
const lines = content.split('\n')
const filteredLines = lines.filter(line => !line.trim().match(/^population:/))

// Write back
fs.writeFileSync(filePath, filteredLines.join('\n'), 'utf8')

console.log('✅ Removed all population fields from top-metros.ts')
