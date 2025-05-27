import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  // OneToMany,
} from 'typeorm';
import { Department } from '../../departments/entities/department.entity';
// import { Lecture } from './lecture.entity';

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
  department: Department['id']; // store only the department ID

  // @OneToMany(() => Lecture, (lecture) => lecture.course)
  // lectures: Lecture[];
}
