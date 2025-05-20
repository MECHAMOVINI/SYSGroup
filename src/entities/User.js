import { EntitySchema } from 'typeorm';

export const User = new EntitySchema({
  name: 'User',
  tableName: 'users',
  columns: {
    id: {
      primary: true,
      type: 'uuid',
      generated: 'uuid',
    },
    nome: {
      type: 'varchar',
      length: 100,
    },
    email: {
      type: 'varchar',
      length: 100,
      unique: true,
    },
    senha: {
      type: 'varchar',
      length: 100,
    },
    cargo: {
      type: 'varchar',
      length: 50,
      nullable: true,
    },
    ativo: {
      type: 'boolean',
      default: true,
    },
    dataCriacao: {
      type: 'timestamp',
      createDate: true,
    },
    dataAtualizacao: {
      type: 'timestamp',
      updateDate: true,
    },
  },
  indices: [
    {
      name: 'IDX_USER_EMAIL',
      columns: ['email'],
      unique: true,
    }
  ]
}); 