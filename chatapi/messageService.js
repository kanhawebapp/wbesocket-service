
require('dotenv').config();
const axios = require('axios');


async function insertData(data) {
    const URL = 'https://chat.dhwaniastro.co.in/api';
    try {
 const response = await axios.post(`${URL}/chat/message`, data);
        return response.data;
    } catch (error) {
  
        throw error.response ? error.response.data : error;
    }
}

module.exports = insertData;
