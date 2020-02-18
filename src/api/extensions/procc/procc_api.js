import axios from 'axios'
import jwt from 'jsonwebtoken'
import jwt_token from './jwt'

export default (config) => {
  let baseURL = config.PROCC.API + '/api/'
  // ------
  // STEP 1
  // ------
  //
  // Create and configure an apisauce-based api object.
  //
  const api = axios.create({
    // base URL is read from the "constructor"
    baseURL,
    // here are some default headers
    headers: {
      'Cache-Control': 'no-cache',
      'Content-type': 'application/json'
    },
    // 10 second timeout...
    timeout: 150000
  })

  // JWT TOKEN MANAGEMENT
  let private_key = jwt_token.private_key
  if (process.env.NODE_APP_INSTANCE === 'kube') {
    // private_key = process.env.JWT_PRIVATE_KEY // with '\n' line breaks
    /* eslint-disable */
    let Buffer = new Buffer.from(process.env.JWT_PRIVATE_KEY, 'base64')
    private_key = Buffer.toString('ascii')
    let Buffer2 = new Buffer.from(process.env.JWT_PRIVATE_KEY_1, 'base64')
    let private_key2 = Buffer2.toString('ascii')
    console.log('private_key2 decoded: ', private_key2)
    /* eslint-disable */
  }
  console.log('private_key after KUBE: ', private_key)
  if (!private_key || private_key === 'NO TOKEN') throw new Error('No JWT API TOKEN SUPPLIED')

  const createToken = (brandId) => jwt.sign({ brand_id: brandId },
    private_key, {
      expiresIn: 15000,
      algorithm: 'RS256'
    })

  const getHeader = (brandId = 0) => ({
    headers: {
      'Authorization': `Bearer ${createToken(brandId)}`
    }
  })

  const addNewOrder = (orderData, brandId) => api.post('order/addNewOrder', orderData, getHeader(brandId))
  const mangoPayCheckIn = (data, brandId) => api.post('mangopay/VSFOrderPayment', data, getHeader(brandId))
  const updateTransactionStatus = (data, brandId) => api.post('mangopay/updateTransactionStatusVSF', data, getHeader(brandId))
  const getSizeChart = (product, brandId) => api.get(`sizeChart/getVSFSizeChartById/${product}?brand_id=${brandId}`, getHeader(brandId))
  const updateVsfSyncStatus = (brandData, brandId) => api.post('vsf/updateVsfSyncStatus', {brandData}, getHeader(brandId))
  const storeSyncFinishedKubeRestart = (data, brandId) => api.post('storefront/storeSyncFinishedKubeRestart', {data}, getHeader(brandId))
  const store_wise_import_done = (data, brandId) => api.post('storefront/store_wise_import_done', {data}, getHeader(brandId))
  const product_sync_done = (data, brandId) => api.post('storefront/product_sync_done', {data}, getHeader(brandId))
  const getProductDeliveryPolicy = () => api.get('policy/getProductDeliveryPolicy')
  const updateOrderFromVSF = (orderData, brandId) => api.post('order/updateOrderFromVSF', orderData, getHeader(brandId))

  return {
    addNewOrder,
    getProductDeliveryPolicy,
    getSizeChart,
    mangoPayCheckIn,
    updateTransactionStatus,
    storeSyncFinishedKubeRestart,
    store_wise_import_done,
    product_sync_done,
    updateVsfSyncStatus,
    updateOrderFromVSF
  }
}
