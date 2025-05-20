import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Unique
} from "typeorm";
import { NotaFiscal } from "./NotaFiscal";
import { Produto } from "./Produto";

@Entity("produtos_notas_fiscais")
@Unique(["notaFiscalId", "produtoId"])
export class ProdutoNotaFiscal {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column({ name: "nota_fiscal_id" })
  notaFiscalId!: string;

  @Column({ name: "produto_id" })
  produtoId!: string;

  @Column({ type: "decimal", precision: 10, scale: 3 })
  quantidade!: number;

  @Column({ name: "valor_unitario", type: "decimal", precision: 10, scale: 2 })
  valorUnitario!: number;

  @Column({ name: "valor_total", type: "decimal", precision: 10, scale: 2 })
  valorTotal!: number;

  @CreateDateColumn({ name: "created_at" })
  createdAt!: Date;

  @ManyToOne(() => NotaFiscal, (notaFiscal) => notaFiscal.produtosNota, {
    onDelete: "CASCADE"
  })
  @JoinColumn({ name: "nota_fiscal_id" })
  notaFiscal!: NotaFiscal;

  @ManyToOne(() => Produto, (produto) => produto.notasFiscaisProduto, {
    onDelete: "RESTRICT"
  })
  @JoinColumn({ name: "produto_id" })
  produto!: Produto;
} 