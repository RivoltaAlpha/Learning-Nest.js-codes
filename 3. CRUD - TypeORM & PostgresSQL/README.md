# School Management

please check the [api design](./API Design.md)

## ENV Configuration

A good approach for using this technique in Nest is to create a `ConfigModule` that exposes a `ConfigService` which loads the appropriate `.env` file. While you may choose to write such a module yourself, for convenience Nest provides the `@nestjs/config` package out-of-the box. We'll cover this package in the current chapter.

```bash
npm i --save @nestjs/config
```

### Config app.module.ts

Typically, we'll import it into the root `AppModule` and control its behavior using the `.forRoot()` static method. During this step, environment variable key/value pairs are parsed and resolved.

`app.module.ts`

```typescript

import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

@Module({
  imports: [
	ConfigModule.forRoot({
      		isGlobal: true,
      		envFilePath: '.env',
   	 }),
	],
})
export class AppModule {}

```

using ` main.ts` with .env

```typescript
import { ConfigService } from '@nestjs/config';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.useGlobalPipes(new ValidationPipe());

  const configService = app.get(ConfigService);
  const PORT = configService.getOrThrow<number>('PORT');

  await app.listen(PORT);
}
bootstrap();
```

install packages

```bash
pnpm add @nestjs/typeorm typeorm pg @types/pg
```

### TypeORM Integration

For integrating with SQL and NoSQL databases, Nest provides the `@nestjs/typeorm` package. [TypeORM](https://github.com/typeorm/typeorm) is the most mature Object Relational Mapper (ORM) available for TypeScript. TypeORM provides support for many relational databases, such as `PostgreSQL`, `Oracle`, `Microsoft SQL Server`, `SQLite`, and even `NoSQL`

create a `database.module.ts`

```bash
nest g mo database
```

add below code to `database.module.ts`

```typescript
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';

@Module({
  imports: [
    ConfigModule,
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        type: 'postgres',
        host: configService.getOrThrow<string>('DB_HOST'),
        port: configService.getOrThrow<number>('DB_PORT'),
        username: configService.getOrThrow<string>('DB_USERNAME'),
        password: configService.getOrThrow<string>('DB_PASSWORD'),
        database: configService.getOrThrow<string>('DB_NAME'),
        entities: [__dirname + '/../**/*.entity{.ts,.js}'],
        synchronize: configService.getOrThrow<boolean>('DB_SYNC', true),
        logging: configService.getOrThrow<boolean>('DB_LOGGING', false),
        migrations: [__dirname + '/../migrations/**/*{.ts,.js}'],
      }),
      inject: [ConfigService],
    }),
  ],
})
export class DatabaseModule {}

```

#### Repository pattern

[TypeORM](https://github.com/typeorm/typeorm) supports the  **repository design pattern** , so each entity has its own repository. These repositories can be obtained from the database data source.

### one-to-one relation

Here, we are using a new decorator called `@OneToOne`. It allows us to create a one-to-one relationship between two entities.

We also add a `@JoinColumn` decorator, which indicates that this side of the relationship will own the relationship. Relations can be unidirectional or bidirectional. Only one side of relational can be owning. Using `@JoinColumn` decorator is required on the owner side of the relationship.

Points to note

1. The Student entity owns the relationship (has the foreign key column via `@JoinColumn())`
2. You can add `cascade` and `delete` behavior for better data integrity

`student.entity.ts`

```typescript
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  OneToOne,
  ManyToMany,
  JoinTable,
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

  @Column({ nullable: true })
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

```

> If you use ESM in your TypeScript project, you should use the `Relation` wrapper type in relation properties to avoid circular dependency issues. Let's modify our entities:

To use this entity we must register it in the `student.module.ts`. Also we need to import the `DatabaseModule ` since we will need it to use in the `student.service.ts`

`student.module.ts`

```typescript
import { Module } from '@nestjs/common';
import { StudentsService } from './students.service';
import { StudentsController } from './students.controller';
import { DatabaseModule } from 'src/database/database.module';
import { Student } from './entities/student.entity';
import { TypeOrmModule } from '@nestjs/typeorm';

@Module({
  imports: [
    DatabaseModule,
    TypeOrmModule.forFeature([Student])
  ],
  controllers: [StudentsController],
  providers: [StudentsService],
})
export class StudentsModule {}
```


### Inverse side of the relationship (Profile)

Relations can be `unidirectional` or `bidirectional`. Currently, our relation between `student `and `profile`. The owner of the relation is student and profile doesn't know anything about student. We need to add an `inverse relation`, and make relations between Profile and Student bidirectional

`profile.entity.ts`

```typescript
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  OneToOne,
  Relation,
} from 'typeorm';
import { Student } from '../../students/entities/student.entity';

enum Role {
  STUDENT = 'student',
  FACULTY = 'faculty',
  ADMIN = 'admin',
  GUEST = 'guest',
}

@Entity()
export class Profile {
  @PrimaryGeneratedColumn('increment')
  id: number;

  @Column()
  first_name: string;

  @Column()
  last_name: string;

  @Column()
  email: string;

  @Column({ type: 'enum', enum: Role, default: Role.GUEST })
  role: Role;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  created_at: Date;

  @Column({
    type: 'timestamp',
    default: () => 'CURRENT_TIMESTAMP',
    onUpdate: 'CURRENT_TIMESTAMP',
  })
  updated_at: Date;

  @OneToOne(() => Student, (student) => student.profile)
  student: Relation<Student>;
}

```


To use this entity we must register it in the `profile.module.ts`. Also we need to import the `DatabaseModule ` since we will need it to use in the `profile.service.ts`

`profile.module.ts`

```typescript
import { Module } from '@nestjs/common';
import { ProfilesService } from './profiles.service';
import { ProfilesController } from './profiles.controller';
import { DatabaseModule } from 'src/database/database.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Profile } from './entities/profile.entity';

@Module({
  imports: [DatabaseModule, TypeOrmModule.forFeature([Profile])],
  controllers: [ProfilesController],
  providers: [ProfilesService],
  exports: [ProfilesService],
})
export class ProfileModule { }
```
