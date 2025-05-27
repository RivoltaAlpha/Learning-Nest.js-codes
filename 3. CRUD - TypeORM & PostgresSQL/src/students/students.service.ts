import { Injectable } from '@nestjs/common';
import { CreateStudentDto, UpdateStudentDto } from './dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Student } from './entities/student.entity';
import { Repository } from 'typeorm';

@Injectable()
export class StudentsService {
  constructor(
    @InjectRepository(Student) private studentRepository: Repository<Student>,
  ) {}

  async create(createStudentDto: CreateStudentDto): Promise<string> {
    return await this.studentRepository
      .save(createStudentDto)
      .then((student) => {
        return `Student with id ${student.id} has been created`;
      })
      .catch((error) => {
        console.error('Error creating student:', error);
        throw new Error('Failed to create student');
      });
  }

  async findAll(name?: string): Promise<Student[] | Student> {
    if (name) {
      return await this.studentRepository.find({
        where: {
          profile: {
            firstName: name,
          },
        },
        relations: ['profile'], // Ensure to load the profile relation
      });
    }
    return await this.studentRepository.find({
      relations: ['profile'], // Ensure to load the profile relation
    });
  }

  async findOne(id: number): Promise<Student | string> {
    return await this.studentRepository
      .findOneBy({ id })
      .then((student) => {
        if (!student) {
          return `No student found with id ${id}`;
        }
        return student;
      })
      .catch((error) => {
        console.error('Error finding student:', error);
        throw new Error(`Failed to find student with id ${id}`);
      });
  }

  async update(id: number, updateStudentDto: UpdateStudentDto) {
    return await this.studentRepository
      .update(id, updateStudentDto)
      .then((result) => {
        if (result.affected === 0) {
          return `No student found with id ${id}`;
        }
      })
      .catch((error) => {
        console.error('Error updating student:', error);
        throw new Error(`Failed to update student with id ${id}`);
      });
  }

  async remove(id: number): Promise<string> {
    return await this.studentRepository
      .delete(id)
      .then((result) => {
        if (result.affected === 0) {
          return `No student found with id ${id}`;
        }
        return `Student with id ${id} has been removed`;
      })
      .catch((error) => {
        console.error('Error removing student:', error);
        throw new Error(`Failed to remove student with id ${id}`);
      });
  }
}
