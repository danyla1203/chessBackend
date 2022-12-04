import { DataSource } from 'typeorm';
import { AuthEntity } from './Entities/AuthEntity';
import { UserEntity } from './Entities/UserEntity';

const { HOST, DB_NAME, DB_PASSWORD, DB_PORT, DB_USERNAME } = process.env;
console.log(HOST, DB_NAME, DB_PASSWORD, DB_PORT);

export const dataSource = new DataSource({
  type: 'postgres',
  host: HOST,
  port: parseInt(DB_PORT, 10),
  username: DB_USERNAME,
  database: DB_NAME,
  password: DB_PASSWORD,
  entities: [ UserEntity, AuthEntity ]
});