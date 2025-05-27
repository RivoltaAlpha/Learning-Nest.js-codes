import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateCourseDto } from './dto/create-course.dto';
import { UpdateCourseDto } from './dto/update-course.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Course } from './entities/course.entity';
import { Repository, Like } from 'typeorm';
import { Department } from '../departments/entities/department.entity';

@Injectable()
export class CoursesService {
  constructor(
    @InjectRepository(Course) private courseRepository: Repository<Course>,
    @InjectRepository(Department)
    private departmentRepository: Repository<Department>,
  ) {}

  async create(createCourseDto: CreateCourseDto): Promise<Course> {
    // Find the department
    const department = await this.departmentRepository.findOne({
      where: { id: createCourseDto.departmentId },
    });

    if (!department) {
      throw new NotFoundException(
        `Department with ID ${createCourseDto.departmentId} not found`,
      );
    }

    // Create a new course instance
    const newCourse = this.courseRepository.create({
      title: createCourseDto.title,
      description: createCourseDto.description,
      credits: createCourseDto.credits,
      duration: createCourseDto.duration,
      startDate: createCourseDto.startDate,
      endDate: createCourseDto.endDate,
      department: createCourseDto.departmentId,
    });

    // Save the course to the database
    return this.courseRepository.save(newCourse);
  }

  async findAll(search?: string): Promise<Course[]> {
    if (search) {
      return this.courseRepository.find({
        where: [
          { title: Like(`%${search}%`) },
          { description: Like(`%${search}%`) },
        ],
        relations: ['department'],
      });
    }
    return this.courseRepository.find({
      relations: ['department'],
    });
  }

  async findOne(id: number): Promise<Course> {
    const course = await this.courseRepository.findOne({
      where: { id },
      relations: ['department'],
    });

    if (!course) {
      throw new NotFoundException(`Course with ID ${id} not found`);
    }

    return course;
  }

  async update(id: number, updateCourseDto: UpdateCourseDto): Promise<Course> {
    // First check if the course exists
    const course = await this.courseRepository.findOne({
      where: { id },
    });

    if (!course) {
      throw new NotFoundException(`Course with ID ${id} not found`);
    }

    // If departmentId is provided, find the department
    if (updateCourseDto.departmentId) {
      const departmentId = await this.departmentRepository.findOne({
        where: { id: updateCourseDto.departmentId },
      });

      if (!departmentId) {
        throw new NotFoundException(
          `Department with ID ${updateCourseDto.departmentId} not found`,
        );
      }
    }

    // Update the course
    await this.courseRepository.update(id, {
      title: updateCourseDto.title,
      description: updateCourseDto.description,
      credits: updateCourseDto.credits,
      duration: updateCourseDto.duration,
      startDate: updateCourseDto.startDate,
      endDate: updateCourseDto.endDate,
      department: updateCourseDto.departmentId,
    });

    // Return the updated course
    return this.findOne(id);
  }

  async remove(id: number): Promise<void> {
    const result = await this.courseRepository.delete(id);

    if (result.affected === 0) {
      throw new NotFoundException(`Course with ID ${id} not found`);
    }
  }
}
