import '@testing-library/jest-dom'

// jsdom does not implement URL.createObjectURL / revokeObjectURL
if (!URL.createObjectURL) {
  URL.createObjectURL = () => 'blob:fake'
}
if (!URL.revokeObjectURL) {
  URL.revokeObjectURL = () => {}
}
