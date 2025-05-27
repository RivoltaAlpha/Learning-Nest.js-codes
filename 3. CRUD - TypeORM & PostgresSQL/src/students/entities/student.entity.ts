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
  enrollmentDate: string;

  @Column({ nullable: true })
  degreeProgram: string;

  @Column({ type: 'decimal', precision: 3, scale: 2, nullable: true })
  gpa: number;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  createdAt: Date;

  @Column({
    type: 'timestamp',
    default: () => 'CURRENT_TIMESTAMP',
    onUpdate: 'CURRENT_TIMESTAMP',
  })
  updatedAt: Date;

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
