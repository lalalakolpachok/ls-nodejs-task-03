const db = require('../models/db')();
const validateFields = require('../libs/validation').validateFields;
const nodemailer = require('nodemailer');

// Обработка GET запроса. Рендеринг главной страницы
module.exports.getHome = function (req, res) {
  res.render('pages/index', {
    msgsemail: req.flash('error'),
    goods: db.get('goods'),
    skills: db.get('skills')
  });
};

// Обработка POST запроса. Сохранение сообщения от пользователя в БД
module.exports.sendEmail = (req, res, next) => {
  const { email, name, message } = req.body;

  let isValid = validateFields(req.body);
  if (!isValid) {
    req.flash('error', 'Заполните все поля');
    return res.redirect('/?msg=Поля не заполнены');
  }

  // Запись нового сообщения от пользователя в БД
  let emails = db.get('emails') || [];
  emails.push({
    email: email,
    name: name,
    message: message
  });

  db.set('emails', [ ...emails ]);
  db.save();

  // Создаем тестовый акаунт и отправляем сообщение с него
  nodemailer.createTestAccount((err, account) => {
    if (err) {
      return console.log(err);
    }

    let transporter = nodemailer.createTransport({
      host: 'smtp.ethereal.email',
      port: 587,
      secure: false, // true for 465, false for other ports
      auth: {
        user: account.user,
        pass: account.pass
      }
    });

    let mailOptions = {
      from: `"${name}" <${email}>`,
      to: account.user,
      subject: 'Сообщение с сайта',
      text: message.trim().slice(0, 500) + `\n Отправлено с: <${email}>`,
      html: `<p>${message}</p>`
    };

    transporter.sendMail(mailOptions, (error, info) => {
      if (error) {
        req.flash('error', error.message);
        return res.redirect('/');
      }

      console.log('Message sent: %s', info.messageId);
      console.log('Preview URL: %s', nodemailer.getTestMessageUrl(info));

      req.flash('success', 'Ваше сообщение было отправлено');
      return res.redirect('/?msg=Сообщение отправлено');
    });
  });
};
