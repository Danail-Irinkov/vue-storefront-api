'use strict';

/**
 * Check if the module exists
 * @param module name name
 */
function module_exists (name) {
  try { return require.resolve(name) } catch (e) { return false }
}

class ProcessorFactory {
  constructor (app_config) {
    this.config = app_config;
  }

  getAdapter (entityType, indexName, req, res) {
    const moduleName = './' + entityType

    if (!module_exists(moduleName)) {
      console.log('No additional data adapter for ' + entityType)
      return null
    }

    // console.log('after ProcessorFactory311', moduleName);
    let AdapterClass = require(moduleName);
    // console.log('after ProcessorFactory31111');
    if (!AdapterClass) {
      console.log('No additional data adapter for ' + entityType)
      return null
    } else {
      // console.log('after ProcessorFactory312');
      let adapter_instance = new AdapterClass(this.config, entityType, indexName, req, res);
      // console.log('after ProcessorFactory313');

      if ((typeof adapter_instance.isValidFor === 'function') && !adapter_instance.isValidFor(entityType)) { throw new Error('Not valid adapter class or adapter is not valid for ' + entityType); }

      // console.log('after ProcessorFactory314');
      return adapter_instance;
    }
  }
}

module.exports = ProcessorFactory;
