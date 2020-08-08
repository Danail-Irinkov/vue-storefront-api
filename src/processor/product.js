import PlatformFactory from '../platform/factory'
import { sgnSrc } from '../lib/util'
const jwa = require('jwa');
const hmac = jwa('HS256');

class ProductProcessor {
  constructor (config, entityType, indexName, req, res) {
    this._config = config
    this._entityType = entityType
    this._indexName = indexName
    this._req = req
    this._res = res
  }

  process (items, groupId = null) {
    const processorChain = []
    const platform = this._config.platform
    const factory = new PlatformFactory(this._config, this._req)
    const taxCountry = this._config.tax.defaultCountry
    const taxProcessor = factory.getAdapter(platform, 'tax', this._indexName, taxCountry)
    const configExtensions = 'extensions' in this._config // check 'extensions' defined in config

    // console.log('after ProcessorFactory31221 platform', platform);
    // console.log('after ProcessorFactory31221 this._indexName', this._indexName);
    // console.log('after ProcessorFactory31221 taxCountry', taxCountry);
    console.log('after ProcessorFactory31221 items', items);
    // console.log('after ProcessorFactory31221 groupId', groupId);
    processorChain.push(taxProcessor.process(items, groupId))
    // console.log('after ProcessorFactory31220', processorChain);

    for (const ext of this._config.registeredExtensions) {
      // console.log('after ProcessorFactory31221 ext', ext);
      // in each registered extension, check 'resultProcessor' is defined
      if (configExtensions && (ext in this._config.extensions) && ('resultProcessors' in this._config.extensions[ext]) && ('product' in this._config.extensions[ext].resultProcessors)) {
        const extProcessorPath = '../api/extensions/' + ext + '/processors'
        try {
          // attempt to instanitate an adapter class, defined in /src/api/extensions/[ext]/processor/[resultProcessors.product].js
          const extProcessor = factory.getAdapter(extProcessorPath, this._config.extensions[ext].resultProcessors.product, this._indexName)
          // if the adapter instance is successfully created, add it to the processor chain
          processorChain.push(extProcessor.process(items))
        } catch (err) {
          // Additional processor not found or failed
          console.log('Additional processor not found or failed', err)
        }
      }
    }

    // console.log('after ProcessorFactory31221', processorChain);
    return Promise.all(processorChain).then((resultSet) => {
      console.log('after ProcessorFactory31221110', resultSet);
      if (!resultSet || resultSet.length === 0) {
        throw Error('error with resultset for processor chaining')
      }

      if (this._req.query._source_exclude && this._req.query._source_exclude.indexOf('sgn') < 0) {
        const rs = resultSet[0].map((item) => {
          // console.log('after ProcessorFactory31221111');
          if (!item._source) { return item }
          // console.log('after ProcessorFactory31221112');

          const config = this._config
          let sgnObj = (config.tax.calculateServerSide === true) ? { priceInclTax: item._source.priceInclTax } : { price: item._source.price }
          item._source.sgn = hmac.sign(sgnSrc(sgnObj, item), config.objHashSecret); // for products we sign off only price and id becase only such data is getting back with orders

          // console.log('after ProcessorFactory31222');
          if (item._source.configurable_children) {
            item._source.configurable_children = item._source.configurable_children.map((subItem) => {
              if (subItem) {
                let sgnObj = (config.tax.calculateServerSide === true) ? { priceInclTax: subItem.priceInclTax } : { price: subItem.price }
                subItem.sgn = hmac.sign(sgnSrc(sgnObj, subItem), config.objHashSecret);
              }

              return subItem
            })
          }

          // console.log('after ProcessorFactory31223');
          return item
        })

        // return first resultSet
        return rs
      } else {
        // console.log('after ProcessorFactory31224');
        return resultSet[0]
      }
    })
  }
}

module.exports = ProductProcessor
