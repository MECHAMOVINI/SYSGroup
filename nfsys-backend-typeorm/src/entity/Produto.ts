import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany
} from "typeorm";
import { ProdutoNotaFiscal } from "./ProdutoNotaFiscal";

@Entity("produtos")
export class Produto {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column({ unique: true })
  codigo!: string;

  @Column()
  descricao!: string;

  @Column({ nullable: true })
  unidade!: string;

  @Column({ name: "preco_medio", type: "decimal", precision: 10, scale: 2, nullable: true })
  precoMedio!: number;

  @CreateDateColumn({ name: "created_at" })
  createdAt!: Date;

  @UpdateDateColumn({ name: "updated_at" })
  updatedAt!: Date;

  @OneToMany(() => ProdutoNotaFiscal, (produtoNota) => produtoNota.produto)
  notasFiscaisProduto!: ProdutoNotaFiscal[];
} 