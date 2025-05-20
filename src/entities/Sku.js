import { EntitySchema } from 'typeorm';

export const Sku = new EntitySchema({
  name: 'Sku',
  tableName: 'skus',
  columns: {
    id: {
      primary: true,
      type: 'uuid',
      generated: 'uuid',
    },
    codigo: {
      type: 'varchar',
      length: 50,
      unique: true,
    },
    descricao: {
      type: 'varchar',
      length: 255,
    },
    unidade: {
      type: 'varchar',
      length: 10,
    },
    fatorHl: {
      type: 'decimal',
      precision: 10,
      scale: 6,
      comment: 'Fator para conversão em hectolitros',
    },
    familia: {
      type: 'varchar',
      length: 50,
      nullable: true,
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
      name: 'IDX_SKU_CODIGO',
      columns: ['codigo'],
      unique: true,
    }
  ]
}); 