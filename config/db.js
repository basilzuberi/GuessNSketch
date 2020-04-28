const mongoose = require("mongoose");
require('dotenv').config();
// Replace this with your MONGOURI.
const MONGOURI = "mongodb+srv://hamdan:gamedb@gamedb-2ci1f.mongodb.net/test?retryWrites=true&w=majority";

const InitiateMongoServer = async () => {
  try {
    await mongoose.connect(MONGOURI, {
      useNewUrlParser: true
    });
    console.log("Connected to DB !!");
  } catch (e) {
    console.log(e);
    throw e;
  }
};

module.exports = InitiateMongoServer;