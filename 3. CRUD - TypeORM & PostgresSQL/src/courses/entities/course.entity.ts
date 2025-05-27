import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  ManyToMany,
  Relation,
} from 'typeorm';
import { Department } from '../../departments/entities/department.entity';
import { Student } from 'src/students/entities/student.entity';

@Entity()
export class Course {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  title: string;

  @Column({ nullable: true })
  description: string;

  @Column('int')
  credits: number;

  @Column({ nullable: true })
  duration: string;

  @Column('date', { nullable: true })
  startDate: string;

  @Column('date', { nullable: true })
  endDate: string;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  createdAt: Date;

  @Column({
    type: 'timestamp',
    default: () => 'CURRENT_TIMESTAMP',
    onUpdate: 'CURRENT_TIMESTAMP',
  })
  updatedAt: Date;

  @ManyToOne(() => Department, (department) => department.id)
  department: Relation<Department['id']>; // store only the department ID

  @ManyToMany(() => Student, (student) => student.id)
  students: Relation<Student[]>;
}
