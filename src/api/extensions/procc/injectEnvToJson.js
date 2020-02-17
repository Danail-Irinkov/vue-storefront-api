const path = require('path');
const fs = require('fs');

let changed_fields = []
function replace_data (data, hide_logs = false) {
  if (data) {
    Object.keys(data).forEach((key) => {
      let value = data[key];
      if (value && typeof (value) === 'object') {
        replace_data(value, true);
      } else {
        if (key === 'secretString') {
          console.log('key', key, 'value', value)
          console.log('process.env', process.env[key])
          console.log('process.env', process.env.hasOwnProperty(key))
        }

        if (value === 'mailgun_pass_support' && process.env.hasOwnProperty(value)) {
          changed_fields.push(value)
          data[key] = process.env[value];
          console.log('changed config value:', key, data[key])
        }

        if (process.env.hasOwnProperty(key) && key !== 'path' && key !== 'name') {
          changed_fields.push(key)
          data[key] = process.env[key];
        }
      }
    });
    if (!hide_logs) {
      console.log('CONFIG FIELDS LOADED FROM ENV VARIABLES:')
      console.log(changed_fields)
      console.log('CONFIG FIELDS LOADED FROM ENV VARIABLES:')
    }
  } else {
    console.log('FAILED DATA INJECT OBJ:', data)
  }
  return data;
}

export default {
  buildKubeConfig (filename, config_data) {
    if (!path.resolve(filename)) {
      console.log('missing input file argument');
      process.exit(1);
    }
    let data = fs.readFileSync(path.resolve(filename))
    let jsonContent = JSON.parse(data);
    console.log('Data "jsonContent:', jsonContent)
    if (!jsonContent) {
      console.log('missing input config file raw data');
      process.exit(1);
    }

    // console.log('Data "jsonContent:', config_data)
    return fs.writeFileSync(path.resolve(filename), JSON.stringify(replace_data(config_data), {}, 4))
  }
}
