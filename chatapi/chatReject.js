
require('dotenv').config();
const axios = require('axios');
async function chat_reject(data) {

    const URL = 'https://chat.dhwaniastro.co.in/api'; 
    // const URL = 'http://127.0.0.1:8000/api'; 
    try {

        console.log('he;llo',data);
        
        const response = await axios.post(`${URL}/chat/chat_reject_data`, data);

        
        return response.data;
    } catch (error) {
  
        throw error.response ? error.response.data : error;
    }
}

module.exports = chat_reject;