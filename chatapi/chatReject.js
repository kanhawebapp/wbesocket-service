
require('dotenv').config();
const axios = require('axios');
async function chat_reject(data) {

   
    try {
        const URL = 'https://chat.dhwaniastro.co.in/api';
        const response = await axios.post(`${URL}/chat/chat_reject_data`, data);
        return response.data;
    } catch (error) {
  
        throw error.response ? error.response.data : error;
    }
}

module.exports = chat_reject;