const express = require('express');
const path = require('path');
const cors = require('cors');
const faker = require('faker');
let config = require('../config/defaultConfig.json');

try {
  const configPath = process.cwd() + path.sep + 'config.json';
  config = require(configPath);
  console.log('Using custom config from config.json.');
} catch {}

const seed = getRandomSeedFromConfig();
const app = express();

app.use(cors());

app.get('/', function(req, res) {
  res.send('Welcome to the root!');
});

Object.keys(config.paths).forEach(path => {
  Object.keys(config.paths[path]).forEach(method => {
    const methodObject = config.paths[path][method];
    const endPoint = app[method].bind(app);
    if (methodObject.response) {
      const response = methodObject.response;
      let responseBody;
      if (response.generateResponse) {
        responseBody = generateResposnseFromObject(response.generateResponse);
      } else {
        responseBody = response.body;
      }
      endPoint('/' + path, function(req, res) {
        res.status(response.status).json(responseBody);
      });
    } else {
      endPoint('/' + path, function(req, res) {
        res.json({ defaultValue: `Hello World from ${path}` });
      });
    }
  });
});

function generateResposnseFromObject(generatedResposneParameters) {
  const { seed, count, objectProperties, locale } = generatedResposneParameters;
  let response = [];
  faker.seed(seed);
  if (locale) {
    faker.locale = locale;
  }

  if (count === 0) {
    return generateObjectFromProperties(objectProperties);
  }

  for (let k = 0; k < count; k++) {
    response.push(generateObjectFromProperties(objectProperties));
  }
  return response;
}

function generateObjectFromProperties(objectProperties) {
  let newResponseElement = {};
  objectProperties.forEach(param => {
    const paramParts = param.path.split('.');
    let fakerRef = faker;
    paramParts.forEach(part => {
      if (fakerRef[part]) {
        fakerRef = fakerRef[part];
      }
    });
    newResponseElement[param.value] = fakerRef();
  });
  return newResponseElement;
}

function getRandomSeedFromConfig() {
  if (config.generator && config.generator.seed) {
    return config.generator.seed;
  }
  return Math.floor(Math.random() * 10e6);
}

module.exports.app = app;
