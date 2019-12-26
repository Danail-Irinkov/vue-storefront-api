import AbstractTaxProxy from '../abstract/tax'
import { calculateProductTax } from '../../lib/taxcalc'
import TierHelper from '../../helpers/priceTiers'
import es from '../../lib/elastic'
import bodybuilder from 'bodybuilder'

class TaxProxy extends AbstractTaxProxy {
  constructor (config, entityType, indexName, taxCountry, taxRegion = '', sourcePriceInclTax = null, finalPriceInclTax = null) {
    super(config)
    this._entityType = entityType
    this._indexName = indexName
    this._sourcePriceInclTax = sourcePriceInclTax
    this._finalPriceInclTax = finalPriceInclTax

    if (this._config.storeViews && this._config.storeViews.multistore) {
      for (let storeCode in this._config.storeViews) {
        const store = this._config.storeViews[storeCode]
        if (typeof store === 'object') {
          if (store.elasticsearch && store.elasticsearch.index) { // workaround to map stores
            if (store.elasticsearch.index === indexName) {
              taxRegion = store.tax.defaultRegion
              taxCountry = store.tax.defaultCountry
              sourcePriceInclTax = store.tax.sourcePriceIncludesTax
              finalPriceInclTax = store.tax.finalPriceIncludesTax
              break;
            }
          }
        }
      }
    } else {
      if (!taxRegion) {
        taxRegion = this._config.tax.defaultRegion
      }
      if (!taxCountry) {
        taxCountry = this._config.tax.defaultCountry
      }
    }
    if (sourcePriceInclTax === null) {
      sourcePriceInclTax = this._config.tax.sourcePriceIncludesTax
    }
    if (finalPriceInclTax === null) {
      finalPriceInclTax = this._config.tax.finalPriceIncludesTax
    }
    this._deprecatedPriceFieldsSupport = this._config.tax.deprecatedPriceFieldsSupport
    this._taxCountry = taxCountry
    this._taxRegion = taxRegion
    this._sourcePriceInclTax = sourcePriceInclTax
    this._finalPriceInclTax = finalPriceInclTax
    console.log('Taxes will be calculated for', taxCountry, taxRegion, sourcePriceInclTax)
    this.taxFor = this.taxFor.bind(this)
  }

  taxFor (product) {
    return calculateProductTax(product, this._taxClasses, this._taxCountry, this._taxRegion, this._sourcePriceInclTax, this._deprecatedPriceFieldsSupport, this._finalPriceInclTax)
  }

  applyTierPrices (productList, groupId) {
    if (this._config.usePriceTiers) {
      for (let item of productList) {
        TierHelper(item._source, groupId)
      }
    }
  }

  process (productList, groupId = null) {
    const inst = this
    return new Promise((resolve, reject) => {
      inst.applyTierPrices(productList, groupId)

      if (this._config.tax.calculateServerSide) {
        const client = es.getClient(this._config)
        const esQuery = {
          index: this._indexName,
          type: 'taxrule',
          body: bodybuilder()
        }
        client.search(esQuery).then((taxClasses) => { // we're always trying to populate cache - when online
          inst._taxClasses = taxClasses.hits.hits.map(el => { return el._source })
          for (let item of productList) {
            inst.taxFor(item._source)
          }

          resolve(productList)
        }).catch(err => {
          reject(err)
        })
      } else {
        resolve(productList)
      }
    })
  }
}

module.exports = TaxProxy
