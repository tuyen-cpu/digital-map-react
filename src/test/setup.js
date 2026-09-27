import '@testing-library/jest-dom'

// Polyfill URL.createObjectURL and URL.revokeObjectURL for jsdom
// jsdom does not implement these browser APIs, so we simulate them
// by generating fake blob: URLs that tests can detect with /^blob:/.
if (typeof URL.createObjectURL === 'undefined') {
  let blobCounter = 0
  URL.createObjectURL = (blob) => {
    blobCounter += 1
    return `blob:http://localhost/${blobCounter}-${blob?.name || 'file'}`
  }
  URL.revokeObjectURL = () => {}
}
