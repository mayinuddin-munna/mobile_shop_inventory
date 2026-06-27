const { EventEmitter } = require("events");

const notificationBus = new EventEmitter();

notificationBus.setMaxListeners(0);

function publishNotification(notification) {
  notificationBus.emit("sale", notification);
}

function subscribeToSales(listener) {
  notificationBus.on("sale", listener);

  return () => {
    notificationBus.off("sale", listener);
  };
}

module.exports = {
  publishNotification,
  subscribeToSales
};
