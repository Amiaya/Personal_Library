const INTERNAL_TYPES = {
  Logger: Symbol.for("Logger"),
  Env: Symbol.for("Env"),
  KnexDB: Symbol.for("KnexDB"),
  Redis: Symbol.for("Redis"),
  RedisStore: Symbol.for("RedisStore"),
  S3Config: Symbol.for("S3Config"),
};

export default INTERNAL_TYPES;
