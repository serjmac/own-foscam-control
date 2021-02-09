const mongoose = require("mongoose");
const Foscam = require("../models/foscam");

mongoose.connect("mongodb://localhost:27017/foscam", {
  useNewUrlParser: true,
  useCreateIndex: true,
  useUnifiedTopology: true,
});

const db = mongoose.connection;

db.on("error", console.error.bind(console, "connection error:"));
db.once("open", function () {
  console.log(" database connected OK");
});

userAgentFake = "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:84.0) Gecko/20100101 Firefox/84.0";

function randomIP() {
  const number = Math.random() * 1;
  if (number > 0.5) {
    return "192.168.62.20";
  } else {
    return "192.168.62.35";
  }
}

function randomUserAgent() {
  const number = Math.random() * 1;
  if (number > 0.5) {
    return "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:84.0) Gecko/20100101 Firefox/84.0";
  } else {
    return "Mozilla/5.0 (Android 9; Mobile; rv:84.0) Gecko/84.0 Firefox/84.0";
  }
}

function randomSwitch() {
  const number = Math.random() * 1;
  if (number > 0.5) {
    return "ON";
  } else {
    return "OFF";
  }
}
const seedDB = async () => {
  let first = new Date("2019-12-31T01:00:00.000Z");

  for (let i = 0; i < 17520; i++) {
    //  first = new Date(first.getTime() + 1000 * 60 * 60 * 24);
    first = new Date(first.getTime() + 1000 * 60 * 60 * 0.5); //one activation for every 30 minutes
    const foscamSwitch = {
      switch: randomSwitch(),
      time: first,
      //time: new Date().toLocaleString(),
      userIP: randomIP(),
      userAgent: randomUserAgent(),
    };
    const newSwitch = new Foscam(foscamSwitch);
    console.log(newSwitch);
    await newSwitch.save();
  }
};

seedDB().then(() => {
  mongoose.connection.close();
  console.log("done");
});
