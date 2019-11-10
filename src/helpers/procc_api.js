import axios from 'axios'
import Config from '../../config/default.json'

const jwt = require('jsonwebtoken')
const jwtPrivateKey = require('../../config/jwt')

const CreateProCcAPI = (baseURL = `${Config.PROCC.API}/`) => {
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

  const createToken = (brandId) => jwt.sign({ brand_id: brandId }, jwtPrivateKey.JWT_PRIVATE_KEY, {
    expiresIn: 15000,
    algorithm: 'RS256'
  })

  const config = (brandId = 0) => ({
    headers: {
      'Authorization': `Bearer ${createToken(brandId)}`
    }
  })

  const addNewOrder = (orderData, brandId) => api.post('order/addNewOrder', orderData, config(brandId))
  const mangoPayCheckIn = (data, brandId) => api.post('mangopay/VSFOrderPayment', data, config(brandId))
  const updateTransactionStatus = (data, brandId) => api.post('mangopay/updateTransactionStatus', data, config(brandId))
  const getSizeChart = (product, brandId) => api.get(`sizeChart/getVSFSizeChartById/${product}?brand_id=${brandId}`, config(brandId))
  const updateVsfSyncStatus = (brandData) => api.post('vsf/updateSyncStatusVsf', {brandData}, config(brandData.brand_id))
  const getProductDeliveryPolicy = () => api.get('policy/getProductDeliveryPolicy')

  return {
    addNewOrder,
    getProductDeliveryPolicy,
    getSizeChart,
    mangoPayCheckIn,
    updateTransactionStatus,
    updateVsfSyncStatus
  }
}

export default {
  CreateProCcAPI
}
