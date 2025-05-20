import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany
} from "typeorm";
import { NotaFiscal } from "./NotaFiscal";

@Entity("empresas")
export class Empresa {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column({ unique: true })
  cnpj!: string;

  @Column()
  razaoSocial!: string;

  @Column({ nullable: true })
  nomeFantasia!: string;

  @Column({ unique: true })
  emailCorporativoLogin!: string;

  @Column({ unique: true })
  tokenAcesso!: string;

  @Column({ default: 1 })
  limiteAcessosSimultaneos!: number;

  @Column({ default: true })
  ativa!: boolean;

  @CreateDateColumn({ name: "created_at" })
  createdAt!: Date;

  @UpdateDateColumn({ name: "updated_at" })
  updatedAt!: Date;

  @OneToMany(() => NotaFiscal, (notaFiscal) => notaFiscal.empresa)
  notasFiscais!: NotaFiscal[];
} 