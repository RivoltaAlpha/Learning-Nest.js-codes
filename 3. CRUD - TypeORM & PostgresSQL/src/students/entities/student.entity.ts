import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  OneToOne,
  // ManyToMany,
  // JoinTable,
  JoinColumn,
  Relation,
} from 'typeorm';
import { Profile } from '../../profiles/entities/profile.entity';
// import { Course } from './course.entity';

@Entity()
export class Student {
  @PrimaryGeneratedColumn()
  id: number;

  @Column('date')
  enrollment_date: string;

  @Column({ nullable: true })
  degree_program: string;

  @Column({ type: 'decimal', precision: 3, scale: 2, nullable: true })
  gpa: number;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  created_at: Date;

  @Column({
    type: 'timestamp',
    default: () => 'CURRENT_TIMESTAMP',
    onUpdate: 'CURRENT_TIMESTAMP',
  })
  updated_at: Date;

  @OneToOne(() => Profile, (profile) => profile.student, {
    cascade: true,
    onDelete: 'CASCADE',
  })
  @JoinColumn()
  profile: Relation<Profile>;

  //   @ManyToMany(() => Course)
  //   @JoinTable() // Define the join table for the many-to-many relationship
  //   courses: Course[];
}
