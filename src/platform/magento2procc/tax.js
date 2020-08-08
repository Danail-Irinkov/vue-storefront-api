import AbstractTaxProxy from '../abstract/tax'
import { calculateProductTax, checkIfTaxWithUserGroupIsActive, getUserGroupIdToUse } from '../../lib/taxcalc';
import TierHelper from '../../helpers/priceTiers'
import es from '../../lib/elastic'
import bodybuilder from 'bodybuilder'

class TaxProxy extends AbstractTaxProxy {
  constructor (config, entityType, indexName, taxCountry, taxRegion = '', sourcePriceInclTax = null, finalPriceInclTax = null) {
    console.log('after TaxCconstructor1');
    super(config)
    this._entityType = entityType
    this._indexName = indexName
    this._sourcePriceInclTax = sourcePriceInclTax
    this._finalPriceInclTax = finalPriceInclTax
    this._userGroupId = this._config.tax.userGroupId
    this._storeConfigTax = this._config.tax

    // console.log('after TaxCconstructor2');
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
              this._storeConfigTax = store.tax
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
    // console.log('after TaxCconstructor3', finalPriceInclTax);
    this._deprecatedPriceFieldsSupport = this._config.tax.deprecatedPriceFieldsSupport
    this._taxCountry = taxCountry
    this._taxRegion = taxRegion
    this._sourcePriceInclTax = sourcePriceInclTax
    this._finalPriceInclTax = finalPriceInclTax
    // console.log('after TaxCconstructor4');
    this.taxFor = this.taxFor.bind(this)
    // console.log('after TaxCconstructor5');
  }

  taxFor (product, groupId) {
    return calculateProductTax({
      product,
      taxClasses: this._taxClasses,
      taxCountry: this._taxCountry,
      taxRegion: this._taxRegion,
      sourcePriceInclTax: this._sourcePriceInclTax,
      deprecatedPriceFieldsSupport: this._deprecatedPriceFieldsSupport,
      finalPriceInclTax: this._finalPriceInclTax,
      userGroupId: groupId,
      isTaxWithUserGroupIsActive: checkIfTaxWithUserGroupIsActive(this._storeConfigTax) && typeof groupId === 'number'
    })
  }

  applyTierPrices (productList, groupId) {
    if (this._config.usePriceTiers) {
      for (let item of productList) {
        TierHelper(item._source, groupId)
      }
    }
  }

  process (productList, groupId = null) {
    console.log('after TaxProcess1');
    const inst = this
    return new Promise((resolve, reject) => {
      inst.applyTierPrices(productList, groupId)
      // console.log('after TaxProcess2');

      if (this._config.tax.calculateServerSide) {
        const client = es.getClient(this._config)
        const esQuery = es.adjustQuery({
          index: this._indexName,
          body: bodybuilder()
        }, 'taxrule', this._config)
        // console.log('after TaxProcess3');
        client.search(esQuery).then((body) => { // we're always trying to populate cache - when online
          // console.log('after TaxProcess4');
          inst._taxClasses = es.getHits(body).map(el => { return el._source })
          // console.log('after TaxProcess5');
          for (let item of productList) {
            const isActive = checkIfTaxWithUserGroupIsActive(inst._storeConfigTax)
            // console.log('after TaxProcess6');
            if (isActive) {
              groupId = getUserGroupIdToUse(inst._userGroupId, inst._storeConfigTax)
              // console.log('after TaxProcess7');
            } else {
              groupId = null
            }

            console.log('after TaxProcess8');
            inst.taxFor(item._source, groupId)
            // console.log('after TaxProcess9');
          }

          resolve(productList)
        }).catch(err => {
          console.log('after TaxProcess10');
          reject(err)
        })
      } else {
        console.log('after TaxProcess11');
        resolve(productList)
      }
    })
  }
}

module.exports = TaxProxy
