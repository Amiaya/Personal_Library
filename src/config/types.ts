const APP_TYPES = {
  AuthMiddleware: Symbol.for("AuthMiddleware"),
  UserRepository: Symbol.for("UserRepository"),
  UserService: Symbol.for("UserService"),
  EmailClient: Symbol.for("EmailClient"),
  EmailService: Symbol.for("EmailService"),
  UserEmails: Symbol.for("UserEmails"),
  FileRepository: Symbol.for("FileRepository"),
  AccessMiddleware: Symbol.for("AccessMiddleware"),
  HistoryRepository: Symbol.for("HistoryRepository"),
};

export default APP_TYPES;
