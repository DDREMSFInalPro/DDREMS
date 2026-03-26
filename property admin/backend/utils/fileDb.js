const fs = require('fs');
const path = require('path');
const jsonfile = require('jsonfile');

const dataDir = path.join(__dirname, '../data');

// Ensure data directory exists
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const getFilePath = (collection) => path.join(dataDir, `${collection}.json`);

const initializeCollection = (collection, defaultData = []) => {
  const filePath = getFilePath(collection);
  if (!fs.existsSync(filePath)) {
    jsonfile.writeFileSync(filePath, defaultData);
  }
};

const readCollection = (collection) => {
  const filePath = getFilePath(collection);
  try {
    if (!fs.existsSync(filePath)) {
      return [];
    }
    return jsonfile.readFileSync(filePath);
  } catch (error) {
    console.error(`Error reading ${collection}:`, error);
    return [];
  }
};

const writeCollection = (collection, data) => {
  const filePath = getFilePath(collection);
  try {
    jsonfile.writeFileSync(filePath, data, { spaces: 2 });
    return true;
  } catch (error) {
    console.error(`Error writing ${collection}:`, error);
    return false;
  }
};

const findById = (collection, id) => {
  const data = readCollection(collection);
  return data.find((item) => item._id === id || item.id === id);
};

const findAll = (collection) => {
  return readCollection(collection);
};

const create = (collection, item) => {
  const data = readCollection(collection);
  data.unshift(item);
  writeCollection(collection, data);
  return item;
};

const update = (collection, id, updates) => {
  const data = readCollection(collection);
  const index = data.findIndex((item) => item._id === id || item.id === id);
  if (index !== -1) {
    data[index] = { ...data[index], ...updates };
    writeCollection(collection, data);
    return data[index];
  }
  return null;
};

const deleteItem = (collection, id) => {
  const data = readCollection(collection);
  const filtered = data.filter((item) => item._id !== id && item.id !== id);
  writeCollection(collection, filtered);
  return true;
};

const filter = (collection, predicate) => {
  const data = readCollection(collection);
  return data.filter(predicate);
};

module.exports = {
  initializeCollection,
  readCollection,
  writeCollection,
  findById,
  findAll,
  create,
  update,
  deleteItem,
  filter,
  getFilePath,
};
