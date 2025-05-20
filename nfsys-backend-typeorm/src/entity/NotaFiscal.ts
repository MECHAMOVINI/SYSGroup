import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  OneToMany
} from "typeorm";
import { Empresa } from "./Empresa";
import { ProdutoNotaFiscal } from "./ProdutoNotaFiscal";

@Entity("notas_fiscais")
export class NotaFiscal {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column()
  numero!: string;

  @Column()
  serie!: string;

  @Column({ name: "data_emissao", type: "timestamp" })
  dataEmissao!: Date;

  @Column({ name: "valor_total", type: "decimal", precision: 10, scale: 2 })
  valorTotal!: number;

  @Column({ name: "chave_acesso", unique: true })
  chaveAcesso!: string;

  @Column({ name: "xml_content", nullable: true, type: "text" })
  xmlContent!: string;

  @CreateDateColumn({ name: "created_at" })
  createdAt!: Date;

  @UpdateDateColumn({ name: "updated_at" })
  updatedAt!: Date;

  @Column()
  empresaId!: string;

  @ManyToOne(() => Empresa, (empresa) => empresa.notasFiscais)
  @JoinColumn({ name: "empresa_id" })
  empresa!: Empresa;

  @OneToMany(() => ProdutoNotaFiscal, (produtoNota) => produtoNota.notaFiscal, {
    cascade: true
  })
  produtosNota!: ProdutoNotaFiscal[];
} 