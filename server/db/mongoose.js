var mongoose = require('mongoose');

mongoose.Promise = global.Promise;
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/eBookLibTest');//, {
//   useMongoClient: true,
// });

module.exports = {
  mongoose
};
//
//
// var promise = mongoose.connect('mongodb://localhost/myapp', {
//   useMongoClient: true,
//   /* other options */
// });
