import axios from 'axios'
import jwt from 'jsonwebtoken'
import jwtPrivateKey from '../../config/jwt.json'
import config from 'config';

export default (baseURL = config.PROCC.API+'/') => {
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

  const getHeader = (brandId = 0) => ({
    headers: {
      'Authorization': `Bearer ${createToken(brandId)}`
    }
  })

  const addNewOrder = (orderData, brandId) => api.post('order/addNewOrder', orderData, getHeader(brandId))
  const mangoPayCheckIn = (data, brandId) => api.post('mangopay/VSFOrderPayment', data, getHeader(brandId))
  const updateTransactionStatus = (data, brandId) => api.post('mangopay/updateTransactionStatus', data, getHeader(brandId))
  const getSizeChart = (product, brandId) => api.get(`sizeChart/getVSFSizeChartById/${product}?brand_id=${brandId}`, getHeader(brandId))
  const updateVsfSyncStatus = (brandData) => api.post('vsf/updateSyncStatusVsf', {brandData}, getHeader(brandData.brand_id))
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
