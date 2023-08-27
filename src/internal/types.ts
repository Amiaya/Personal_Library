const INTERNAL_TYPES = {
  Logger: Symbol.for("Logger"),
  Env: Symbol.for("Env"),
  KnexDB: Symbol.for("KnexDB"),
  Redis: Symbol.for("Redis"),
  RedisStore: Symbol.for("RedisStore"),
};

export default INTERNAL_TYPES;
