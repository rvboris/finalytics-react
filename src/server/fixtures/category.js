export default {
  ru: {
    name: '/',
    type: 'any',
    system: true,
    children: [
      {
        name: 'Без категории',
        type: 'any',
        system: true,
        blank: true,
      },
      {
        name: 'Корректировка',
        type: 'any',
        system: true,
      },
      {
        name: 'Перевод',
        type: 'any',
        transfer: true,
        system: true,
      },
      {
        name: 'Зарплата',
        type: 'income',
      },
      {
        name: 'Подработка',
        type: 'income',
      },
      {
        name: 'Другие доходы',
        type: 'income',
      },
      {
        name: 'Питание',
        type: 'expense',
        children: [
          {
            name: 'Обеды на работе',
            type: 'expense',
          },
          {
            name: 'Продукты домой',
            type: 'expense',
          },
          {
            name: 'Кафе, рестораны',
            type: 'expense',
          },
          {
            name: 'Службы доставки',
            type: 'expense',
          },
        ],
      },
      {
        name: 'Одежда',
        type: 'expense',
        children: [
          {
            name: 'Аксессуары',
            type: 'expense',
          },
          {
            name: 'Нижнее белье, купальники',
            type: 'expense',
          },
        ],
      },
      {
        name: 'Медицина',
        type: 'expense',
        children: [
          {
            name: 'Аптека',
            type: 'expense',
          },
          {
            name: 'Анализы',
            type: 'expense',
          },
          {
            name: 'Консультации, больницы',
            type: 'expense',
          },
          {
            name: 'Другая медицина',
            type: 'expense',
          },
        ],
      },
      {
        name: 'Дом, дача',
        type: 'expense',
        children: [
          {
            name: 'Хозтовары',
            type: 'expense',
          },
          {
            name: 'Ремонт',
            type: 'expense',
          },
          {
            name: 'Ребенок',
            type: 'expense',
          },
          {
            name: 'Животные',
            type: 'expense',
          },
          {
            name: 'Предметы интерьера',
            type: 'expense',
          },
          {
            name: 'Другое для дома, дачи',
            type: 'expense',
          },
        ],
      },
      {
        name: 'Автомобиль',
        type: 'expense',
        children: [
          {
            name: 'Топливо',
            type: 'expense',
          },
          {
            name: 'Сервис',
            type: 'expense',
          },
          {
            name: 'Страховка',
            type: 'expense',
          },
          {
            name: 'Запчасти',
            type: 'expense',
          },
          {
            name: 'Другие авто. расходы',
            type: 'expense',
          },
        ],
      },
      {
        name: 'Транспорт',
        type: 'expense',
        children: [
          {
            name: 'Общественный транспорт',
            type: 'expense',
          },
          {
            name: 'Такси',
            type: 'expense',
          },
          {
            name: 'Ж/Д билеты',
            type: 'expense',
          },
          {
            name: 'Авиа билеты',
            type: 'expense',
          },
          {
            name: 'Другой транспорт',
            type: 'expense',
          },
        ],
      },
      {
        name: 'Платежи',
        type: 'expense',
        children: [
          {
            name: 'Коммунальные платежи',
            type: 'expense',
            children: [
              {
                name: 'Электричество',
                type: 'expense',
              },
              {
                name: 'Аренда',
                type: 'expense',
              },
              {
                name: 'Телефон',
                type: 'expense',
              },
              {
                name: 'Вода',
                type: 'expense',
              },
              {
                name: 'Газ',
                type: 'expense',
              },
            ],
          },
          {
            name: 'Сотовая связь',
            type: 'expense',
          },
          {
            name: 'Интернет',
            type: 'expense',
            children: [
              {
                name: 'Абонетская плата',
                type: 'expense',
              },
              {
                name: 'Сервисы',
                type: 'expense',
              },
            ],
          },
          {
            name: 'Телевидение',
            type: 'expense',
          },
          {
            name: 'Учеба',
            type: 'expense',
          },
          {
            name: 'Гос. услуги',
            type: 'expense',
          },
          {
            name: 'Банковское обслуживание',
            type: 'expense',
          },
          {
            name: 'Подписки',
            type: 'expense',
          },
          {
            name: 'Другие платежи',
            type: 'expense',
          },
        ],
      },
      {
        name: 'Техника',
        type: 'expense',
        children: [
          {
            name: 'Бытовая техника',
            type: 'expense',
          },
          {
            name: 'Мобильные гаджеты',
            type: 'expense',
          },
          {
            name: 'Компьютерная техника',
            type: 'expense',
          },
          {
            name: 'Инструменты',
            type: 'expense',
          },
          {
            name: 'Другая техника',
            type: 'expense',
          },
        ],
      },
      {
        name: 'Спортивные товары',
        type: 'expense',
      },
      {
        name: 'Другие траты',
        type: 'expense',
        children: [
          {
            name: 'Подарки, праздники',
            type: 'expense',
          },
          {
            name: 'Отдых, развлечения',
            type: 'expense',
          },
          {
            name: 'Разовые траты',
            type: 'expense',
          },
          {
            name: 'Уход за собой',
            type: 'expense',
          },
        ],
      },
    ],
  },
};
