import { EntitySchema } from 'typeorm';

export const ItemNotaFiscal = new EntitySchema({
  name: 'ItemNotaFiscal',
  tableName: 'itens_nota_fiscal',
  columns: {
    id: {
      primary: true,
      type: 'uuid',
      generated: 'uuid',
    },
    codigo: {
      type: 'varchar',
      length: 50,
    },
    descricao: {
      type: 'varchar',
      length: 255,
    },
    unidade: {
      type: 'varchar',
      length: 10,
    },
    quantidade: {
      type: 'decimal',
      precision: 12,
      scale: 3,
    },
    valorUnitario: {
      type: 'decimal',
      precision: 12,
      scale: 4,
    },
    valorTotal: {
      type: 'decimal',
      precision: 12,
      scale: 2,
    },
    hl: {
      type: 'decimal',
      precision: 12,
      scale: 3,
      comment: 'Volume em hectolitros',
    },
    cadastrado: {
      type: 'boolean',
      default: false,
    },
  },
  relations: {
    notaFiscal: {
      type: 'many-to-one',
      target: 'NotaFiscal',
      joinColumn: {
        name: 'notaFiscalId',
        referencedColumnName: 'id',
      },
      onDelete: 'CASCADE',
    },
    sku: {
      type: 'many-to-one',
      target: 'Sku',
      joinColumn: {
        name: 'skuId',
        referencedColumnName: 'id',
      },
      nullable: true,
    },
  },
  indices: [
    {
      name: 'IDX_ITEM_NF_CODIGO',
      columns: ['codigo'],
    },
    {
      name: 'IDX_ITEM_NF_NOTA_FISCAL',
      columns: ['notaFiscalId'],
    },
  ],
}); 