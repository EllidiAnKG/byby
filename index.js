const { Telegraf } = require('telegraf');
const fetch = require('node-fetch');
const bot = new Telegraf("7155212018:AAGo-oJNsZwZWJjP2hLo9F6x0PFL_8s7nSU");


let allVacancies = []; 
let currentVacancies = []; 

let selectedCity = ''; 
let currentVacanciesInCity = [];


async function parseVacancies(searchTerm, chatId) {
    const url = `https://api.hh.ru/vacancies?text=${searchTerm}`;

    try {
        const response = await fetch(url);
        const data = await response.json();

        if (data.items.length === 0) {
            bot.telegram.sendMessage(chatId, 'Нету вакансий', {
                reply_markup: {
                    inline_keyboard: [
                        [{ text: 'выбрать город', callback_data: 'select_city' }],
                    ]
                }
            });
        } else {
            allVacancies = data.items;
            currentVacancies = allVacancies.slice(0, 5);
            const message = getVacanciesMessage(currentVacancies);
            bot.telegram.sendMessage(chatId, message, {
                reply_markup: {
                    inline_keyboard: [
                        [{ text: 'Еще вакансии', callback_data: 'more_vacancies' }],
                        [{ text: 'Другая профессия', callback_data: 'other_profession' }]
                    ]
                }
            });
        }
    } catch (error) {
        console.error(error);
        bot.telegram.sendMessage(chatId, 'Ошибка при выполнении запроса: Bad Request');
    }
}

function getVacanciesMessage(vacancies) {
    let message = '';
    vacancies.forEach((vacancy, index) => {
        message += `Вакансия ${index + 1}:\n${vacancy.name}\nТребования: ${vacancy.snippet.requirement}\nЗарплата: ${vacancy.salary ? vacancy.salary.from : 'Не указана'}\nСсылка на вакансию: ${vacancy.url}\n\n`;
    });
    return message;
}

bot.action('more_vacancies', ctx => {
    try {
        currentVacancies = allVacancies.slice(currentVacancies.length, currentVacancies.length + 5);
        const message = getVacanciesMessage(currentVacancies);

        ctx.editMessageText(message, {
            reply_markup: {
                inline_keyboard: [
                    [{ text: 'Еще вакансии', callback_data: 'more_vacancies' }],
                    [{ text: 'Другая профессия', callback_data: 'other_profession' }],
                    [{ text: 'выбрать город', callback_data: 'select_city' }]
                ]
            }
        });
    } catch (error) {
        console.error('Произошла ошибка при обработке действия "more_vacancies":', error);
    }
});



bot.action('other_profession', ctx => {
    allVacancies = [];
    currentVacancies = [];
    ctx.reply('Введите другую профессию, чтобы найти вакансии:');
});




bot.start(ctx => {
    selectCity(ctx.chat.id);
});

bot.action('select_city', ctx => {
    selectCity(ctx.chat.id);
});

bot.on('text', ctx => {
    const chatId = ctx.chat.id;
    const text = ctx.message.text;

    if (!selectedCity) {
        selectedCity = text;
        parseVacanciesByCity(text, chatId);
    } else {
        parseVacancies(text, chatId);
    }
});




async function parseVacanciesByCity(searchTerm, chatId) {
    const url = `https://api.hh.ru/vacancies?text=${searchTerm}&area=${selectedCity}`;

    try {
        const response = await fetch(url);
        const data = await response.json();

        if (data.items && data.items.length > 0) {
            allVacancies = data.items;
            currentVacanciesInCity = allVacancies.slice(0, 5);
            const message = getVacanciesMessage(currentVacanciesInCity);

            bot.telegram.sendMessage(chatId, message, {
                reply_markup: {
                    inline_keyboard: [
                        [{ text: 'Еще вакансии', callback_data: 'more_vacancies' }],
                        [{ text: 'Другая профессия', callback_data: 'other_profession' }],
                        [{ text: 'выбрать город', callback_data: 'select_city' }]
                    ]
                }
            });
        } else {
            bot.telegram.sendMessage(chatId, 'Нет доступных вакансий по выбранному городу.', {
                reply_markup: {
                    inline_keyboard: [
                        [{ text: 'выбрать город', callback_data: 'select_city' }],
                    ]
                }
            });
        }
    } catch (error) {
        bot.telegram.sendMessage(chatId, 'Ошибка при выполнении запроса: ' + error.message);
    }
}


async function selectCity(chatId) {
    bot.telegram.sendMessage(chatId, 'Введите название города для поиска вакансий:');
}




bot.launch();





