export default {
  busd: {
    address: process.env.NODE_ENV === 'production' ? '' : '',
    abi: [],
    network: false
  },
  bsc: {
    network: true
  }
}
