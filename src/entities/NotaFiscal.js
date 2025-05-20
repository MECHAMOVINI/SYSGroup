import { EntitySchema } from 'typeorm';

export const NotaFiscal = new EntitySchema({
  name: 'NotaFiscal',
  tableName: 'notas_fiscais',
  columns: {
    id: {
      primary: true,
      type: 'uuid',
      generated: 'uuid',
    },
    numero: {
      type: 'varchar',
      length: 20,
    },
    serie: {
      type: 'varchar',
      length: 5,
    },
    chaveAcesso: {
      type: 'varchar',
      length: 50,
      unique: true,
    },
    dataEmissao: {
      type: 'date',
    },
    valorTotal: {
      type: 'decimal',
      precision: 12,
      scale: 2,
    },
    volumeTotal: {
      type: 'decimal',
      precision: 12,
      scale: 3,
      comment: 'Volume total em hectolitros',
    },
    emitente: {
      type: 'jsonb',
    },
    destinatario: {
      type: 'jsonb',
    },
    transportadora: {
      type: 'jsonb',
      nullable: true,
    },
    dataImportacao: {
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
      name: 'IDX_NF_CHAVE_ACESSO',
      columns: ['chaveAcesso'],
      unique: true,
    },
    {
      name: 'IDX_NF_NUMERO_SERIE',
      columns: ['numero', 'serie'],
    },
    {
      name: 'IDX_NF_DATA_EMISSAO',
      columns: ['dataEmissao'],
    },
  ],
  relations: {
    produtos: {
      type: 'one-to-many',
      target: 'ItemNotaFiscal',
      inverseSide: 'notaFiscal',
      cascade: true,
    },
  },
}); 