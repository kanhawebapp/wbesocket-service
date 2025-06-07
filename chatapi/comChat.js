const axios = require('axios');


async function comchat(data) {
    try {
        const response = await axios.post('http://127.0.0.1:8000/api/chat/completed', data);
        return response.data;
    } catch (error) {
  
        throw error.response ? error.response.data : error;
    }
}

module.exports = comchat;
