
require('dotenv').config();
const axios = require('axios');


async function insertData(data) {
    try {
  const response = await axios.post(`${process.env.API_URL}/chat/message`, data);
        return response.data;
    } catch (error) {
  
        throw error.response ? error.response.data : error;
    }
}

module.exports = insertData;
