
require('dotenv').config();
const axios = require('axios');
const url = require('./api');

async function chat_reject(data) {

    const URL = url; 

    try {
const response = await axios.post(`${URL}/chat/chat_reject_data`, data);

        
        return response.data;
    } catch (error) {
  
        throw error.response ? error.response.data : error;
    }
}

module.exports = chat_reject;