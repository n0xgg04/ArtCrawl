import axios from "axios"
import axiosRetry from "axios-retry"
import { TELEGRAM } from './config/telegram.js'


axiosRetry(axios, {
    retries: 3, // number of retries
    retryDelay: (retryCount) => {
        return retryCount * 2000; // time delay between retries in ms
    },
    retryCondition: (error) => {
        return error.response.status === 429; // retry only on status code 429 (Too Many Requests)
    }
});

export async function sendNotification(text, photoUrl) {
    const params = {
        chat_id: TELEGRAM.chatId,
        photo: photoUrl,
        text: text,
        caption: text,
        parse_mode: 'HTML'
    }
    await axios.get(`https://api.telegram.org/bot${TELEGRAM.token}/sendPhoto`, { params })
        .then((response) => {
            console.log("Sent notification to admin successfully!")
        }).catch((error) => {
            console.log("Cann't send notification to admin group!" + error)
        });
}