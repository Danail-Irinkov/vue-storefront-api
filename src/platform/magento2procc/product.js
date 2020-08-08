import AbstractProductProxy from '../abstract/product'
import { multiStoreConfig } from './util'

class ProductProxy extends AbstractProductProxy {
  constructor (config, req) {
    console.log('after Magento2Client1');
    const Magento2Client = require('magento2-rest-client').Magento2Client;
    // console.log('after Magento2Client2');
    super(config, req)
    // console.log('after Magento2Client3');
    this.api = Magento2Client(multiStoreConfig(config.magento2procc.api, req));
    // console.log('after Magento2Client4');
  }

  renderList (skus, currencyCode, storeId = 1) {
    const query = '&searchCriteria[filter_groups][0][filters][0][field]=sku&' +
    'searchCriteria[filter_groups][0][filters][0][value]=' + encodeURIComponent(skus.join(',')) + '&' +
    'searchCriteria[filter_groups][0][filters][0][condition_type]=in';
    return this.api.products.renderList(query, currencyCode, storeId)
  }

  list (skus) {
    const query = '&searchCriteria[filter_groups][0][filters][0][field]=sku&' +
    'searchCriteria[filter_groups][0][filters][0][value]=' + encodeURIComponent(skus.join(',')) + '&' +
    'searchCriteria[filter_groups][0][filters][0][condition_type]=in';
    console.log('after Magento2ClientLIST1');
    return this.api.products.list(query)
  }
}

module.exports = ProductProxy
