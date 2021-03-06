const db = require('../models/db')();
const formidable = require('formidable');
const fs = require('fs');
const path = require('path');
const validation = require('../libs/validation');

// Обработка GET запроса. Рендеринг страницы admin
module.exports.getAdmin = function (req, res) {
  res.render('pages/admin', {
    title: 'Admin page'
  });
};

// Обработка POST запроса. Сохранение анкеты в БД
module.exports.sendSkills = (req, res, next) => {
  const { age, concerts, cities, years } = req.body;

  // Валидация формы
  let isValid = validation.validateFields(req.body);
  if (!isValid) {
    req.flash('skillsErrMsg', 'Поля не заполнены');
    return res.render('pages/admin', { msgskill: req.flash('skillsErrMsg') });
  }

  // Запись новой анкеты в БД
  db.set('skills', [{
    number: age,
    text: 'Возраст начала занятий на скрипке'
  }, {
    number: concerts,
    text: 'Концертов отыграл'
  }, {
    number: cities,
    text: 'Максимальное число городов в туре'
  }, {
    number: years,
    text: 'Лет на сцене в качестве скрипача'
  }]);

  db.save();

  req.flash('success', 'Данные отправлены');
  return res.redirect(`/admin?msg=Данные отправлены`);
};

// Обработка POST запроса. Сохранение нового товара в БД
module.exports.uploadGood = (req, res, next) => {
  let form = new formidable.IncomingForm();
  let upload = './public/upload';
  let fileName;

  form.uploadDir = path.join(process.cwd(), upload);

  form.parse(req, (err, fields, files) => {
    if (err) {
      return next(err);
    }

    // Валидация формы
    let areFieldsValidValid = validation.validateFields(fields);
    let isFileValid = validation.validateUpload(files.photo);
    if (!areFieldsValidValid || !isFileValid) {
      fs.unlinkSync(files.photo.path);
      req.flash('uploadErrMsg', 'Заполните все поля');
      return res.render('pages/admin', { msgfile: req.flash('uploadErrMsg') });
    }

    fileName = path.join(upload, files.photo.name);

    // Загрузка фотографии в папку upload
    fs.rename(files.photo.path, fileName, function (err) {
      if (err) {
        console.error(err);
        fs.unlinkSync(fileName);
        fs.rename(files.photo.path, fileName);
      }

      // Запись данных о новом товаре в БД
      let goods = db.get('goods') || [];
      goods.push({
        photo: files.photo.name,
        src: path.join('./upload', files.photo.name),
        name: fields.name,
        price: fields.price
      });
      db.set('goods', [ ...goods ]);
      db.save();

      req.flash('success', 'Товар загружен');
      return res.redirect(`/admin?msg=Товар загружен`);
    });
  });
};
