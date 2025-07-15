
import axios from 'axios';
import {url} from './api.js';

async function chatReject(data) {

    const URL = url; 

    try {
const response = await axios.post(`${URL}/chat/chat_reject_data`, data);

        
        return response.data;
    } catch (error) {
  
        throw error.response ? error.response.data : error;
    }
}


export {chatReject};